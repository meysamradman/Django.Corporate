'use client';

import React, { createContext, useContext, useMemo, useCallback, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { permissionApi } from '@/api/admins/permissions/route';
import { PERMISSIONS } from '@/core/permissions/constants';
import type { PermissionMapResponse, PermissionContextValue, UIPermissions } from '@/types/auth/permission';

const PermissionContext = createContext<PermissionContextValue | undefined>(undefined);

interface PermissionProviderProps {
  children: ReactNode;
}

export function PermissionProvider({ children }: PermissionProviderProps) {
  const {
    data: permissionMapRaw,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['permission-map'],
    queryFn: async (): Promise<PermissionMapResponse> => {
      const res = await permissionApi.getMap();
      return res;
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    retry: 2,
    retryDelay: 1000,
  });

  const permissionMap = useMemo(() => {
    if (!permissionMapRaw) return null;
    return {
      ...permissionMapRaw,
      user_permissions: Array.isArray(permissionMapRaw.user_permissions) 
        ? permissionMapRaw.user_permissions 
        : [],
    };
  }, [permissionMapRaw]);

  const permissionSet = useMemo(() => {
    if (!permissionMap?.user_permissions) return new Set<string>();
    return new Set(permissionMap.user_permissions);
  }, [permissionMap?.user_permissions]);

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

  const hasPermission = useCallback(
    (permissionId: string): boolean => {
      if (!permissionMap) return false;
      if (permissionMap.is_superadmin) return true;
      
      if (permissionSet.has(permissionId)) return true;

      const [resource, action] = permissionId.split('.');
      
      if (resource) {
        if (permissionSet.has(`${resource}.*`)) return true;

        if (permissionSet.has(`${resource}.manage`) || permissionSet.has(`${resource}.admin`)) return true;
      }

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

  const check = useCallback(
    (permissionId: string): boolean => {
      // Exact match - بدون wildcard و synonym
      if (!permissionMap) return false;
      if (permissionMap.is_superadmin) return true;
      return permissionSet.has(permissionId);
    },
    [permissionMap, permissionSet]
  );

  const canUploadInContext = useCallback(
    (context: 'portfolio' | 'blog' | 'media_library'): boolean => {
      if (!permissionMap) return false;
      if (permissionMap.is_superadmin) return true;

      if (context === 'media_library') {
        return hasPermission(PERMISSIONS.MEDIA.UPLOAD) || 
               hasPermission(PERMISSIONS.MEDIA_IMAGE.UPLOAD) ||
               hasPermission(PERMISSIONS.MEDIA_VIDEO.UPLOAD) ||
               hasPermission(PERMISSIONS.MEDIA_AUDIO.UPLOAD) ||
               hasPermission(PERMISSIONS.MEDIA_DOCUMENT.UPLOAD);
      }

      if (context === 'portfolio') {
        return hasAnyPermission(['portfolio.create', 'portfolio.update']);
      }

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

  const uiPermissions = useMemo<UIPermissions>(() => {
    const isSuperAdmin = permissionMap?.is_superadmin || false;
    const check = (perm: string) => isSuperAdmin || permissionSet.has(perm);
    
    return {
      // Panel & Settings
      canManagePanel: check(PERMISSIONS.PANEL.MANAGE),
      canManagePages: check(PERMISSIONS.PAGES.MANAGE),
      canManageSettings: check(PERMISSIONS.SETTINGS.MANAGE),
      canManageAI: check(PERMISSIONS.AI.MANAGE),
      canManageForms: check(PERMISSIONS.FORMS.MANAGE),
      canManageChatbot: check(PERMISSIONS.CHATBOT.MANAGE),
      
      // AI Specific
      canManageAIChat: check(PERMISSIONS.AI.CHAT_MANAGE) || check(PERMISSIONS.AI.MANAGE),
      canManageAIContent: check(PERMISSIONS.AI.CONTENT_MANAGE) || check(PERMISSIONS.AI.MANAGE),
      canManageAIImage: check(PERMISSIONS.AI.IMAGE_MANAGE) || check(PERMISSIONS.AI.MANAGE),
      canManageAIAudio: check(PERMISSIONS.AI.AUDIO_MANAGE) || check(PERMISSIONS.AI.MANAGE),
      canManageAISettings: check(PERMISSIONS.AI.SETTINGS_PERSONAL_MANAGE) || check(PERMISSIONS.AI.MANAGE),
      canManageSharedAISettings: check(PERMISSIONS.AI.SETTINGS_SHARED_MANAGE) || isSuperAdmin,
      
      // CRUD Operations
      canCreateBlog: check(PERMISSIONS.BLOG.CREATE),
      canUpdateBlog: check(PERMISSIONS.BLOG.UPDATE),
      canDeleteBlog: check(PERMISSIONS.BLOG.DELETE),
      canCreatePortfolio: check(PERMISSIONS.PORTFOLIO.CREATE),
      canUpdatePortfolio: check(PERMISSIONS.PORTFOLIO.UPDATE),
      canDeletePortfolio: check(PERMISSIONS.PORTFOLIO.DELETE),
      canCreateAdmin: check(PERMISSIONS.ADMIN.CREATE),
      canUpdateAdmin: check(PERMISSIONS.ADMIN.UPDATE),
      canDeleteAdmin: check(PERMISSIONS.ADMIN.DELETE),
      canCreateUser: check(PERMISSIONS.USERS.CREATE),
      canUpdateUser: check(PERMISSIONS.USERS.UPDATE),
      canDeleteUser: check(PERMISSIONS.USERS.DELETE),
      
      // Media
      canReadMedia: check(PERMISSIONS.MEDIA.READ),
      canUploadMedia: check(PERMISSIONS.MEDIA.UPLOAD),
      canUpdateMedia: check(PERMISSIONS.MEDIA.UPDATE),
      canDeleteMedia: check(PERMISSIONS.MEDIA.DELETE),
      canManageMedia: check(PERMISSIONS.MEDIA.MANAGE),
      canUploadImage: check(PERMISSIONS.MEDIA_IMAGE.UPLOAD),
      canUploadVideo: check(PERMISSIONS.MEDIA_VIDEO.UPLOAD),
      canUploadAudio: check(PERMISSIONS.MEDIA_AUDIO.UPLOAD),
      canUploadDocument: check(PERMISSIONS.MEDIA_DOCUMENT.UPLOAD),
      canUpdateImage: check(PERMISSIONS.MEDIA_IMAGE.UPDATE),
      canUpdateVideo: check(PERMISSIONS.MEDIA_VIDEO.UPDATE),
      canUpdateAudio: check(PERMISSIONS.MEDIA_AUDIO.UPDATE),
      canUpdateDocument: check(PERMISSIONS.MEDIA_DOCUMENT.UPDATE),
      canDeleteImage: check(PERMISSIONS.MEDIA_IMAGE.DELETE),
      canDeleteVideo: check(PERMISSIONS.MEDIA_VIDEO.DELETE),
      canDeleteAudio: check(PERMISSIONS.MEDIA_AUDIO.DELETE),
      canDeleteDocument: check(PERMISSIONS.MEDIA_DOCUMENT.DELETE),
      
      // Analytics - دقیق طبق Backend
      // analytics.manage = آمار بازدید وب
      // analytics.stats.manage = همه آمار داخلی
      // analytics.*.read = آمار خاص
      canViewUsersStats: check(PERMISSIONS.ANALYTICS.USERS_READ) || check(PERMISSIONS.ANALYTICS.STATS_MANAGE),
      canViewAdminsStats: check(PERMISSIONS.ANALYTICS.ADMINS_READ) || check(PERMISSIONS.ANALYTICS.STATS_MANAGE),
      canViewContentStats: check(PERMISSIONS.ANALYTICS.CONTENT_READ) || check(PERMISSIONS.ANALYTICS.STATS_MANAGE),
      canViewTicketsStats: check(PERMISSIONS.ANALYTICS.TICKETS_READ) || check(PERMISSIONS.ANALYTICS.STATS_MANAGE),
      canViewEmailsStats: check(PERMISSIONS.ANALYTICS.EMAILS_READ) || check(PERMISSIONS.ANALYTICS.STATS_MANAGE),
      canViewSystemStats: check(PERMISSIONS.ANALYTICS.SYSTEM_READ) || check(PERMISSIONS.ANALYTICS.STATS_MANAGE),
      canManageStatistics: check(PERMISSIONS.ANALYTICS.MANAGE), // فقط آمار بازدید وب
      canManageAllStats: check(PERMISSIONS.ANALYTICS.STATS_MANAGE), // همه آمار داخلی
      
      // Communication
      canViewEmail: check(PERMISSIONS.EMAIL.READ) || check(PERMISSIONS.EMAIL.VIEW),
      canViewAI: check(PERMISSIONS.AI.MANAGE),
      canManageTicket: check(PERMISSIONS.TICKET.MANAGE),
    };
  }, [permissionMap, permissionSet]);

  const value = useMemo<PermissionContextValue>(
    () => ({
      permissionMap: permissionMap || null,
      isLoading,
      error: error as Error | null,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
      check,
      canUploadInContext,
      refresh,
      ui: uiPermissions,
    }),
    [permissionMap, isLoading, error, hasPermission, hasAnyPermission, hasAllPermissions, check, canUploadInContext, refresh, uiPermissions]
  );

  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>;
}

export function usePermission(): PermissionContextValue {
  const context = useContext(PermissionContext);

  if (!context) {
    throw new Error('usePermission must be used within PermissionProvider');
  }

  return context;
}

