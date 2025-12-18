import { env } from './environment';

const ADMIN_SECRET = env.ADMIN_SECRET;

export function getAdminEndpoint(path: string): string {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const finalPath = cleanPath.endsWith('/') ? cleanPath : `${cleanPath}/`;
  
  return `/admin/${ADMIN_SECRET}/${finalPath}`;
}

export const adminEndpoints = {
  login: () => getAdminEndpoint('auth/login'),
  logout: () => getAdminEndpoint('auth/logout'),
  register: () => getAdminEndpoint('auth/register'),
  csrfToken: () => getAdminEndpoint('auth/login'),
  
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
  
  captchaGenerate: () => `${getAdminEndpoint('auth/captcha')}generate/`,
} as const;

