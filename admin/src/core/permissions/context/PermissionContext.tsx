'use client';

import React, { createContext, useContext, useMemo, useCallback, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { permissionApi } from '@/api/permissions/route';
import type { PermissionMapResponse } from '@/api/permissions/route';

export interface UIPermissions {
  // Settings Apps (کلی)
  canManagePanel: boolean;
  canManagePages: boolean;
  canManageSettings: boolean;
  canManageAI: boolean;
  canManageForms: boolean;
  
  // CRUD Apps
  canCreateBlog: boolean;
  canUpdateBlog: boolean;
  canDeleteBlog: boolean;
  canCreatePortfolio: boolean;
  canUpdatePortfolio: boolean;
  canDeletePortfolio: boolean;
  canCreateAdmin: boolean;
  canUpdateAdmin: boolean;
  canDeleteAdmin: boolean;
  canCreateUser: boolean;
  canUpdateUser: boolean;
  canDeleteUser: boolean;
  
  // Media
  canUploadMedia: boolean;
  canDeleteMedia: boolean;
  
  // Email & AI
  canViewEmail: boolean;
  canViewAI: boolean;
}

export interface PermissionContextValue {
  permissionMap: PermissionMapResponse | null;
  isLoading: boolean;
  error: Error | null;
  hasPermission: (permissionId: string) => boolean;
  hasAnyPermission: (permissionIds: string[]) => boolean;
  hasAllPermissions: (permissionIds: string[]) => boolean;
  canUploadInContext: (context: 'portfolio' | 'blog' | 'media_library') => boolean;
  refresh: () => Promise<void>;
  ui: UIPermissions; // 🔥 Pre-computed UI flags
}

const PermissionContext = createContext<PermissionContextValue | undefined>(undefined);

interface PermissionProviderProps {
  children: ReactNode;
}

/**
 * ✅ Provider که یک‌بار fetch می‌کنه و در Context cache می‌کنه
 * React Query برای cache و invalidation استفاده می‌کنه (5 دقیقه staleTime)
 */
export function PermissionProvider({ children }: PermissionProviderProps) {
  const {
    data: permissionMapRaw,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['permission-map'],
    queryFn: async (): Promise<PermissionMapResponse> => {
      // Remove cache: 'no-store' - Let React Query handle caching
      const res = await permissionApi.getMap();
      return res;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh
    gcTime: 10 * 60 * 1000, // 10 minutes - cache retention
    refetchOnWindowFocus: false, // Don't refetch on tab focus
    refetchOnMount: false, // Don't refetch on component mount if data exists
    retry: 2,
    retryDelay: 1000,
  });

  // Normalize permissionMap to ensure user_permissions is always an array
  const permissionMap = useMemo(() => {
    if (!permissionMapRaw) return null;
    return {
      ...permissionMapRaw,
      user_permissions: Array.isArray(permissionMapRaw.user_permissions) 
        ? permissionMapRaw.user_permissions 
        : [],
    };
  }, [permissionMapRaw]);

  // 🔥 O(1) Set-based lookup for ultra-fast permission checks
  // برای 200 permission: 20-50x سریع‌تر از array.includes()
  const permissionSet = useMemo(() => {
    if (!permissionMap?.user_permissions) return new Set<string>();
    return new Set(permissionMap.user_permissions);
  }, [permissionMap?.user_permissions]);

  // 🔥 Check functions (Memoized + Set-based O(1) lookup)
  // این تابع stable reference داره - هیچوقت re-create نمیشه
  const hasPermission = useCallback(
    (permissionId: string): boolean => {
      if (!permissionMap) return false;
      if (permissionMap.is_superadmin) return true;
      // O(1) Set lookup - خیلی سریع‌تر از array.includes()
      return permissionSet.has(permissionId);
    },
    [permissionMap, permissionSet]
  );

  const hasAnyPermission = useCallback(
    (permissionIds: string[]): boolean => {
      if (!permissionIds.length) return false;
      return permissionIds.some((id) => hasPermission(id));
    },
    [hasPermission]
  );

  const hasAllPermissions = useCallback(
    (permissionIds: string[]): boolean => {
      if (!permissionIds.length) return true;
      return permissionIds.every((id) => hasPermission(id));
    },
    [hasPermission]
  );

  // 🔥 Context-aware upload check
  const canUploadInContext = useCallback(
    (context: 'portfolio' | 'blog' | 'media_library'): boolean => {
      if (!permissionMap) return false;
      if (permissionMap.is_superadmin) return true;

      // مرکزی (media library)
      if (context === 'media_library') {
        return hasPermission('media.upload');
      }

      // در فرم Portfolio
      if (context === 'portfolio') {
        return hasAnyPermission(['portfolio.create', 'portfolio.update']);
      }

      // در فرم Blog
      if (context === 'blog') {
        return hasAnyPermission(['blog.create', 'blog.update']);
      }

      return false;
    },
    [permissionMap, hasPermission, hasAnyPermission]
  );

  const refresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  // 🔥 Pre-compute ALL UI permission flags یک‌بار (صفر محاسبه در component ها)
  const uiPermissions = useMemo<UIPermissions>(() => {
    const isSuperAdmin = permissionMap?.is_superadmin || false;
    const check = (perm: string) => isSuperAdmin || permissionSet.has(perm);
    
    return {
      // Settings Apps (کلی)
      canManagePanel: check('panel.manage'),
      canManagePages: check('pages.manage'),
      canManageSettings: check('settings.manage'),
      canManageAI: check('ai.manage'),
      canManageForms: check('forms.manage'),
      
      // CRUD Apps
      canCreateBlog: check('blog.create'),
      canUpdateBlog: check('blog.update'),
      canDeleteBlog: check('blog.delete'),
      canCreatePortfolio: check('portfolio.create'),
      canUpdatePortfolio: check('portfolio.update'),
      canDeletePortfolio: check('portfolio.delete'),
      canCreateAdmin: check('admin.create'),
      canUpdateAdmin: check('admin.update'),
      canDeleteAdmin: check('admin.delete'),
      canCreateUser: check('users.create'),
      canUpdateUser: check('users.update'),
      canDeleteUser: check('users.delete'),
      
      // Media
      canUploadMedia: check('media.upload'),
      canDeleteMedia: check('media.delete'),
      
      // Email & AI
      canViewEmail: check('email.read') || check('email.view'),
      canViewAI: check('ai.read') || check('ai.view'),
    };
  }, [permissionMap, permissionSet]);

  // Context value با useMemo برای جلوگیری از re-render
  const value = useMemo<PermissionContextValue>(
    () => ({
      permissionMap: permissionMap || null,
      isLoading,
      error: error as Error | null,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
      canUploadInContext,
      refresh,
      ui: uiPermissions, // 🔥 Pre-computed flags
    }),
    [permissionMap, isLoading, error, hasPermission, hasAnyPermission, hasAllPermissions, canUploadInContext, refresh, uiPermissions]
  );

  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>;
}

/**
 * ✅ Custom hook برای استفاده راحت
 */
export function usePermission(): PermissionContextValue {
  const context = useContext(PermissionContext);

  if (!context) {
    throw new Error('usePermission must be used within PermissionProvider');
  }

  return context;
}

