import React, { createContext, useContext, useState, useEffect } from 'react';

export const API_BASE_URL = 'http://localhost:5000/api';

interface User {
  id: number;
  username: string;
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
  register: (username: string, mobile_number: string, password: string) => Promise<{ message: string }>;
  logout: () => void;
  forgotPassword: (mobile_number: string) => Promise<{ message: string; otp?: string }>;
  resetPassword: (mobile_number: string, otp: string, new_password: string) => Promise<{ message: string }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ message: string }>;
  getStats: () => Promise<Stats>;
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

  const register = async (username: string, mobile_number: string, password: string) => {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, mobile_number, password })
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

  const forgotPassword = async (mobile_number: string) => {
    const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile_number })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed.');
    return { message: data.message, otp: data.otp };
  };

  const resetPassword = async (mobile_number: string, otp: string, new_password: string) => {
    const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile_number, otp, new_password })
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

  const getStats = async () => {
    const data = await apiCall('/auth/stats');
    return data.stats;
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
      resetPassword,
      changePassword,
      getStats,
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
