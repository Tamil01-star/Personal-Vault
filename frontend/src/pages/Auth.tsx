import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, KeyRound, Phone, User, Eye, EyeOff, CheckCircle } from 'lucide-react';

type AuthMode = 'login' | 'register' | 'forgot' | 'reset';

export const Auth: React.FC = () => {
  const { login, register, forgotPassword, resetPassword } = useAuth();
  
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
      const result = await forgotPassword(mobileNumber);
      setSuccess('Simulated OTP sent to your registered mobile number.');
      if (result.otp) {
        setSimulatedOtp(result.otp);
      }
      setTimeout(() => {
        setMode('reset');
      }, 1500);
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
    setError(null);
    setIsLoading(true);
    try {
      await resetPassword(mobileNumber, otp, newPassword);
      setSuccess('Password reset successful! You can now log in.');
      setSimulatedOtp(null);
      setTimeout(() => {
        setMode('login');
        setPassword('');
        setUsernameOrMobile(mobileNumber);
        resetMessages();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Error resetting password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#090f1d] px-4 overflow-hidden relative">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500/10 blur-[120px]" />

      <div className="w-full max-w-md bg-slate-900/40 border border-slate-800/80 backdrop-blur-xl rounded-2xl shadow-2xl p-8 relative z-10 transition-all duration-300">
        
        {/* Header logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/25 mb-3">
            <ShieldAlert size={26} className="rotate-180" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Secure Personal Vault</h2>
          <p className="text-slate-400 text-xs mt-1 text-center">
            Your encrypted passwords, letters, files and diaries.
          </p>
        </div>

        {/* Display Simulated OTP Alert Banner */}
        {simulatedOtp && (
          <div className="mb-4 p-3.5 bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 rounded-xl text-xs flex flex-col gap-1.5 animate-pulse">
            <span className="font-semibold flex items-center gap-1.5">
              <CheckCircle size={14} className="text-indigo-400" />
              Simulated Mobile SMS OTP Code
            </span>
            <p>Your OTP verification code is: <strong className="text-white text-base tracking-widest bg-slate-950 px-2 py-0.5 rounded ml-1">{simulatedOtp}</strong></p>
          </div>
        )}

        {/* Alert banners */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-medium">
            {error}
          </div>
        )}
        {success && !simulatedOtp && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-medium">
            {success}
          </div>
        )}

        {/* MODE: LOGIN */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-slate-300 text-xs font-medium mb-1.5">Username or Mobile Number</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <User size={16} />
                </span>
                <input
                  type="text"
                  placeholder="Enter username or mobile"
                  value={usernameOrMobile}
                  onChange={(e) => setUsernameOrMobile(e.target.value)}
                  className="w-full bg-slate-950/45 border border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-slate-300 text-xs font-medium">Password</label>
                <button
                  type="button"
                  onClick={() => handleModeChange('forgot')}
                  className="text-xs text-primary hover:text-indigo-300 hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <KeyRound size={16} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter vault password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950/45 border border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl py-2.5 pl-10 pr-10 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-white py-2.5 rounded-xl text-sm font-semibold shadow-md shadow-primary/20 hover:bg-indigo-500 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:scale-100 transition-all duration-200 mt-2"
            >
              {isLoading ? 'Opening Vault...' : 'Access Vault'}
            </button>

            <div className="text-center text-slate-400 text-xs mt-6">
              New to Secure Vault?{' '}
              <button
                type="button"
                onClick={() => handleModeChange('register')}
                className="text-primary font-semibold hover:underline"
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
              <label className="block text-slate-300 text-xs font-medium mb-1.5">Username</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <User size={16} />
                </span>
                <input
                  type="text"
                  placeholder="Choose username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-950/45 border border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 text-xs font-medium mb-1.5">Mobile Number</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Phone size={16} />
                </span>
                <input
                  type="tel"
                  placeholder="Registered mobile number"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  className="w-full bg-slate-950/45 border border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 text-xs font-medium mb-1.5">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <KeyRound size={16} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Vault Master password (min. 6 chars)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950/45 border border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl py-2.5 pl-10 pr-10 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-white py-2.5 rounded-xl text-sm font-semibold shadow-md shadow-primary/20 hover:bg-indigo-500 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:scale-100 transition-all duration-200 mt-2"
            >
              {isLoading ? 'Creating Vault...' : 'Create Secure Vault'}
            </button>

            <div className="text-center text-slate-400 text-xs mt-6">
              Already have a vault?{' '}
              <button
                type="button"
                onClick={() => handleModeChange('login')}
                className="text-primary font-semibold hover:underline"
              >
                Log In
              </button>
            </div>
          </form>
        )}

        {/* MODE: FORGOT */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <p className="text-xs text-slate-400 leading-relaxed mb-4 text-center">
              Enter your registered mobile number below. We will simulate sending a 6-digit OTP verification code to verify ownership and reset your password.
            </p>

            <div>
              <label className="block text-slate-300 text-xs font-medium mb-1.5">Mobile Number</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Phone size={16} />
                </span>
                <input
                  type="tel"
                  placeholder="Enter registered mobile"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  className="w-full bg-slate-950/45 border border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-500 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:scale-100 transition-all duration-200"
            >
              {isLoading ? 'Verifying...' : 'Send OTP Verification'}
            </button>

            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => handleModeChange('login')}
                className="text-xs text-slate-500 hover:text-slate-300"
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
              <label className="block text-slate-300 text-xs font-medium mb-1.5">OTP Code</label>
              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                className="w-full bg-slate-950/45 border border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl py-2.5 px-4 text-center text-lg tracking-widest text-white placeholder-slate-700 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-slate-300 text-xs font-medium mb-1.5">New Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <KeyRound size={16} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter new master password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-950/45 border border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl py-2.5 pl-10 pr-10 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-500 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:scale-100 transition-all duration-200"
            >
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </button>

            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => handleModeChange('login')}
                className="text-xs text-slate-500 hover:text-slate-300"
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
