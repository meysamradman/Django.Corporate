// Re-export core permission configs
export * from './constants';
export * from './roles';
export * from './accessControl';

// Re-export permission components and hooks from admins/permissions
export { 
  PermissionProvider, 
  usePermission,
  PermissionGate,
  ProtectedButton,
  ProtectedLink,
  ProtectedRoute,
  RoutePermissionGuard,
  useHasPermission,
  useUserPermissions,
  useUIPermissions,
  useCanUpload,
  useHasAccess
} from '@/components/admins/permissions';
