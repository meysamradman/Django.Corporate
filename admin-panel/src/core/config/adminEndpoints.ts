/**
 * Admin Panel Endpoints
 * 
 * ⚠️ نکته امنیتی مهم:
 * Frontend نباید secret path داشته باشد چون همه می‌توانند source code را ببینند.
 * امنیت باید از طریق Backend (Django middleware, CSRF, Session) انجام شود.
 */

/**
 * ساخت endpoint ادمین با فرمت استاندارد
 */
function getAdminEndpoint(path: string): string {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const finalPath = cleanPath.endsWith('/') ? cleanPath : `${cleanPath}/`;
  return `/admin/${finalPath}`;
}

export const adminEndpoints = {
  // Authentication
  login: () => getAdminEndpoint('auth/login'),
  logout: () => getAdminEndpoint('auth/logout'),
  register: () => getAdminEndpoint('auth/register'),
  csrfToken: () => getAdminEndpoint('auth/login'),
  captchaGenerate: () => `${getAdminEndpoint('auth/captcha')}generate/`,
  
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

