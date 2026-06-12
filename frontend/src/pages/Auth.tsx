import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ShieldAlert, KeyRound, Phone, User, Eye, EyeOff, CheckCircle, Sun, Moon } from 'lucide-react';
import { RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from 'firebase/auth';
import { auth as firebaseAuth } from '../config/firebase';
import { API_BASE_URL } from '../context/AuthContext';

type AuthMode = 'login' | 'register' | 'forgot' | 'reset';

export const Auth: React.FC = () => {
  const { login, register, forgotPassword } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  const [mode, setMode] = useState<AuthMode>('login');
  
  // Fields
  const [username, setUsername] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [usernameOrMobile, setUsernameOrMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  // States
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [simulatedOtp, setSimulatedOtp] = useState<string | null>(null);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [useTestMode, setUseTestMode] = useState(false);

  const resetMessages = () => {
    setError(null);
    setSuccess(null);
    setSimulatedOtp(null);
  };

  const handleModeChange = (newMode: AuthMode) => {
    setMode(newMode);
    resetMessages();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameOrMobile || !password) return setError('Please fill in all fields.');
    setError(null);
    setIsLoading(true);
    try {
      await login(usernameOrMobile, password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !mobileNumber || !password) return setError('Please fill in all fields.');
    if (mobileNumber.length < 10) return setError('Mobile number must be at least 10 digits.');
    if (password.length < 6) return setError('Password must be at least 6 characters.');
    setError(null);
    setIsLoading(true);
    try {
      await register(username, mobileNumber, password);
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobileNumber) return setError('Please enter your registered mobile number.');
    setError(null);
    setIsLoading(true);
    try {
      // 1. Verify if mobile number is registered in our local DB first
      await forgotPassword(mobileNumber);
      
      // Clear existing verifier if it exists to avoid "reCAPTCHA already rendered"
      if ((window as any).recaptchaVerifier) {
        try {
          (window as any).recaptchaVerifier.clear();
        } catch (e) {
          console.error('Error clearing recaptcha verifier:', e);
        }
        const container = document.getElementById('recaptcha-container');
        if (container) {
          container.innerHTML = '';
        }
      }

      // Set Firebase test setting based on toggled state
      firebaseAuth.settings.appVerificationDisabledForTesting = useTestMode;

      // 2. Initialize invisible reCAPTCHA verifier
      const recaptchaVerifier = new RecaptchaVerifier(firebaseAuth, 'recaptcha-container', {
        size: 'invisible'
      });
      (window as any).recaptchaVerifier = recaptchaVerifier;
      
      // 3. Format mobile number (+91 for India default if missing)
      const formattedPhone = mobileNumber.startsWith('+') ? mobileNumber : `+91${mobileNumber}`;
      
      // 4. Trigger Firebase SMS
      const confirmation = await signInWithPhoneNumber(firebaseAuth, formattedPhone, recaptchaVerifier);
      setConfirmationResult(confirmation);
      
      setSuccess(
        useTestMode
          ? 'Test Mode: Session initialized. Please enter the Test OTP code you configured in your Firebase Console!'
          : 'A real SMS verification code has been sent to your mobile phone!'
      );
      setMode('reset');
    } catch (err: any) {
      setError(err.message || 'Error occurred. Please verify your mobile number.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobileNumber || !otp || !newPassword) return setError('Please fill in all fields.');
    if (newPassword.length < 6) return setError('New password must be at least 6 characters.');
    if (!confirmationResult) return setError('Verification session expired. Please request a new OTP.');
    
    setError(null);
    setIsLoading(true);
    try {
      // 1. Confirm code with Firebase
      const userCredential = await confirmationResult.confirm(otp);
      
      // 2. Retrieve Firebase JWT Token
      const idToken = await userCredential.user.getIdToken();
      
      // 3. Send verified token to backend
      const res = await fetch(`${API_BASE_URL}/auth/reset-password-firebase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, mobile_number: mobileNumber, new_password: newPassword })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Server rejected password reset.');
      
      setSuccess('Password reset successful! You can now log in.');
      setSimulatedOtp(null);
      setConfirmationResult(null);
      setTimeout(() => {
        setMode('login');
        setPassword('');
        setUsernameOrMobile(mobileNumber);
        resetMessages();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Error resetting password. Please check your OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background px-4 py-12 overflow-y-auto overflow-x-hidden relative transition-colors duration-300">
      
      {/* Floating Theme Switcher at Top Right */}
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 z-50 p-2.5 rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground shadow-sm transition-all"
        title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        {theme === 'dark' ? <Sun size={15} className="text-amber-500 animate-spin-slow" /> : <Moon size={15} className="text-indigo-500" />}
      </button>

      {/* Decorative Blur Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/5 blur-[120px]" />

      <div className="w-full max-w-md bg-card/85 backdrop-blur-md border border-border/80 rounded-2xl shadow-md p-8 relative z-10 transition-all duration-300 hover:shadow-lg">
        
        {/* Header logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/25 mb-3">
            <ShieldAlert size={26} className="rotate-180" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Secure Personal Vault</h2>
          <p className="text-muted-foreground text-xs mt-1.5 text-center font-medium">
            Your encrypted passwords, letters, files and diaries.
          </p>
        </div>

        {/* Display Simulated OTP Alert Banner */}
        {simulatedOtp && (
          <div className="mb-4 p-3.5 bg-indigo-500/10 border border-indigo-500/25 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs flex flex-col gap-1.5 font-medium animate-pulse">
            <span className="font-bold flex items-center gap-1.5">
              <CheckCircle size={14} className="text-indigo-500 dark:text-indigo-400" />
              Simulated Mobile SMS OTP Code
            </span>
            <p>Your OTP verification code is: <strong className="text-foreground text-sm tracking-widest bg-muted border border-border px-2 py-0.5 rounded ml-1 font-bold">{simulatedOtp}</strong></p>
          </div>
        )}

        {/* Alert banners */}
        {error && (
          <div className="mb-4 p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-600 rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}
        {success && !simulatedOtp && (
          <div className="mb-4 p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-xl text-xs font-semibold">
            {success}
          </div>
        )}

        {/* MODE: LOGIN */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-muted-foreground text-xs font-bold uppercase tracking-wider mb-1.5">Username or Mobile Number</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted-foreground/85">
                  <User size={16} />
                </span>
                <input
                  type="text"
                  placeholder="Enter username or mobile"
                  value={usernameOrMobile}
                  onChange={(e) => setUsernameOrMobile(e.target.value)}
                  className="w-full premium-input pl-10 pr-4 py-2.5 text-sm transition-all focus:ring-4 focus:ring-primary/10"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-muted-foreground text-xs font-bold uppercase tracking-wider">Password</label>
                <button
                  type="button"
                  onClick={() => handleModeChange('forgot')}
                  className="text-xs text-primary font-bold hover:underline transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted-foreground/85">
                  <KeyRound size={16} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter vault password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full premium-input pl-10 pr-10 py-2.5 text-sm transition-all focus:ring-4 focus:ring-primary/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-muted-foreground/70 hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-2.5 text-sm shadow-md shadow-blue-500/15 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:scale-100 transition-all duration-200 mt-2"
            >
              {isLoading ? 'Opening Vault...' : 'Access Vault'}
            </button>

            <div className="text-center text-muted-foreground text-xs mt-6 font-medium">
              New to Secure Vault?{' '}
              <button
                type="button"
                onClick={() => handleModeChange('register')}
                className="text-primary font-bold hover:underline"
              >
                Sign Up Now
              </button>
            </div>
          </form>
        )}

        {/* MODE: REGISTER */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-muted-foreground text-xs font-bold uppercase tracking-wider mb-1.5">Username</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted-foreground/85">
                  <User size={16} />
                </span>
                <input
                  type="text"
                  placeholder="Choose username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full premium-input pl-10 pr-4 py-2.5 text-sm transition-all focus:ring-4 focus:ring-primary/10"
                />
              </div>
            </div>

            <div>
              <label className="block text-muted-foreground text-xs font-bold uppercase tracking-wider mb-1.5">Mobile Number</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted-foreground/85">
                  <Phone size={16} />
                </span>
                <input
                  type="tel"
                  placeholder="Registered mobile number"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  className="w-full premium-input pl-10 pr-4 py-2.5 text-sm transition-all focus:ring-4 focus:ring-primary/10"
                />
              </div>
            </div>

            <div>
              <label className="block text-muted-foreground text-xs font-bold uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted-foreground/85">
                  <KeyRound size={16} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Vault Master password (min. 6 chars)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full premium-input pl-10 pr-10 py-2.5 text-sm transition-all focus:ring-4 focus:ring-primary/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-muted-foreground/70 hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-2.5 text-sm shadow-md shadow-blue-500/15 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:scale-100 transition-all duration-200 mt-2"
            >
              {isLoading ? 'Creating Vault...' : 'Create Secure Vault'}
            </button>

            <div className="text-center text-muted-foreground text-xs mt-6 font-medium">
              Already have a vault?{' '}
              <button
                type="button"
                onClick={() => handleModeChange('login')}
                className="text-primary font-bold hover:underline"
              >
                Log In
              </button>
            </div>
          </form>
        )}

        {/* MODE: FORGOT */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <p className="text-xs text-muted-foreground font-medium leading-relaxed mb-4 text-center">
              Enter your registered mobile number below to verify your phone number and reset your master password.
            </p>

            <div className="flex items-start space-x-2 bg-slate-50 border border-slate-200/60 p-3 rounded-xl">
              <input
                type="checkbox"
                id="test-mode-toggle"
                checked={useTestMode}
                onChange={(e) => setUseTestMode(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-primary border-slate-300 focus:ring-primary/20"
              />
              <div className="flex-1">
                <label htmlFor="test-mode-toggle" className="text-xs font-semibold text-slate-700 cursor-pointer select-none">
                  Enable Firebase Test Mode (Fictional Numbers)
                </label>
                <p className="text-[10px] text-slate-500 mt-0.5 leading-normal">
                  Bypasses the Firebase SMS billing requirement. Fictional phone numbers and mock OTP codes must be configured first in your Firebase Console.
                </p>
              </div>
            </div>

            {useTestMode && (
              <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200/50 p-2.5 rounded-xl leading-normal space-y-1">
                <p className="font-bold">⚠️ Test Mode Active</p>
                <p>Ensure your test phone number (e.g. <code>+919999999999</code>) and test code (e.g. <code>123456</code>) are added under <strong>Firebase Console &gt; Authentication &gt; Sign-in method &gt; Phone &gt; Phone numbers for testing</strong>.</p>
              </div>
            )}

            <div>
              <label className="block text-muted-foreground text-xs font-bold uppercase tracking-wider mb-1.5">Mobile Number</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted-foreground/85">
                  <Phone size={16} />
                </span>
                <input
                  type="tel"
                  placeholder={useTestMode ? "e.g., +919999999999" : "Enter registered mobile"}
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  className="w-full premium-input pl-10 pr-4 py-2.5 text-sm transition-all focus:ring-4 focus:ring-primary/10"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-2.5 text-sm shadow-md shadow-blue-500/15 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:scale-100 transition-all duration-200"
            >
              {isLoading ? 'Verifying...' : 'Send OTP Verification'}
            </button>

            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => handleModeChange('login')}
                className="text-xs text-muted-foreground/70 hover:text-foreground font-semibold hover:underline"
              >
                Back to Login
              </button>
            </div>
          </form>
        )}

        {/* MODE: RESET */}
        {mode === 'reset' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-muted-foreground text-xs font-bold uppercase tracking-wider mb-1.5">OTP Code</label>
              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                className="w-full premium-input py-2.5 px-4 text-center text-lg tracking-widest focus:ring-4 focus:ring-primary/10 font-bold"
              />
            </div>

            <div>
              <label className="block text-muted-foreground text-xs font-bold uppercase tracking-wider mb-1.5">New Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted-foreground/85">
                  <KeyRound size={16} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter new master password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full premium-input pl-10 pr-10 py-2.5 text-sm transition-all focus:ring-4 focus:ring-primary/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-muted-foreground/70 hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-2.5 text-sm shadow-md shadow-blue-500/15 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:scale-100 transition-all duration-200"
            >
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </button>

            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => handleModeChange('login')}
                className="text-xs text-muted-foreground/70 hover:text-foreground font-semibold hover:underline"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
        <div id="recaptcha-container"></div>
      </div>
    </div>
  );
};
