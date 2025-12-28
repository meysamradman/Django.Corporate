import { env } from './environment';

const ADMIN_SECRET = env.ADMIN_SECRET;

/**
 * فقط برای login و captcha از secret path استفاده می‌شود
 */
function getSecretEndpoint(path: string): string {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const finalPath = cleanPath.endsWith('/') ? cleanPath : `${cleanPath}/`;
  return `/admin/${ADMIN_SECRET}/${finalPath}`;
}

/**
 * برای بقیه endpointها بدون secret path
 */
function getAdminEndpoint(path: string): string {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const finalPath = cleanPath.endsWith('/') ? cleanPath : `${cleanPath}/`;
  return `/admin/${finalPath}`;
}

export const adminEndpoints = {
  // ✅ فقط login و captcha با secret path
  login: () => getSecretEndpoint('auth/login'),
  csrfToken: () => getSecretEndpoint('auth/login'),
  captchaGenerate: () => `${getSecretEndpoint('auth/captcha')}generate/`,
  
  // ✅ بقیه بدون secret path
  logout: () => getAdminEndpoint('auth/logout'),
  register: () => getAdminEndpoint('auth/register'),
  
  profile: () => getAdminEndpoint('profile'),
  profileMe: () => getAdminEndpoint('management/me'),
  
  management: () => getAdminEndpoint('management'),
  managementById: (id: number) => getAdminEndpoint(`management/${id}`),
  managementByPublicId: (publicId: string) => getAdminEndpoint(`management/by-public-id/${publicId}`),
  managementBulkDelete: () => getAdminEndpoint('management/bulk-delete'),
  
  usersManagement: () => getAdminEndpoint('users-management'),
  usersManagementById: (id: number) => getAdminEndpoint(`users-management/${id}`),
  usersManagementBulkDelete: () => getAdminEndpoint('users-management/bulk-delete'),
  
  roles: () => getAdminEndpoint('roles'),
  rolesBulkDelete: () => getAdminEndpoint('roles/bulk-delete'),
  rolesUserRoles: (userId: number) => `${getAdminEndpoint('roles')}user_roles/?user_id=${userId}`,
  rolesAssignRole: () => `${getAdminEndpoint('roles')}assign_role/`,
  rolesRemoveRole: (roleId: number, userId: number) => `${getAdminEndpoint('roles')}${roleId}/remove_role/?user_id=${userId}`,
  permissions: () => getAdminEndpoint('permissions'),
  permissionsMap: () => getAdminEndpoint('permissions/map'),
  permissionsCheck: () => getAdminEndpoint('permissions/check'),
} as const;

