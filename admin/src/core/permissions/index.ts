export { PermissionProvider, usePermission } from './context/PermissionContext';
export type { PermissionContextValue, UIPermissions } from './context/PermissionContext';

export { useHasPermission } from './hooks/useHasPermission';
export { useCanUpload } from './hooks/useCanUpload';
export { useHasAccess } from './hooks/useHasAccess';
export { usePermissionMap } from './hooks/usePermissionMap';
export { useUserPermissions, type ModuleAction } from './hooks/useUserPermissions';
export {
  useUIPermissions,
  useCanManageSettings,
  useCanUploadMedia,
  useCanManageAI,
  useCanManageAIChat,
  useCanManageAIContent,
  useCanManageAIImage,
  useCanManageAIAudio,
  useCanManageAISettings,
  useCanManageSharedAISettings,
  useCanManageForms,
  useCanManagePanel,
  useCanManagePages,
  useCanUploadImage,
  useCanUploadVideo,
  useCanUploadAudio,
  useCanUploadDocument,
  useCanViewDashboardStats,
  useCanViewUsersStats,
  useCanViewAdminsStats,
  useCanViewContentStats,
  useCanExportStats,
  useCanManageStatistics,
} from './hooks/useUIPermissions';
export {
  useRoles,
  useRole,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
  useBulkDeleteRoles,
  useUpdateRoleStatus,
  usePermissions,
  useBasePermissions,
} from './hooks/useRoles';

export { PermissionGate } from './components/PermissionGate';
export { PermissionLocked } from './components/PermissionLocked';
export { ProtectedButton } from './components/ProtectedButton';
export { ProtectedLink } from './components/ProtectedLink';
export { RoutePermissionGuard } from './components/RoutePermissionGuard';
export { ProtectedRoute } from './components/ProtectedRoute';
export { AccessDenied } from './components/AccessDenied';
export {
  PermissionGate as PermissionGateLegacy,
  PermissionMultiGate,
  ProtectedAction,
  usePermissionProps,
} from './components/PermissionGateLegacy';

export {
  parsePermission,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getPermissionsByResource,
  getPermissionsByAction,
  formatPermission,
  groupPermissionsByResource,
  hasRole,
  getHighestPriorityRole,
  usePermissions as usePermissionsUtils,
  type PermissionCheck,
  type UserPermissions,
} from './utils/permissionUtils';

export {
  SYSTEM_ROLES,
  getRoleConfig,
  getRoleDisplayName,
  getRoleIcon,
  getRoleColor,
  isSuperAdmin,
  getUserRoleDisplayText,
  getSystemRoles,
  getAvailableRoles,
  ROLE_COLORS,
  getRoleColorClasses,
  type RoleConfig,
} from './config/roles';

export {
  findRouteRule,
  routeRules,
  type RouteRule,
} from './config/accessControl';

export type {
  PermissionMeta,
  PermissionMap,
  PermissionSnapshot,
} from './types';

