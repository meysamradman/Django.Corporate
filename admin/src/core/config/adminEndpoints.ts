/**
 * 🔒 Admin API Endpoints با Secret Path
 * تمام URLهای ادمین باید از این helper استفاده کنن
 */
import { env } from './environment';

const ADMIN_SECRET = env.ADMIN_URL_SECRET;

/**
 * ساخت URL ادمین با secret path
 * @param path - مسیر بعد از secret (مثلا: 'auth/login' یا 'management')
 * @returns URL کامل (مثلا: '/admin/{secret}/auth/login/')
 */
export function getAdminEndpoint(path: string): string {
  // حذف slash اول اگر وجود داشته باشه
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  // اضافه کردن slash آخر اگر وجود نداشته باشه
  const finalPath = cleanPath.endsWith('/') ? cleanPath : `${cleanPath}/`;
  
  return `/admin/${ADMIN_SECRET}/${finalPath}`;
}

/**
 * Endpoint های آماده ادمین
 */
export const adminEndpoints = {
  // Authentication
  login: () => getAdminEndpoint('auth/login'),
  logout: () => getAdminEndpoint('auth/logout'),
  register: () => getAdminEndpoint('auth/register'),
  csrfToken: () => getAdminEndpoint('auth/login'), // GET برای CSRF token
  
  // Profile
  profile: () => getAdminEndpoint('profile'),
  profileMe: () => getAdminEndpoint('management/me'),
  
  // Management
  management: () => getAdminEndpoint('management'),
  managementById: (id: number) => getAdminEndpoint(`management/${id}`),
  managementByPublicId: (publicId: string) => getAdminEndpoint(`management/by-public-id/${publicId}`),
  managementBulkDelete: () => getAdminEndpoint('management/bulk-delete'),
  
  // Users Management
  usersManagement: () => getAdminEndpoint('users-management'),
  usersManagementById: (id: number) => getAdminEndpoint(`users-management/${id}`),
  usersManagementBulkDelete: () => getAdminEndpoint('users-management/bulk-delete'),
  
  // Roles & Permissions
  roles: () => getAdminEndpoint('roles'),
  rolesBulkDelete: () => getAdminEndpoint('roles/bulk-delete'),
  rolesUserRoles: (userId: number) => `${getAdminEndpoint('roles')}user_roles/?user_id=${userId}`,
  rolesAssignRole: () => `${getAdminEndpoint('roles')}assign_role/`,
  rolesRemoveRole: (roleId: number, userId: number) => `${getAdminEndpoint('roles')}${roleId}/remove_role/?user_id=${userId}`,
  permissions: () => getAdminEndpoint('permissions'),
  permissionsMap: () => getAdminEndpoint('permissions/map'),
  permissionsCheck: () => getAdminEndpoint('permissions/check'),
  
  // Captcha
  captchaGenerate: () => `${getAdminEndpoint('auth/captcha')}generate/`,
} as const;

