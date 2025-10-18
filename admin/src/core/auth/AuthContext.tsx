'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback, useTransition } from 'react';

import { UserWithProfile } from '@/types/auth/user';
import { LoginResponse } from '@/types/auth/auth';
import { authApi } from '@/api/auth/route';
import { useRouter, usePathname } from 'next/navigation';
import { fetchApi } from '@/core/config/fetch';
import { ApiError } from '@/types/api/apiError';
import { csrfTokenStore } from '@/core/auth/sessionToken';
import { LoginRequest } from '@/types/auth/auth';
import { ApiResponse, MetaData } from '@/types/api/apiResponse';
import { PanelSettings } from '@/types/settings/panelSettings';
import { getPanelSettings } from '@/api/settings/panel/route';
import { getQueryClient } from '@/core/utils/queryClient';
import { FaviconManager } from '@/components/layout/FaviconManager';

interface AuthLoginResponse extends LoginResponse {
  csrf_token?: string;
}

interface ExtendedMetaData extends MetaData {
  csrf_token?: string;
}

interface ExtendedApiResponse<T> extends Omit<ApiResponse<T>, 'metaData'> {
  metaData: ExtendedMetaData;
}

interface AuthContextType {
  user: UserWithProfile | null;
  panelSettings: PanelSettings | null;
  isLoading: boolean;
  isPending: boolean;
  isAuthenticated: boolean;
  login: (mobile: string, password?: string, captchaId?: string, captchaAnswer?: string) => Promise<void>;
  loginWithOTP: (mobile: string, otp: string, captchaId?: string, captchaAnswer?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshCSRFToken: () => Promise<string | null>;
  updatePanelSettingsInContext: (newSettings: PanelSettings) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// --- List of public paths that don't require authentication ---
const publicPaths = ['/login']; // Add other public paths if needed

// Helper function to get CSRF token from cookies
function getCsrfTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  
  const cookies = document.cookie.split(';');
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    if (cookie.startsWith('csrftoken=')) {
      return cookie.substring('csrftoken='.length, cookie.length);
    }
  }
  return null;
}

// Helper function to serialize user data for Next.js 15 compatibility
function serializeUser(user: UserWithProfile | null): UserWithProfile | null {
  if (!user) return null;
  
  // Create a plain object copy to avoid class/prototype issues
  return {
    ...user,
    permissions: Array.isArray(user.permissions) ? [...user.permissions] : [],
    permission_categories: user.permission_categories ? { ...user.permission_categories } : {},
    profile: user.profile ? { ...user.profile } : undefined,
    roles: user.roles ? [...user.roles] : [],
  };
}

// Helper function to serialize panel settings
function serializePanelSettings(settings: PanelSettings | null): PanelSettings | null {
  if (!settings) return null;
  
  return {
    id: settings.id,
    panel_title: settings.panel_title,
    web_title: settings.web_title,
    logo_id: settings.logo_id,
    favicon_id: settings.favicon_id,
    logo: settings.logo,
    favicon: settings.favicon,
    logo_url: settings.logo_url,
    favicon_url: settings.favicon_url,
    logo_detail: settings.logo_detail,
    favicon_detail: settings.favicon_detail,
  };
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<UserWithProfile | null>(null);
  const [panelSettings, setPanelSettings] = useState<PanelSettings | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();

  // Function to explicitly refresh CSRF token
  const refreshCSRFToken = useCallback(async (): Promise<string | null> => {
    try {
      const cookieToken = getCsrfTokenFromCookie();
      if (cookieToken) {
        csrfTokenStore.setToken(cookieToken);
        return cookieToken;
      }
      
      // Attempt to trigger CSRF cookie refresh by fetching profile
      try {
          await fetchApi.get('/admin/profile/');
      } catch (profileError) {
          // Ignore profile fetch error during CSRF refresh attempt
      }
      
      const newCookieToken = getCsrfTokenFromCookie();
      if (newCookieToken) {
        csrfTokenStore.setToken(newCookieToken);
        return newCookieToken;
      }
      
      return null;
    } catch (error) {
      // Ignore general errors during CSRF refresh
      return null;
    }
  }, []);

  const fetchPanelSettings = useCallback(async () => {
    try {
        const panelData = await getPanelSettings();

        if (panelData) {
            setPanelSettings(serializePanelSettings(panelData));
        } else {
            setPanelSettings(null);
        }
    } catch (error) {
        if (process.env.NODE_ENV === 'development') {
            console.error('AuthContext: Error fetching panel settings:', error);
        }
        setPanelSettings(null);
    }
  }, []);

  const checkUserStatus = useCallback(async () => {
    setIsLoading(true);
    
    try {
      const userData = await authApi.getCurrentAdminUser({ cache: 'no-store' }); 
      if (userData) {
        setUser(serializeUser(userData));
        const csrfToken = getCsrfTokenFromCookie();
        if (csrfToken) {
          csrfTokenStore.setToken(csrfToken);
        } else {
          await refreshCSRFToken();
        }
        // Fetch panel settings after successful user check
        await fetchPanelSettings(); 
      } else {
        setUser(null);
        setPanelSettings(null); // Clear settings if user is null
        // Redirect to login if on protected route
        if (!publicPaths.includes(pathname)) {
          router.push('/login');
        }
      }
    } catch (error) {
      if (error instanceof ApiError && error.response.AppStatusCode === 401) {
        // User session is invalid/expired

        setUser(null);
        setPanelSettings(null);
        csrfTokenStore.setToken(null);
        
        // Clear the invalid session cookie
        if (typeof document !== 'undefined') {
          document.cookie = 'sessionid=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        }
        
        // Redirect to login if on protected route
        if (!publicPaths.includes(pathname)) {
          const currentPath = window.location.pathname + window.location.search;
          const returnToParam = currentPath !== '/' ? `?return_to=${encodeURIComponent(currentPath)}` : '';
          router.push(`/login${returnToParam}`);
        }
      } else {
        setUser(null);
        setPanelSettings(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [fetchPanelSettings, pathname, router]);

  useEffect(() => {
    checkUserStatus();
  }, [checkUserStatus]);

  const login = async (mobile: string, password?: string, captchaId?: string, captchaAnswer?: string) => {
    startTransition(async () => {
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
      
      await refreshUser();
      
      const csrfToken = getCsrfTokenFromCookie();
      if (csrfToken) {
        csrfTokenStore.setToken(csrfToken);
      } else {
        await refreshCSRFToken();
      }
      
      // Navigate to intended destination or dashboard after successful login
      const urlParams = new URLSearchParams(window.location.search);
      const returnTo = urlParams.get('return_to') || '/';
      router.push(returnTo);
    } catch (error) {
      setUser(null);
      setPanelSettings(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
    });
  };

  const loginWithOTP = async (mobile: string, otp: string, captchaId?: string, captchaAnswer?: string) => {
    startTransition(async () => {
    setIsLoading(true);
    try {
      const loginData: LoginRequest = {
        mobile,
        login_type: 'otp',
        otp_code: otp,
        captcha_id: captchaId || '',
        captcha_answer: captchaAnswer || '',
      };

      const response = await authApi.login(loginData) as AuthLoginResponse;

      if (response) {
        await refreshUser();

        const csrfToken = getCsrfTokenFromCookie();
        if (csrfToken) {
          csrfTokenStore.setToken(csrfToken);
        } else if (response.csrf_token) {
          csrfTokenStore.setToken(response.csrf_token);
        } else {
          await refreshCSRFToken();
        }
        
        // Navigate to intended destination or dashboard after successful OTP login
        const urlParams = new URLSearchParams(window.location.search);
        const returnTo = urlParams.get('return_to') || '/';
        router.push(returnTo);
      } else {
        throw new Error('OTP Login request failed or returned unexpected response');
      }
    } catch (error) {
      setUser(null);
      setPanelSettings(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
    });
  };

  // Helper function to clear all auth-related cookies
  const clearAuthCookies = () => {
    if (typeof window !== 'undefined') {
      
      
      // Get all existing cookies
      const allCookies = document.cookie.split(';').map(cookie => {
        return cookie.trim().split('=')[0];
      }).filter(name => name.length > 0);
      
      
      
      // Predefined auth cookies
      const authCookies = [
        'sessionid',  // ✅ اصلی‌ترین کوکی برای admin authentication
        'sessionid',
        'csrftoken', 
        'admin_session',
        'access_token',
        'refresh_token',
        'session',
        'auth_token',
        'jwt',
        'token'
      ];
      
      // Combine all cookies (existing + predefined)
      const cookiesToClear = [...new Set([...allCookies, ...authCookies])];
      
      cookiesToClear.forEach(cookieName => {
        // Multiple attempts to clear cookies with different configurations
        const clearConfigs = [
          `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`,
          `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`,
          `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`,
          `${cookieName}=; Max-Age=0; path=/;`,
          `${cookieName}=; Max-Age=0; path=/; domain=${window.location.hostname};`
        ];
        
        clearConfigs.forEach(config => {
          document.cookie = config;
        });
      });
      
      
      
      // Clear React Query cache (simple)
      try {
        const queryClient = getQueryClient();
        queryClient.clear();

      } catch (error) {
        console.warn('Error clearing query cache:', error);
      }
    }
  };

  const logout = async () => {
    startTransition(async () => {
    setIsLoading(true);
    try {
      
      await authApi.logout();
      
    } catch (error) {
      
      // Ignore logout API errors - continue with frontend logout
    } finally {
      // Always clear frontend state and redirect
      
      
      // Clear browser cookies
      clearAuthCookies();
      
      // Clear local state
      setUser(null);
      setPanelSettings(null);
      csrfTokenStore.setToken(null);
      
      // Clear storage (simple)
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
      }
      
      setIsLoading(false);
      
      // Force navigation to login page (hard redirect to clear any cached state)
      window.location.href = '/login';
    }
    });
  };

  const refreshUser = async () => {
    try {
      const userData = await authApi.getCurrentAdminUser({ cache: 'no-store' });
      if (userData) {
        setUser(serializeUser(userData));
        const csrfToken = getCsrfTokenFromCookie();
        if (csrfToken) {
          csrfTokenStore.setToken(csrfToken);
        } else {
          await refreshCSRFToken();
        }
        // Also refresh settings when user is refreshed
        await fetchPanelSettings(); 
      } else {
        setUser(null);
        setPanelSettings(null); // Clear settings if user is null
        csrfTokenStore.setToken(null);
      }
    } catch (error) {
      if (!(error instanceof ApiError && error.response.AppStatusCode === 401)) {
         console.error('Error refreshing user:', error);
      }
      setUser(null);
      setPanelSettings(null); // Clear settings on error
      csrfTokenStore.setToken(null);
    }
  };

  // Function to update panel settings in the context state
  const updatePanelSettingsInContext = (newSettings: PanelSettings) => {
      // Add cache-busting timestamp to image URLs to prevent browser caching
      const processedSettings = serializePanelSettings(newSettings);
      if (processedSettings) {
        const timestamp = Date.now();
        if (processedSettings.logo_url) {
          // Keep the original URL and only add timestamp
          const baseUrl = processedSettings.logo_url.split('?')[0];
          processedSettings.logo_url = `${baseUrl}?t=${timestamp}`;
        }
        if (processedSettings.favicon_url) {
          // Keep the original URL and only add timestamp
          const baseUrl = processedSettings.favicon_url.split('?')[0];
          processedSettings.favicon_url = `${baseUrl}?t=${timestamp}`;
        }
        
        // Also handle logo_detail and favicon_detail if they exist
        if (processedSettings.logo_detail) {
          if (processedSettings.logo_detail.file_url) {
            const baseUrl = processedSettings.logo_detail.file_url.split('?')[0];
            processedSettings.logo_detail.file_url = `${baseUrl}?t=${timestamp}`;
          }
        }
        if (processedSettings.favicon_detail) {
          if (processedSettings.favicon_detail.file_url) {
            const baseUrl = processedSettings.favicon_detail.file_url.split('?')[0];
            processedSettings.favicon_detail.file_url = `${baseUrl}?t=${timestamp}`;
          }
        }
      }
      setPanelSettings(processedSettings);
  };

  const value = {
    user,
    panelSettings,
    isLoading,
    isPending,
    isAuthenticated: !!user && !isLoading,
    login,
    loginWithOTP,
    logout,
    refreshUser,
    refreshCSRFToken,
    updatePanelSettingsInContext
  };

  return (
    <AuthContext.Provider value={value}>
      <FaviconManager />
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};