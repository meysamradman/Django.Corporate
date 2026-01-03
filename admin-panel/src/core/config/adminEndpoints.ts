import { env } from './environment';

function getAdminEndpoint(path: string): string {
  const secret = env.ADMIN_URL_SECRET;
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const finalPath = cleanPath.endsWith('/') ? cleanPath : `${cleanPath}/`;

  // اگر مسیر شامل auth/login یا auth/captcha باشد، از secret استفاده می‌کنیم
  if (cleanPath.startsWith('auth/login') || cleanPath.startsWith('auth/captcha')) {
    return `/admin/${secret}/${finalPath}`;
  }

  return `/admin/${finalPath}`;
}

export const adminEndpoints = {
  // Authentication
  login: () => getAdminEndpoint('auth/login'),
  logout: () => getAdminEndpoint('auth/logout'),
  register: () => getAdminEndpoint('auth/register'),
  csrfToken: () => getAdminEndpoint('auth/login'),
  // Captcha باید با full path باشه چون از getPublic استفاده می‌کنه
  // توجه: baseURL قبلاً /api داره، پس نباید دوباره /api بذاریم
  captchaGenerate: () => {
    const secret = env.ADMIN_URL_SECRET;
    return `/admin/${secret}/auth/captcha/generate/`;
  },

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

