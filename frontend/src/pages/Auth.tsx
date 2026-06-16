import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ShieldAlert, KeyRound, Phone, User, Eye, EyeOff, Sun, Moon, Mail } from 'lucide-react';
import { auth } from '../config/firebase';
import { verifyPasswordResetCode } from 'firebase/auth';

type AuthMode = 'login' | 'register' | 'forgot' | 'reset';

export const Auth: React.FC = () => {
  const { login, register, forgotPassword, verifyOtp, resetPassword, resetPasswordFirebaseEmail } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  const [mode, setMode] = useState<AuthMode>('login');
  
  // Fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [usernameOrMobile, setUsernameOrMobile] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [oobCode, setOobCode] = useState<string | null>(null);
  const [otp, setOtp] = useState('');
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1);
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const modeParam = params.get('mode');
    const codeParam = params.get('oobCode');

    if (modeParam === 'resetPassword' && codeParam) {
      setOobCode(codeParam);
      setMode('reset');
      
      // Auto-extract email from Firebase action code
      verifyPasswordResetCode(auth, codeParam)
        .then((verifiedEmail) => {
          setEmail(verifiedEmail);
        })
        .catch((err) => {
          console.error('Error verifying reset code:', err);
          setError('The password reset link is invalid or has expired.');
        });

      // Clean up the URL parameters
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);
  
  // States
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const resetMessages = () => {
    setError(null);
    setSuccess(null);
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
    if (!username || !email || !mobileNumber || !password) return setError('Please fill in all fields.');
    if (!email.includes('@')) return setError('Please enter a valid email address.');
    if (mobileNumber.length < 10) return setError('Mobile number must be at least 10 digits.');
    if (password.length < 6) return setError('Password must be at least 6 characters.');
    setError(null);
    setIsLoading(true);
    try {
      await register(username, email, mobileNumber, password);
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return setError('Please enter your registered email address.');
    setError(null);
    setIsLoading(true);
    try {
      const res = await forgotPassword(email);
      setSuccess(res.message || 'A 6-digit OTP verification code has been sent to your registered email address.');
      setForgotStep(2);
    } catch (err: any) {
      setError(err.message || 'Error occurred. Please verify your email.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !otp) return setError('Please enter the OTP verification code.');
    setError(null);
    setIsLoading(true);
    try {
      const res = await verifyOtp(email, otp);
      setSuccess(res.message || 'OTP verified successfully! Please enter your new password.');
      setForgotStep(3);
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please check the code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !newPassword) return setError('Please enter your registered email and new password.');
    if (newPassword !== confirmPassword) return setError('Passwords do not match. Please verify.');
    if (!oobCode && !otp) return setError('Please enter the 6-digit OTP verification code.');
    if (newPassword.length < 6) return setError('New password must be at least 6 characters.');
    
    setError(null);
    setIsLoading(true);
    try {
      if (oobCode) {
        await resetPasswordFirebaseEmail(email, oobCode, newPassword);
      } else {
        await resetPassword(email, otp, newPassword);
      }
      setSuccess('Password reset successful! Your password has been synchronized. You can now log in.');
      setTimeout(() => {
        handleCancelForgot();
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Error resetting password. OTP code may be invalid or expired.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelForgot = () => {
    setMode('login');
    setForgotStep(1);
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    resetMessages();
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

        {/* Alert banners */}
        {error && (
          <div className="mb-4 p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-600 rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-xl text-xs font-semibold">
            {success}
          </div>
        )}

        {/* MODE: LOGIN */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-muted-foreground text-xs font-bold uppercase tracking-wider mb-1.5">Username, Email, or Mobile</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted-foreground/85">
                  <User size={16} />
                </span>
                <input
                  type="text"
                  placeholder="Enter username, email, or mobile"
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
              <label className="block text-muted-foreground text-xs font-bold uppercase tracking-wider mb-1.5">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted-foreground/85">
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
              {isLoading ? 'Creating Account...' : 'Create Master Vault'}
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
          <div className="space-y-4">
            {/* Step 1: Request OTP */}
            {forgotStep === 1 && (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <p className="text-xs text-muted-foreground font-medium leading-relaxed mb-4 text-center">
                  Enter your registered email address below. We will send a 6-digit OTP verification code to verify your identity.
                </p>
                <div>
                  <label className="block text-muted-foreground text-xs font-bold uppercase tracking-wider mb-1.5">Email Address</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted-foreground/85">
                      <Mail size={16} />
                    </span>
                    <input
                      type="email"
                      placeholder="Enter registered email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full premium-input pl-10 pr-4 py-2.5 text-sm transition-all focus:ring-4 focus:ring-primary/10"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary w-full py-2.5 text-sm shadow-md shadow-blue-500/15 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:scale-100 transition-all duration-200"
                >
                  {isLoading ? 'Sending OTP...' : 'Send OTP Verification'}
                </button>
                <div className="text-center mt-4">
                  <button
                    type="button"
                    onClick={handleCancelForgot}
                    className="text-xs text-muted-foreground/70 hover:text-foreground font-semibold hover:underline"
                  >
                    Back to Login
                  </button>
                </div>
              </form>
            )}

            {/* Step 2: Verify OTP */}
            {forgotStep === 2 && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <p className="text-xs text-muted-foreground font-medium leading-relaxed mb-4 text-center">
                  Enter the 6-digit OTP verification code sent to <strong className="text-foreground">{email}</strong>.
                </p>
                <div>
                  <label className="block text-muted-foreground text-xs font-bold uppercase tracking-wider mb-1.5">OTP Code</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted-foreground/85">
                      <Mail size={16} />
                    </span>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="Enter 6-digit OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full premium-input pl-10 pr-4 py-2.5 text-sm transition-all focus:ring-4 focus:ring-primary/10"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary w-full py-2.5 text-sm shadow-md shadow-blue-500/15 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:scale-100 transition-all duration-200"
                >
                  {isLoading ? 'Verifying OTP...' : 'Verify OTP'}
                </button>
                <div className="flex justify-between items-center mt-4 px-1">
                  <button
                    type="button"
                    onClick={() => setForgotStep(1)}
                    className="text-xs text-muted-foreground/70 hover:text-foreground font-semibold hover:underline"
                  >
                    Change Email
                  </button>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-xs text-primary font-bold hover:underline"
                  >
                    Resend OTP
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: Set New Password */}
            {forgotStep === 3 && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <p className="text-xs text-muted-foreground font-medium leading-relaxed mb-4 text-center">
                  OTP verified successfully. Please choose a new master password for your vault.
                </p>
                <div className="text-center bg-primary/5 border border-primary/10 rounded-xl p-3 mb-2">
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">Verified Account</span>
                  <span className="text-xs text-foreground font-bold">{email}</span>
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
                <div>
                  <label className="block text-muted-foreground text-xs font-bold uppercase tracking-wider mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted-foreground/85">
                      <KeyRound size={16} />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Re-enter new master password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full premium-input pl-10 pr-10 py-2.5 text-sm transition-all focus:ring-4 focus:ring-primary/10"
                    />
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
                    onClick={handleCancelForgot}
                    className="text-xs text-muted-foreground/70 hover:text-foreground font-semibold hover:underline"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* MODE: RESET */}
        {mode === 'reset' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            {email && (
              <div className="text-center bg-primary/5 border border-primary/10 rounded-xl p-3 mb-2">
                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">Account Email</span>
                <span className="text-xs text-foreground font-bold">{email}</span>
              </div>
            )}

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

            <div>
              <label className="block text-muted-foreground text-xs font-bold uppercase tracking-wider mb-1.5">Confirm Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted-foreground/85">
                  <KeyRound size={16} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Re-enter new master password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full premium-input pl-10 pr-10 py-2.5 text-sm transition-all focus:ring-4 focus:ring-primary/10"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-2.5 text-sm shadow-md shadow-blue-500/15 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:scale-100 transition-all duration-200 mt-2"
            >
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </button>

            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-xs text-muted-foreground/70 hover:text-foreground font-semibold hover:underline"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
