import React, { createContext, useContext, useEffect, useState, type ReactNode, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authApi } from '@/api/auth';
import { ApiError } from '@/types/api/apiError';
import { csrfManager, sessionManager } from './session';
import type { LoginRequest, AdminUser } from '@/types/auth';

interface AuthContextType {
  user: AdminUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (mobile: string, password?: string, captchaId?: string, captchaAnswer?: string) => Promise<void>;
  loginWithOTP: (mobile: string, otp: string, captchaId?: string, captchaAnswer?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

const publicPaths = ['/login'];

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSessionExpired = useCallback(() => {
    setUser(null);
    sessionManager.handleExpiredSession();
  }, []);

  const checkUserStatus = useCallback(async () => {
    const isPublicPath = publicPaths.includes(location.pathname);
    
    if (isPublicPath) {
      setIsLoading(false);
      return;
    }
    
    if (!sessionManager.hasSession()) {
      setUser(null);
      setIsLoading(false);
      handleSessionExpired();
      return;
    }
    
    setIsLoading(true);
    
    try {
      const currentUser = await authApi.getCurrentUser();
      setUser(currentUser);
      await csrfManager.refresh();
    } catch (error) {
      if (error instanceof ApiError && error.response?.AppStatusCode === 401) {
        handleSessionExpired();
      } else {
        setUser(null);
        handleSessionExpired();
      }
    } finally {
      setIsLoading(false);
    }
  }, [location.pathname, handleSessionExpired]);

  useEffect(() => {
    checkUserStatus();
  }, [checkUserStatus]);

  const login = async (mobile: string, password?: string, captchaId?: string, captchaAnswer?: string) => {
    setIsLoading(true);
    try {
      const loginData: LoginRequest = {
        mobile,
        login_type: 'password',
        password: password || '',
        captcha_id: captchaId || '',
        captcha_answer: captchaAnswer || '',
      };
      
      await authApi.login(loginData);
      await csrfManager.refresh();

      const currentUser = await authApi.getCurrentUser();
      setUser(currentUser);

      const urlParams = new URLSearchParams(window.location.search);
      const returnTo = urlParams.get('return_to') || '/dashboard';
      navigate(returnTo, { replace: true });
    } catch (error) {
      setUser(null);
      sessionManager.clearSession();
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithOTP = async (mobile: string, otp: string, captchaId?: string, captchaAnswer?: string) => {
    setIsLoading(true);
    try {
      const loginData: LoginRequest = {
        mobile,
        login_type: 'otp',
        otp_code: otp,
        captcha_id: captchaId || '',
        captcha_answer: captchaAnswer || '',
      };
      
      await authApi.login(loginData);
      await csrfManager.refresh();

      const currentUser = await authApi.getCurrentUser();
      setUser(currentUser);

      const urlParams = new URLSearchParams(window.location.search);
      const returnTo = urlParams.get('return_to') || '/dashboard';
      navigate(returnTo, { replace: true });
    } catch (error) {
      setUser(null);
      sessionManager.clearSession();
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authApi.logout();
    } catch (error) {
      console.error('[AuthContext] Logout failed:', error);
    } finally {
      setUser(null);
      sessionManager.clearSession();
      navigate('/login', { replace: true });
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    if (!sessionManager.hasSession()) {
      handleSessionExpired();
      return;
    }
    
    try {
      const currentUser = await authApi.getCurrentUser();
      setUser(currentUser);
      await csrfManager.refresh();
    } catch (error) {
      if (error instanceof ApiError && error.response?.AppStatusCode === 401) {
        handleSessionExpired();
      }
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    loginWithOTP,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

