'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback, useTransition } from 'react';

import { UserWithProfile } from '@/types/auth/user';
import { LoginResponse } from '@/types/auth/auth';
import { authApi } from '@/api/auth/route';
import { useRouter, usePathname } from 'next/navigation';
import { fetchApi } from '@/core/config/fetch';
import { ApiError } from '@/types/api/apiError';
import { csrfManager } from '@/core/auth/csrfToken';
import { LoginRequest } from '@/types/auth/auth';
import { ApiResponse, MetaData } from '@/types/api/apiResponse';
import { PanelSettings } from '@/types/settings/panelSettings';
import { getPanelSettings } from '@/api/panel/route';
import { getQueryClient } from '@/core/utils/queryClient';
import { FaviconManager } from '@/components/layout/FaviconManager';
import { PermissionProfile } from '@/types/auth/permission';


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

const publicPaths = ['/login'];


function serializeUser(user: any | null): UserWithProfile | null {
  if (!user) return null;
  
  const { normalizedPermissions, permissionProfile } = normalizePermissionPayload(user.permissions);
  const fallbackProfile = buildPermissionProfileFromUser(user);
  const mergedProfile = mergePermissionProfile({
    profile: permissionProfile || user.permission_profile,
    fallback: fallbackProfile,
    normalizedPermissions,
  });

  return {
    ...user,
    user_type: user.user_type || 'admin',
    permissions: normalizedPermissions,
    permission_profile: mergedProfile,
    permission_categories: user.permission_categories ? { ...user.permission_categories } : {},
    profile: user.profile ? { ...user.profile } : undefined,
    roles: user.roles ? [...user.roles] : [],
  };
}

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

function normalizePermissionPayload(rawPermissions: unknown): {
  normalizedPermissions: string[];
  permissionProfile?: PermissionProfile;
} {
  if (Array.isArray(rawPermissions)) {
    return { normalizedPermissions: [...rawPermissions] };
  }

  if (typeof rawPermissions === "string") {
    return { normalizedPermissions: [rawPermissions] };
  }

  if (rawPermissions && typeof rawPermissions === "object") {
    const profile = rawPermissions as PermissionProfile;
    const nestedPermissions = Array.isArray(profile.permissions)
      ? [...profile.permissions]
      : [];

    return {
      normalizedPermissions: nestedPermissions,
      permissionProfile: profile,
    };
  }

  return { normalizedPermissions: [] };
}

function buildPermissionProfileFromUser(user: any): PermissionProfile | undefined {
  if (!user) return undefined;

  const modules = Array.isArray(user.modules) ? [...user.modules] : [];
  const actions = Array.isArray(user.actions) ? [...user.actions] : [];
  const permissions =
    Array.isArray(user.permissions) && user.permissions.every((perm: unknown) => typeof perm === "string")
      ? [...user.permissions]
      : undefined;

  if (!modules.length && !actions.length && !(permissions && permissions.length)) {
    return undefined;
  }

  const roles =
    Array.isArray(user.roles) && user.roles.length
      ? user.roles.map((role: any) => role?.name || role)
      : undefined;

  return {
    access_level: user.access_level || user.permissions?.access_level || "admin",
    modules,
    actions,
    permissions,
    roles,
    permissions_count: user.permissions_count,
    has_permissions: user.has_permissions,
    base_permissions: user.base_permissions,
    permission_summary: user.permission_summary,
  };
}

function mergePermissionProfile(options: {
  profile?: PermissionProfile;
  fallback?: PermissionProfile;
  normalizedPermissions?: string[];
}): PermissionProfile | undefined {
  const { profile, fallback, normalizedPermissions } = options;
  const base = profile || fallback;

  const hasInlinePermissions = normalizedPermissions && normalizedPermissions.length > 0;

  if (!base && !hasInlinePermissions) {
    return undefined;
  }

  const mergeStringArray = (...lists: (string[] | undefined)[]) => {
    const set = new Set<string>();
    lists.flat().forEach((value) => {
      if (Array.isArray(value)) {
        value.forEach(item => {
          if (item) {
            set.add(String(item));
          }
        });
      }
    });
    return set.size ? Array.from(set) : undefined;
  };

  const modulesFromPermissions = normalizedPermissions
    ?.map(permission => permission?.split(".")[0])
    .filter(Boolean) as string[] | undefined;

  const actionsFromPermissions = normalizedPermissions
    ?.map(permission => permission?.split(".")[1])
    .filter(Boolean) as string[] | undefined;

  return {
    access_level: base?.access_level || "admin",
    permissions: hasInlinePermissions
      ? normalizedPermissions
      : profile?.permissions || fallback?.permissions,
    roles: mergeStringArray(fallback?.roles, profile?.roles),
    modules: mergeStringArray(fallback?.modules, profile?.modules, modulesFromPermissions),
    actions: mergeStringArray(fallback?.actions, profile?.actions, actionsFromPermissions),
    permissions_count: base?.permissions_count ?? fallback?.permissions_count,
    has_permissions: base?.has_permissions ?? fallback?.has_permissions,
    base_permissions: base?.base_permissions ?? fallback?.base_permissions,
    permission_summary: base?.permission_summary ?? fallback?.permission_summary,
    restrictions: base?.restrictions ?? fallback?.restrictions,
    special: base?.special ?? fallback?.special,
  };
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<UserWithProfile | null>(null);
  const [panelSettings, setPanelSettings] = useState<PanelSettings | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();

  const refreshCSRFToken = useCallback(async (): Promise<string | null> => {
    return await csrfManager.refresh();
  }, []);

  const fetchPanelSettings = useCallback(async (userPermissions: string[]) => {
    const hasAccess = userPermissions.includes('all') || userPermissions.includes('panel.manage');
    
    if (!hasAccess) {
      setPanelSettings(null);
      return;
    }
    
    try {
        const panelData = await getPanelSettings();

        if (panelData) {
            setPanelSettings(serializePanelSettings(panelData));
        } else {
        setPanelSettings(null);
    }
    } catch (error) {
        setPanelSettings(null);
    }
  }, []);

  const checkUserStatus = useCallback(async () => {
    setIsLoading(true);
    
    try {
      const userData = await authApi.getCurrentAdminUser({ refresh: true }); 
      if (userData) {
        setUser(serializeUser(userData));
        
        await csrfManager.refresh();
        
        const userPermissions = userData.permissions || [];
        fetchPanelSettings(userPermissions).catch(() => {
        });
      } else {
        setUser(null);
        setPanelSettings(null);
        if (!publicPaths.includes(pathname)) {
          router.push('/login');
        }
      }
    } catch (error) {
      if (error instanceof ApiError && error.response.AppStatusCode === 401) {
        setUser(null);
        setPanelSettings(null);
        csrfManager.clear();
        
        if (typeof document !== 'undefined') {
          document.cookie = 'sessionid=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        }
        
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

        const userData = await authApi.getCurrentAdminUser({ refresh: true });
        
        if (!userData) {
          throw new Error('Failed to load user data after login');
        }

        setUser(serializeUser(userData));

        const userPermissions = userData.permissions || [];
        fetchPanelSettings(userPermissions).catch(() => {
        });

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

      const userData = await authApi.getCurrentAdminUser({ refresh: true });
      
      if (!userData) {
        throw new Error('Failed to load user data after login');
      }

      setUser(serializeUser(userData));

      const userPermissions = userData.permissions || [];
      fetchPanelSettings(userPermissions).catch(() => {
      });

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
  };

  const clearAuthCookies = () => {
    if (typeof window !== 'undefined') {
      
      
      const allCookies = document.cookie.split(';').map(cookie => {
        return cookie.trim().split('=')[0];
      }).filter(name => name.length > 0);
      
      
      
      const authCookies = [
        'sessionid',
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
      
      const cookiesToClear = [...new Set([...allCookies, ...authCookies])];
      
      cookiesToClear.forEach(cookieName => {
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
      
      
      
      try {
        const queryClient = getQueryClient();
        queryClient.clear();

      } catch (error) {
              }
    }
  };

  const logout = async () => {
    startTransition(async () => {
    setIsLoading(true);
    try {
      
      await authApi.logout();
      
    } catch (error) {
      
    } finally {
      
      
      clearAuthCookies();
      
      setUser(null);
      setPanelSettings(null);
      csrfManager.clear();
      
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
      }
      
      setIsLoading(false);
      
      window.location.href = '/login';
    }
    });
  };

  const refreshUser = async () => {
    try {
      const userData = await authApi.getCurrentAdminUser({ refresh: true });
      if (userData) {
        setUser(serializeUser(userData));
        
        await csrfManager.refresh();
        const userPermissions = userData.permissions || [];
        fetchPanelSettings(userPermissions).catch(() => {
        });
      } else {
        setUser(null);
        setPanelSettings(null);
        csrfManager.clear();
      }
    } catch (error) {
      setUser(null);
      setPanelSettings(null);
      csrfManager.clear();
    }
  };

  const updatePanelSettingsInContext = (newSettings: PanelSettings) => {
      const processedSettings = serializePanelSettings(newSettings);
      if (processedSettings) {
        const timestamp = Date.now();
        if (processedSettings.logo_url) {
          const baseUrl = processedSettings.logo_url.split('?')[0];
          processedSettings.logo_url = `${baseUrl}?t=${timestamp}`;
        }
        if (processedSettings.favicon_url) {
          const baseUrl = processedSettings.favicon_url.split('?')[0];
          processedSettings.favicon_url = `${baseUrl}?t=${timestamp}`;
        }
        
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