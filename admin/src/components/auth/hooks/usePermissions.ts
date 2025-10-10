import { useMemo } from 'react';
import { useAuth } from '@/core/auth/AuthContext';

interface PermissionCheck {
  resource: string;
  action: string;
  scope?: string;
}

interface UserRole {
  id: number;
  name: string;
  permissions: {
    code: string;
    name: string;
  }[];
}

export function useUserPermissions() {
  const { user } = useAuth();
  
  const permissions = useMemo(() => {
    if (!user?.permissions) return [];
    return user.permissions as string[];
  }, [user?.permissions]);

  const isSuperAdmin = useMemo(() => {
    return user?.is_super === true;
  }, [user?.is_super]);

  /**
   * Check if user has a specific permission
   * @param permission - Permission string like "admin.view" or "portfolio.create"
   * @returns boolean indicating if user has permission
   */
  const hasPermission = (permission: string): boolean => {
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
  };

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

  /**
   * Check if user can perform CRUD operations on a resource
   * @param resource - Resource name
   * @returns Object with boolean flags for each CRUD operation
   */
  const getResourceAccess = (resource: string) => {
    return {
      list: hasPermission(`${resource}.list`),
      view: hasPermission(`${resource}.view`),
      create: hasPermission(`${resource}.create`),
      edit: hasPermission(`${resource}.edit`),
      delete: hasPermission(`${resource}.delete`),
      manage: hasPermission(`${resource}.manage`),
    };
  };

  /**
   * Get user roles
   * @returns Array of role objects
   */
  const userRoles = useMemo(() => {
    if (!user?.roles) return [];
    return user.roles;
  }, [user?.roles]);

  /**
   * Check if user has a specific role
   * @param roleName - Role name
   * @returns boolean indicating if user has the role
   */
  const hasRole = (roleName: string): boolean => {
    return userRoles.some((role: UserRole) => 
      role.name === roleName
    );
  };

  return {
    permissions,
    isSuperAdmin,
    userRoles,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    getResourcePermissions,
    getResourceAccess,
    hasRole,
  };
} 