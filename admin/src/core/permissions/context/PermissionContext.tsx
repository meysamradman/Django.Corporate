'use client';

import React, { createContext, useContext, useMemo, useCallback, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { permissionApi } from '@/api/permissions/route';
import type { PermissionMapResponse } from '@/api/permissions/route';

export interface UIPermissions {
  canManagePanel: boolean;
  canManagePages: boolean;
  canManageSettings: boolean;
  canManageAI: boolean;
  canManageForms: boolean;
  canManageChatbot: boolean;
  
  canManageAIChat: boolean;
  canManageAIContent: boolean;
  canManageAIImage: boolean;
  canManageAIAudio: boolean;
  canManageAISettings: boolean;
  canManageSharedAISettings: boolean;
  
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
  
  canReadMedia: boolean;
  canUploadMedia: boolean;
  canUpdateMedia: boolean;
  canDeleteMedia: boolean;
  canManageMedia: boolean;
  
  canUploadImage: boolean;
  canUploadVideo: boolean;
  canUploadAudio: boolean;
  canUploadDocument: boolean;
  
  canUpdateImage: boolean;
  canUpdateVideo: boolean;
  canUpdateAudio: boolean;
  canUpdateDocument: boolean;
  
  canDeleteImage: boolean;
  canDeleteVideo: boolean;
  canDeleteAudio: boolean;
  canDeleteDocument: boolean;
  
  canViewDashboardStats: boolean;
  canViewUsersStats: boolean;
  canViewAdminsStats: boolean;
  canViewContentStats: boolean;
  canViewFinancialStats: boolean;
  canExportStats: boolean;
  canManageStatistics: boolean;
  
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
  ui: UIPermissions;
}

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

  const canUploadInContext = useCallback(
    (context: 'portfolio' | 'blog' | 'media_library'): boolean => {
      if (!permissionMap) return false;
      if (permissionMap.is_superadmin) return true;

      if (context === 'media_library') {
        return hasPermission('media.upload') || 
               hasPermission('media.image.upload') ||
               hasPermission('media.video.upload') ||
               hasPermission('media.audio.upload') ||
               hasPermission('media.document.upload');
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
      canManagePanel: check('panel.manage'),
      canManagePages: check('pages.manage'),
      canManageSettings: check('settings.manage'),
      canManageAI: check('ai.manage'),
      canManageForms: check('forms.manage'),
      canManageChatbot: check('chatbot.manage'),
      
      canManageAIChat: check('ai.chat.manage') || check('ai.manage'),
      canManageAIContent: check('ai.content.manage') || check('ai.manage'),
      canManageAIImage: check('ai.image.manage') || check('ai.manage'),
      canManageAIAudio: check('ai.audio.manage') || check('ai.manage'),
      canManageAISettings: check('ai.settings.personal.manage') || check('ai.manage'),
      canManageSharedAISettings: check('ai.settings.shared.manage') || isSuperAdmin,
      
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
      
      canReadMedia: check('media.read'),
      canUploadMedia: check('media.upload'),
      canUpdateMedia: check('media.update'),
      canDeleteMedia: check('media.delete'),
      canManageMedia: check('media.manage'),
      
      canUploadImage: check('media.image.upload'),
      canUploadVideo: check('media.video.upload'),
      canUploadAudio: check('media.audio.upload'),
      canUploadDocument: check('media.document.upload'),
      
      canUpdateImage: check('media.image.update'),
      canUpdateVideo: check('media.video.update'),
      canUpdateAudio: check('media.audio.update'),
      canUpdateDocument: check('media.document.update'),
      
      canDeleteImage: check('media.image.delete'),
      canDeleteVideo: check('media.video.delete'),
      canDeleteAudio: check('media.audio.delete'),
      canDeleteDocument: check('media.document.delete'),
      
      canViewDashboardStats: check('statistics.dashboard.read'),
      canViewUsersStats: check('statistics.users.read'),
      canViewAdminsStats: check('statistics.admins.read'),
      canViewContentStats: check('statistics.content.read'),
      canViewFinancialStats: check('statistics.financial.read'),
      canExportStats: check('statistics.export'),
      canManageStatistics: check('statistics.manage'),
      
      canViewEmail: check('email.read') || check('email.view'),
      canViewAI: check('ai.read') || check('ai.view'),
      canManageTicket: check('ticket.manage'),
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
      canUploadInContext,
      refresh,
      ui: uiPermissions,
    }),
    [permissionMap, isLoading, error, hasPermission, hasAnyPermission, hasAllPermissions, canUploadInContext, refresh, uiPermissions]
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

