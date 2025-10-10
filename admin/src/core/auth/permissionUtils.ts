'use client'

import { useAuth } from '@/core/auth/AuthContext'

export interface PermissionCheck {
  resource: string
  action: string
  scope?: string
}

export interface UserPermissions {
  permissions: string[]
  is_super?: boolean
  is_superuser?: boolean
  roles?: Array<{
    id: number
    code: string
    name: string
    priority: number
  }>
}

export function parsePermission(permission: string): PermissionCheck {
  const parts = permission.split(':')
  const resourceAction = parts[0].split('.')
  
  return {
    resource: resourceAction[0],
    action: resourceAction[1] || '*',
    scope: parts[1] || 'global'
  }
}

/**
 * Check if user has a specific permission
 */
export function hasPermission(
  userPermissions: UserPermissions,
  requiredPermission: string | PermissionCheck
): boolean {
  // Super admin has all permissions
  if (userPermissions.is_super || userPermissions.is_superuser) {
    return true
  }

  const permissions = userPermissions.permissions || []
  
  // Check for wildcard permissions
  if (permissions.includes('*') || permissions.includes('*.*')) {
    return true
  }

  // Parse required permission
  const required = typeof requiredPermission === 'string' 
    ? parsePermission(requiredPermission) 
    : requiredPermission

  // Check exact match first
  const exactPermission = `${required.resource}.${required.action}`
  if (required.scope && required.scope !== 'global') {
    const scopedPermission = `${exactPermission}:${required.scope}`
    if (permissions.includes(scopedPermission)) {
      return true
    }
  }
  
  if (permissions.includes(exactPermission)) {
    return true
  }

  // Check wildcard patterns
  for (const userPerm of permissions) {
    if (matchesPermissionPattern(userPerm, required)) {
      return true
    }
  }

  return false
}

/**
 * Check if user permission pattern matches required permission
 */
function matchesPermissionPattern(userPermission: string, required: PermissionCheck): boolean {
  const user = parsePermission(userPermission)
  
  // Resource wildcard check
  if (user.resource === '*' || user.resource === required.resource) {
    // Action wildcard check
    if (user.action === '*' || user.action === required.action) {
      // Scope check
      if (user.scope === 'global' || user.scope === required.scope) {
        return true
      }
    }
  }
  
  // Resource.* patterns
  if (user.action === '*' && user.resource === required.resource) {
    return true
  }
  
  return false
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(
  userPermissions: UserPermissions,
  requiredPermissions: (string | PermissionCheck)[]
): boolean {
  return requiredPermissions.some(permission => 
    hasPermission(userPermissions, permission)
  )
}

/**
 * Check if user has all of the specified permissions
 */
export function hasAllPermissions(
  userPermissions: UserPermissions,
  requiredPermissions: (string | PermissionCheck)[]
): boolean {
  return requiredPermissions.every(permission => 
    hasPermission(userPermissions, permission)
  )
}

/**
 * Get filtered permissions by resource
 */
export function getPermissionsByResource(
  userPermissions: UserPermissions,
  resource: string
): string[] {
  if (userPermissions.is_super || userPermissions.is_superuser) {
    return ['*']
  }

  const permissions = userPermissions.permissions || []
  return permissions.filter(permission => {
    const parsed = parsePermission(permission)
    return parsed.resource === resource || parsed.resource === '*'
  })
}

/**
 * Get filtered permissions by action
 */
export function getPermissionsByAction(
  userPermissions: UserPermissions,
  action: string
): string[] {
  if (userPermissions.is_super || userPermissions.is_superuser) {
    return ['*']
  }

  const permissions = userPermissions.permissions || []
  return permissions.filter(permission => {
    const parsed = parsePermission(permission)
    return parsed.action === action || parsed.action === '*'
  })
}

/**
 * Format permission for display
 */
export function formatPermission(permission: string): string {
  const parsed = parsePermission(permission)
  
  const resourceMap: Record<string, string> = {
    'admin': 'مدیریت',
    'role': 'نقش',
    'permission': 'دسترسی',
    'user': 'کاربر',
    'portfolio': 'نمونه کار',
    'blog': 'بلاگ',
    'page': 'صفحه',
    'media': 'رسانه',
    'settings': 'تنظیمات',
    'statistics': 'آمار',
    'audit_log': 'گزارش فعالیت'
  }

  const actionMap: Record<string, string> = {
    'list': 'مشاهده لیست',
    'view': 'مشاهده',
    'create': 'ایجاد',
    'edit': 'ویرایش',
    'delete': 'حذف',
    'manage': 'مدیریت کامل',
    'export': 'خروجی',
    'import': 'ورودی',
    'approve': 'تایید',
    'publish': 'انتشار'
  }

  const resource = resourceMap[parsed.resource] || parsed.resource
  const action = actionMap[parsed.action] || parsed.action
  
  let result = `${action} ${resource}`
  
  if (parsed.scope && parsed.scope !== 'global') {
    const scopeMap: Record<string, string> = {
      'own': 'خود',
      'department': 'بخش',
      'team': 'تیم'
    }
    const scope = scopeMap[parsed.scope] || parsed.scope
    result += ` (${scope})`
  }
  
  return result
}

/**
 * Group permissions by resource for better organization
 */
export function groupPermissionsByResource(permissions: string[]): Record<string, string[]> {
  const grouped: Record<string, string[]> = {}
  
  for (const permission of permissions) {
    const parsed = parsePermission(permission)
    if (!grouped[parsed.resource]) {
      grouped[parsed.resource] = []
    }
    grouped[parsed.resource].push(permission)
  }
  
  return grouped
}

/**
 * Check if user has role with specific code
 */
export function hasRole(
  userPermissions: UserPermissions,
  roleCode: string
): boolean {
  const roles = userPermissions.roles || []
  return roles.some(role => role.code === roleCode)
}

/**
 * Get user's highest priority role
 */
export function getHighestPriorityRole(userPermissions: UserPermissions): string | null {
  const roles = userPermissions.roles || []
  if (roles.length === 0) return null
  
  const highestRole = roles.reduce((prev, current) => 
    (prev.priority > current.priority) ? prev : current
  )
  
  return highestRole.code
}

/**
 * React Hook for permission checking
 * Uses the current user's permissions from AuthContext
 */
export function usePermissions() {
  const { user } = useAuth()
  
  // Transform UserRole to match our interface
  const transformedRoles = user?.roles?.map((role: { id: number; name: string }) => ({
    id: role.id,
    code: role.name, // Using name as code since UserRole doesn't have code
    name: role.name,
    priority: 0 // Default priority since UserRole doesn't have priority
  })) || []
  
  const userPermissions: UserPermissions = {
    permissions: user?.permissions || [],
    is_super: user?.is_superuser || false,
    is_superuser: user?.is_superuser || false,
    roles: transformedRoles
  }
  
  return {
    hasPermission: (permission: string | PermissionCheck) => 
      hasPermission(userPermissions, permission),
    hasAnyPermission: (permissions: (string | PermissionCheck)[]) => 
      hasAnyPermission(userPermissions, permissions),
    hasAllPermissions: (permissions: (string | PermissionCheck)[]) => 
      hasAllPermissions(userPermissions, permissions),
    getPermissionsByResource: (resource: string) => 
      getPermissionsByResource(userPermissions, resource),
    getPermissionsByAction: (action: string) => 
      getPermissionsByAction(userPermissions, action),
    hasRole: (roleCode: string) => 
      hasRole(userPermissions, roleCode),
    getHighestPriorityRole: () => 
      getHighestPriorityRole(userPermissions),
    formatPermission,
    groupPermissionsByResource: (permissions: string[]) => 
      groupPermissionsByResource(permissions),
    userPermissions
  }
} 