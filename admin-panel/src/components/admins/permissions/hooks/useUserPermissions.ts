import { useMemo, useCallback } from 'react';
import { useAuth } from '@/core/auth/AuthContext';
import type { PermissionProfile, UserRole, ModuleAction, Role } from '@/types/auth/permission';

const ACTION_SYNONYMS: Record<ModuleAction, ModuleAction[]> = {
  read: ['read', 'view', 'list'],
  view: ['read', 'view', 'list'],
  list: ['read', 'view', 'list'],
  create: ['create', 'add'],
  update: ['update', 'edit', 'change'],
  edit: ['update', 'edit', 'change'],
  change: ['update', 'edit', 'change'],
  delete: ['delete', 'remove'],
  manage: ['manage', 'admin'],
  add: ['create', 'add'],
  remove: ['delete', 'remove'],
  admin: ['manage', 'admin'],
};

const READ_ACTIONS = new Set<ModuleAction>(['read', 'view', 'list']);
const MODULE_ACTIONS: ModuleAction[] = [
  'read',
  'create',
  'update',
  'delete',
  'manage',
  'view',
  'list',
  'edit',
  'change',
  'add',
  'remove',
  'admin',
];

const normalizeModuleAction = (value?: string): ModuleAction => {
  if (!value) return 'read';
  const candidate = value.toLowerCase() as ModuleAction;
  if ((MODULE_ACTIONS as string[]).includes(candidate)) {
    return candidate;
  }
  return 'read';
};

const MODULE_NAMES = {
  BLOG: 'blog',
  BLOG_CATEGORY: 'blog.category',
  BLOG_TAG: 'blog.tag',
  PORTFOLIO: 'portfolio',
  PORTFOLIO_CATEGORY: 'portfolio.category',
  PORTFOLIO_TAG: 'portfolio.tag',
  PORTFOLIO_OPTION: 'portfolio.option',
  MEDIA: 'media',
  MEDIA_IMAGE: 'media.image',
  MEDIA_VIDEO: 'media.video',
  MEDIA_AUDIO: 'media.audio',
  MEDIA_DOCUMENT: 'media.document',
  FORMS: 'forms',
  PAGES: 'pages',
  SETTINGS: 'settings',
  PANEL: 'panel',
  EMAIL: 'email',
  TICKET: 'ticket',
  CHATBOT: 'chatbot',
  AI: 'ai',
  ANALYTICS: 'analytics',
  USERS: 'users',
  ADMIN: 'admin',
  REAL_ESTATE: 'real_estate',
  REAL_ESTATE_PROPERTY: 'real_estate.property',
  REAL_ESTATE_AGENT: 'real_estate.agent',
  REAL_ESTATE_AGENCY: 'real_estate.agency',
  REAL_ESTATE_TYPE: 'real_estate.type',
  REAL_ESTATE_STATE: 'real_estate.state',
  REAL_ESTATE_LABEL: 'real_estate.label',
  REAL_ESTATE_FEATURE: 'real_estate.feature',
  REAL_ESTATE_TAG: 'real_estate.tag',
} as const;

const ROLE_ACCESS_OVERRIDES: Record<
  string,
  {
    full: string[];
    readOnly?: string[];
  }
> = {
  blog_manager: {
    full: [MODULE_NAMES.BLOG, MODULE_NAMES.BLOG_CATEGORY, MODULE_NAMES.BLOG_TAG],
  },
  portfolio_manager: {
    full: [
      MODULE_NAMES.PORTFOLIO,
      MODULE_NAMES.PORTFOLIO_CATEGORY,
      MODULE_NAMES.PORTFOLIO_TAG,
      MODULE_NAMES.PORTFOLIO_OPTION,
    ],
  },
  media_manager: {
    full: [MODULE_NAMES.MEDIA, MODULE_NAMES.MEDIA_IMAGE, MODULE_NAMES.MEDIA_VIDEO, MODULE_NAMES.MEDIA_AUDIO, MODULE_NAMES.MEDIA_DOCUMENT],
  },
  forms_manager: {
    full: [MODULE_NAMES.FORMS],
  },
  pages_manager: {
    full: [MODULE_NAMES.PAGES],
  },
  settings_manager: {
    full: [MODULE_NAMES.SETTINGS],
  },
  panel_manager: {
    full: [MODULE_NAMES.PANEL],
  },
  email_manager: {
    full: [MODULE_NAMES.EMAIL],
  },
  ticket_manager: {
    full: [MODULE_NAMES.TICKET],
  },
  chatbot_manager: {
    full: [MODULE_NAMES.CHATBOT],
  },
  ai_manager: {
    full: [MODULE_NAMES.AI],
  },
  analytics_manager: {
    full: [MODULE_NAMES.ANALYTICS],
  },
  user_manager: {
    full: [MODULE_NAMES.USERS, MODULE_NAMES.ADMIN],
  },
  real_estate_manager: {
    full: [
      MODULE_NAMES.REAL_ESTATE,
      MODULE_NAMES.REAL_ESTATE_PROPERTY,
      MODULE_NAMES.REAL_ESTATE_AGENT,
      MODULE_NAMES.REAL_ESTATE_AGENCY,
      MODULE_NAMES.REAL_ESTATE_TYPE,
      MODULE_NAMES.REAL_ESTATE_STATE,
      MODULE_NAMES.REAL_ESTATE_LABEL,
      MODULE_NAMES.REAL_ESTATE_FEATURE,
      MODULE_NAMES.REAL_ESTATE_TAG,
    ],
  },
};

export function useUserPermissions() {
  const { user } = useAuth();

  const permissions = useMemo(() => {
    if (!user?.permissions) return [];
    if (Array.isArray(user.permissions)) {
      if (user.permissions.length && typeof user.permissions[0] !== 'string') {
        return [];
      }
      return user.permissions as string[];
    }
    if (
      typeof user.permissions === 'object' &&
      user.permissions !== null &&
      Array.isArray((user.permissions as Record<string, unknown>).permissions)
    ) {
      return [
        ...((user.permissions as Record<string, unknown>).permissions as string[]),
      ];
    }
    return [];
  }, [user?.permissions]);

  const permissionProfile = useMemo(() => {
    if (user?.permission_profile) {
      return user.permission_profile;
    }
    if (
      user?.permissions &&
      typeof user.permissions === 'object' &&
      !Array.isArray(user.permissions)
    ) {
      const profileCandidate = user.permissions as PermissionProfile;
      if (
        (profileCandidate.modules && profileCandidate.modules.length) ||
        (profileCandidate.actions && profileCandidate.actions.length)
      ) {
        return profileCandidate;
      }
    }
    return undefined;
  }, [user]);

  const legacyIsSuper =
    typeof user === "object" && user
      ? Boolean(
        (user as unknown as Record<string, unknown>)["is_super"]
      )
      : false;

  const isSuperAdmin = Boolean(user?.is_superuser || legacyIsSuper);

  const userRoles = useMemo(() => {
    if (!user?.roles) return [];
    return [...user.roles];
  }, [user]);

  const moduleActionMap = useMemo(() => {
    const map = new Map<string, Set<ModuleAction>>();
    permissions.forEach(permission => {
      if (typeof permission !== 'string') {
        return;
      }
      const parts = permission.split('.');
      if (parts.length < 2) {
        return;
      }

      const resource = parts[0];
      const lastPart = parts[parts.length - 1];

      const normalizedAction = normalizeModuleAction(lastPart);

      if (normalizedAction && lastPart !== '') {
        const actionSet = map.get(resource) ?? new Set<ModuleAction>();
        actionSet.add(normalizedAction);
        map.set(resource, actionSet);
      }
    });
    return map;
  }, [permissions]);

  const roleDerivedAccess = useMemo(() => {
    const fullModules = new Set<string>();
    const readOnlyModules = new Set<string>();

    userRoles.forEach((role: Role | UserRole) => {
      const overrides = ROLE_ACCESS_OVERRIDES[role.name];
      if (!overrides) {
        return;
      }
      overrides.full?.forEach(module => fullModules.add(module));
      overrides.readOnly?.forEach(module => {
        if (!fullModules.has(module)) {
          readOnlyModules.add(module);
        }
      });
    });

    return {
      fullModules,
      readOnlyModules,
    };
  }, [userRoles]);

  const hasPermission = useCallback((permission: string): boolean => {
    if (isSuperAdmin) return true;

    if (!permissions.length) return false;

    if (permissions.includes('*') || permissions.includes('*.*')) {
      return true;
    }

    if (permissions.includes(permission)) {
      return true;
    }

    const parts = permission.split('.');
    if (parts.length < 2) return false;

    const resource = parts[0];
    const action = parts[parts.length - 1];

    if (permissions.includes(`${resource}.*`)) {
      return true;
    }

    if (permissions.includes(`${resource}.manage`) || permissions.includes(`${resource}.admin`)) {
      return true;
    }

    if (resource === 'ai' && action === 'manage') {
      const hasAnyAIPermission = permissions.some(perm =>
        perm.startsWith('ai.') && perm.endsWith('.manage')
      );
      return hasAnyAIPermission;
    }

    return false;
  }, [isSuperAdmin, permissions]);

  const hasModuleAction = useCallback((resource: string, action: ModuleAction | ModuleAction[]): boolean => {
    if (!resource) return false;
    const actionList = Array.isArray(action) ? action : (ACTION_SYNONYMS[action] || [action]);
    const isReadAction = actionList.every(act => READ_ACTIONS.has(act as ModuleAction));

    const moduleSpecificActions = moduleActionMap.get(resource);
    if (moduleSpecificActions) {
      if (moduleSpecificActions.has('manage') || moduleSpecificActions.has('admin')) {
        return true;
      }

      if (isReadAction) {
        const hasReadAccess = Array.from(READ_ACTIONS).some(readAction => moduleSpecificActions.has(readAction));
        if (hasReadAccess) {
          return true;
        }
      }

      const hasRequestedAction = actionList.some(act => moduleSpecificActions.has(act as ModuleAction));
      if (hasRequestedAction) {
        return true;
      }
    }

    if (roleDerivedAccess.fullModules.has(resource)) {
      return true;
    }

    if (isReadAction && roleDerivedAccess.readOnlyModules.has(resource)) {
      return true;
    }

    if (permissionProfile?.modules?.includes(resource)) {
      if (
        isReadAction ||
        actionList.some(act => permissionProfile?.actions?.includes(act as ModuleAction))
      ) {
        return true;
      }
    }

    const hasDirectPermission = actionList.some(act => hasPermission(`${resource}.${act}`));
    if (hasDirectPermission) {
      return true;
    }

    return false;
  }, [roleDerivedAccess, permissionProfile, hasPermission, moduleActionMap]);

  const hasAnyPermission = (permissionList: string[]): boolean => {
    return permissionList.some(permission => hasPermission(permission));
  };

  const hasAllPermissions = (permissionList: string[]): boolean => {
    return permissionList.every(permission => hasPermission(permission));
  };

  const getResourcePermissions = (resource: string): string[] => {
    return permissions.filter(perm => perm.startsWith(`${resource}.`));
  };

  const getModuleAccessProfile = useCallback((resource: string) => {
    const canRead = hasModuleAction(resource, 'read');
    const canCreate = hasModuleAction(resource, 'create');
    const canUpdate = hasModuleAction(resource, 'update');
    const canDelete = hasModuleAction(resource, 'delete');
    const canManage = hasModuleAction(resource, 'manage');
    const isReadOnly =
      roleDerivedAccess.readOnlyModules.has(resource) &&
      !roleDerivedAccess.fullModules.has(resource);
    const hasWrite = !isReadOnly && (canCreate || canUpdate || canDelete || canManage);

    return {
      module: resource,
      canRead,
      canCreate,
      canUpdate,
      canDelete,
      canManage,
      hasWrite,
      hasAnyAccess: canRead || hasWrite,
    };
  }, [hasModuleAction, roleDerivedAccess]);

  const getResourceAccess = (resource: string) => {
    const profile = getModuleAccessProfile(resource);

    return {
      list: profile.canRead,
      view: profile.canRead,
      read: profile.canRead,
      create: profile.canCreate,
      edit: profile.canUpdate,
      update: profile.canUpdate,
      delete: profile.canDelete,
      manage: profile.canManage,
      hasWrite: profile.hasWrite,
    };
  };

  const hasRole = useCallback((roleName: string): boolean => {
    return userRoles.some((role: Role | UserRole) =>
      role.name === roleName
    );
  }, [userRoles]);

  return {
    permissions,
    permissionProfile,
    isSuperAdmin,
    userRoles,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    getResourcePermissions,
    getResourceAccess,
    getModuleAccessProfile,
    hasModuleAction,
    hasRole,
  };
}

