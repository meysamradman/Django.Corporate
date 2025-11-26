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
  canManageChatbot: boolean;
  
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
  
  // Media - General
  canReadMedia: boolean;
  canUploadMedia: boolean; // General upload permission
  canUpdateMedia: boolean;
  canDeleteMedia: boolean;
  canManageMedia: boolean;
  
  // Media - Type-specific uploads (granular)
  canUploadImage: boolean;
  canUploadVideo: boolean;
  canUploadAudio: boolean;
  canUploadDocument: boolean;
  
  // Media - Type-specific updates
  canUpdateImage: boolean;
  canUpdateVideo: boolean;
  canUpdateAudio: boolean;
  canUpdateDocument: boolean;
  
  // Media - Type-specific deletes
  canDeleteImage: boolean;
  canDeleteVideo: boolean;
  canDeleteAudio: boolean;
  canDeleteDocument: boolean;
  
  // Statistics - Granular permissions
  canViewDashboardStats: boolean; // General overview (safe)
  canViewUsersStats: boolean; // Sensitive user counts
  canViewAdminsStats: boolean; // Highly sensitive admin counts
  canViewContentStats: boolean; // Portfolio/blog/media stats
  canViewFinancialStats: boolean; // Financial data (future)
  canExportStats: boolean; // Export functionality
  canManageStatistics: boolean; // Full access to all statistics
  
  // Email & AI
  canViewEmail: boolean;
  canViewAI: boolean;
  canManageTicket: boolean;
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
 * ✅ Provider که permission map رو fetch می‌کنه
 * ✅ NO CACHE: Admin panel is CSR only - caching handled by backend Redis
 * همه درخواست‌ها fresh هستند و هیچ کشی در فرانت نیست
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
      // ✅ NO CACHE: Admin panel is CSR only - caching handled by backend Redis
      const res = await permissionApi.getMap();
      return res;
    },
    staleTime: 0, // Always fetch fresh - no frontend caching
    gcTime: 0, // No cache retention - backend Redis handles caching
    refetchOnWindowFocus: true, // Always refetch on focus for fresh data
    refetchOnMount: true, // Always refetch on mount for fresh data
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

  // Synonyms map for flexible permission checking
  const ACTION_SYNONYMS: Record<string, string[]> = useMemo(() => ({
    read: ['read', 'view', 'list', 'get'],
    view: ['read', 'view', 'list', 'get'],
    list: ['read', 'view', 'list', 'get'],
    create: ['create', 'add', 'post', 'write'],
    add: ['create', 'add', 'post', 'write'],
    update: ['update', 'edit', 'change', 'put', 'patch', 'modify'],
    edit: ['update', 'edit', 'change', 'put', 'patch', 'modify'],
    delete: ['delete', 'remove', 'destroy'],
    remove: ['delete', 'remove', 'destroy'],
    manage: ['manage', 'admin'],
    admin: ['manage', 'admin'],
  }), []);

  // 🔥 Check functions (Memoized + Set-based O(1) lookup)
  // این تابع stable reference داره - هیچوقت re-create نمیشه
  const hasPermission = useCallback(
    (permissionId: string): boolean => {
      if (!permissionMap) return false;
      if (permissionMap.is_superadmin) return true;
      
      // 1. Exact match (O(1)) - خیلی سریع‌تر از array.includes()
      if (permissionSet.has(permissionId)) return true;

      const [resource, action] = permissionId.split('.');
      
      if (resource) {
        // 2. Wildcard check (resource.*)
        if (permissionSet.has(`${resource}.*`)) return true;

        // 3. Manage/Admin check (Super permission for resource)
        // اگر کاربر دسترسی manage داره، یعنی همه کار می‌تونه بکنه
        if (permissionSet.has(`${resource}.manage`) || permissionSet.has(`${resource}.admin`)) return true;
      }

      // 4. Synonym check
      if (resource && action) {
        const synonyms = ACTION_SYNONYMS[action.toLowerCase()];
        if (synonyms) {
            return synonyms.some(syn => permissionSet.has(`${resource}.${syn}`));
        }
      }

      return false;
    },
    [permissionMap, permissionSet, ACTION_SYNONYMS]
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

      // مرکزی (media library) - requires explicit media.upload or type-specific permission
      if (context === 'media_library') {
        // Check for general upload permission OR any type-specific upload permission
        return hasPermission('media.upload') || 
               hasPermission('media.image.upload') ||
               hasPermission('media.video.upload') ||
               hasPermission('media.audio.upload') ||
               hasPermission('media.document.upload');
      }

      // در فرم Portfolio - can upload if they can create/update portfolio
      if (context === 'portfolio') {
        return hasAnyPermission(['portfolio.create', 'portfolio.update']);
      }

      // در فرم Blog - can upload if they can create/update blog
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
      canManageChatbot: check('chatbot.manage'),
      
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
      
      // Media - General permissions
      canReadMedia: check('media.read'),
      canUploadMedia: check('media.upload'), // General upload (all types)
      canUpdateMedia: check('media.update'), // General update (all types)
      canDeleteMedia: check('media.delete'), // General delete (all types)
      canManageMedia: check('media.manage'), // Full access to media
      
      // Media - Type-specific upload permissions (granular)
      canUploadImage: check('media.image.upload'),
      canUploadVideo: check('media.video.upload'),
      canUploadAudio: check('media.audio.upload'),
      canUploadDocument: check('media.document.upload'),
      
      // Media - Type-specific update permissions
      canUpdateImage: check('media.image.update'),
      canUpdateVideo: check('media.video.update'),
      canUpdateAudio: check('media.audio.update'),
      canUpdateDocument: check('media.document.update'),
      
      // Media - Type-specific delete permissions
      canDeleteImage: check('media.image.delete'),
      canDeleteVideo: check('media.video.delete'),
      canDeleteAudio: check('media.audio.delete'),
      canDeleteDocument: check('media.document.delete'),
      
      // Statistics - Granular permissions for sensitive data
      canViewDashboardStats: check('statistics.dashboard.read'), // General overview (safe for all admins)
      canViewUsersStats: check('statistics.users.read'), // Sensitive: user statistics
      canViewAdminsStats: check('statistics.admins.read'), // Highly sensitive: admin statistics
      canViewContentStats: check('statistics.content.read'), // Portfolio/blog/media statistics
      canViewFinancialStats: check('statistics.financial.read'), // Future: financial data
      canExportStats: check('statistics.export'), // Export functionality
      canManageStatistics: check('statistics.manage'), // Full access to all statistics
      
      // Email & AI
      canViewEmail: check('email.read') || check('email.view'),
      canViewAI: check('ai.read') || check('ai.view'),
      canManageTicket: check('ticket.manage'),
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

