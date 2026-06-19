import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../config/firebase';
import { sendPasswordResetEmail, confirmPasswordReset, signInWithEmailAndPassword } from 'firebase/auth';

export const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000/api'
  : 'https://personal-vault-8rfm.vercel.app/api';

interface User {
  id: number;
  username: string;
  email: string;
  mobile_number: string;
  created_at: string;
}

interface Stats {
  passwords: number;
  notes: number;
  diary: number;
  letters: number;
  files: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (usernameOrMobile: string, password: string) => Promise<{ message: string }>;
  register: (username: string, email: string, mobile_number: string, password: string) => Promise<{ message: string }>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<{ message: string }>;
  verifyOtp: (email: string, otp: string) => Promise<{ message: string }>;
  resetPassword: (email: string, otp: string, new_password: string) => Promise<{ message: string }>;
  resetPasswordFirebaseEmail: (email: string, oobCode: string, newPassword: string) => Promise<{ message: string }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ message: string }>;
  updateProfile: (username: string, email: string, mobile_number: string) => Promise<{ message: string; user: User }>;
  getStats: () => Promise<Stats>;
  deleteAccount: () => Promise<void>;
  apiCall: (endpoint: string, options?: RequestInit) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (storedToken && storedUser) {
        try {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        } catch (e) {
          logout();
        }
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (usernameOrMobile: string, password: string) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernameOrMobile, password })
    });
    
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed.');
    
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return { message: data.message };
  };

  const register = async (username: string, email: string, mobile_number: string, password: string) => {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, mobile_number, password })
    });
    
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed.');
    
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return { message: data.message };
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const forgotPassword = async (email: string) => {
    const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed.');

    // Only trigger Firebase Client SDK to send the reset email if backend indicates we should
    if (data.useFirebaseClient) {
      const actionCodeSettings = {
        url: window.location.origin + '?mode=resetPassword',
        handleCodeInApp: true
      };
      await sendPasswordResetEmail(auth, email, actionCodeSettings);
    }

    return { message: data.message || 'Password reset link sent to your email address successfully!' };
  };

  const verifyOtp = async (email: string, otp: string) => {
    const res = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Verification failed.');
    return { message: data.message };
  };

  const resetPasswordFirebaseEmail = async (email: string, oobCode: string, newPassword: string) => {
    // 1. Confirm password reset in Firebase Client SDK
    await confirmPasswordReset(auth, oobCode, newPassword);

    // 2. Login user to Firebase Client SDK with new password to get verified idToken
    const userCredential = await signInWithEmailAndPassword(auth, email, newPassword);
    const idToken = await userCredential.user.getIdToken();

    // 3. Send idToken and new password to backend to update PostgreSQL hash
    const res = await fetch(`${API_BASE_URL}/auth/reset-password-firebase-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken, new_password: newPassword })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Database sync failed.');

    return { message: 'Password reset successful!' };
  };

  const resetPassword = async (email: string, otp: string, new_password: string) => {
    const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, new_password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Reset failed.');
    return { message: data.message };
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    return apiCall('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword })
    });
  };

  const updateProfile = async (username: string, email: string, mobile_number: string) => {
    const data = await apiCall('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify({ username, email, mobile_number })
    });
    
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    
    return { message: data.message, user: data.user };
  };

  const getStats = async () => {
    const data = await apiCall('/auth/stats');
    return data.stats;
  };

  const deleteAccount = async () => {
    await apiCall('/auth/delete-account', {
      method: 'DELETE'
    });
    logout();
  };

  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const activeToken = token || localStorage.getItem('token');
    if (!activeToken) {
      logout();
      throw new Error('Not authenticated.');
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${activeToken}`,
      ...options.headers
    };

    // If body is FormData (e.g. file upload), don't set Content-Type header so the browser sets it automatically with boundary
    if (options.body instanceof FormData) {
      delete (headers as any)['Content-Type'];
    }

    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    if (res.status === 401 || res.status === 403) {
      logout();
      throw new Error('Session expired. Please log in again.');
    }

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'API request failed.');
    return data;
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: !!token,
      isLoading,
      login,
      register,
      logout,
      forgotPassword,
      verifyOtp,
      resetPassword,
      resetPasswordFirebaseEmail,
      changePassword,
      updateProfile,
      getStats,
      deleteAccount,
      apiCall
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
