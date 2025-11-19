import { useMemo, useCallback } from 'react';
import { useAuth } from '@/core/auth/AuthContext';
import { PermissionProfile } from '@/types/auth/permission';

interface UserRole {
  id: number;
  name: string;
  permissions?: {
    code: string;
    name: string;
  }[];
}

export type ModuleAction =
  | 'read'
  | 'create'
  | 'update'
  | 'delete'
  | 'manage'
  | 'view'
  | 'list'
  | 'edit'
  | 'change'
  | 'add'
  | 'remove'
  | 'admin';

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

const ROLE_ACCESS_OVERRIDES: Record<
  string,
  {
    full: string[];
    readOnly?: string[];
  }
> = {
  blog_manager: {
    full: ['blog', 'blog_categories', 'blog_tags'],
    readOnly: ['media'],
  },
  portfolio_manager: {
    full: [
      'portfolio',
      'portfolio_categories',
      'portfolio_tags',
      'portfolio_options',
      'portfolio_option_values',
    ],
    readOnly: ['media'],
  },
  media_manager: {
    full: ['media'],
  },
  forms_manager: {
    full: ['forms'],
  },
  pages_manager: {
    full: ['pages'],
  },
  settings_manager: {
    full: ['settings'],
  },
  panel_manager: {
    full: ['panel'],
  },
  email_manager: {
    full: ['email'],
  },
  ai_manager: {
    full: ['ai'],
  },
  statistics_viewer: {
    full: [],
    readOnly: ['statistics', 'analytics'],
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
  }, [user?.permission_profile, user?.permissions]);

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
  }, [user?.roles]);

  const moduleActionMap = useMemo(() => {
    const map = new Map<string, Set<ModuleAction>>();
    permissions.forEach(permission => {
      if (typeof permission !== 'string') {
        return;
      }
      const [resource, rawAction] = permission.split('.');
      if (!resource) {
        return;
      }
      const normalizedAction = normalizeModuleAction(rawAction);
      const actionSet = map.get(resource) ?? new Set<ModuleAction>();
      actionSet.add(normalizedAction);
      map.set(resource, actionSet);
    });
    return map;
  }, [permissions]);

  const roleDerivedAccess = useMemo(() => {
    const fullModules = new Set<string>();
    const readOnlyModules = new Set<string>();

    userRoles.forEach((role: UserRole) => {
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

  /**
   * Check if user has a specific permission
   * @param permission - Permission string like "admin.view" or "portfolio.create"
   * @returns boolean indicating if user has permission
   */
  const hasPermission = useCallback((permission: string): boolean => {
    // Super admin has all permissions
    if (isSuperAdmin) return true;
    
    // Check if permissions are loaded
    if (!permissions.length) return false;
    
    // Check for wildcard permissions
    if (permissions.includes('*') || permissions.includes('*.*')) {
      return true;
    }
    
    // Check exact permission
    if (permissions.includes(permission)) {
      return true;
    }
    
    // Check wildcard patterns
    const [resource, action] = permission.split('.');
    const resourceWildcard = `${resource}.*`;
    
    if (permissions.includes(resourceWildcard)) {
      return true;
    }
    
    return false;
  }, [isSuperAdmin, permissions]);

  const hasModuleAction = useCallback((resource: string, action: ModuleAction | ModuleAction[]): boolean => {
    if (!resource) return false;
    const actionList = Array.isArray(action) ? action : (ACTION_SYNONYMS[action] || [action]);
    const isReadAction = actionList.every(act => READ_ACTIONS.has(act as ModuleAction));

    const moduleSpecificActions = moduleActionMap.get(resource);
    if (moduleSpecificActions) {
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

  /**
   * Check if user has any of the provided permissions
   * @param permissionList - Array of permission strings
   * @returns boolean indicating if user has at least one permission
   */
  const hasAnyPermission = (permissionList: string[]): boolean => {
    return permissionList.some(permission => hasPermission(permission));
  };

  /**
   * Check if user has all of the provided permissions
   * @param permissionList - Array of permission strings
   * @returns boolean indicating if user has all permissions
   */
  const hasAllPermissions = (permissionList: string[]): boolean => {
    return permissionList.every(permission => hasPermission(permission));
  };

  /**
   * Get filtered permissions by resource
   * @param resource - Resource name like "admin", "portfolio", etc.
   * @returns Array of permission strings for the resource
   */
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

  /**
   * Check if user can perform CRUD operations on a resource
   * @param resource - Resource name
   * @returns Object with boolean flags for each CRUD operation
   */
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

  /**
   * Check if user has a specific role
   * @param roleName - Role name
   * @returns boolean indicating if user has the role
   */
  const hasRole = useCallback((roleName: string): boolean => {
    return userRoles.some((role: UserRole) => 
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

