import { env } from './environment';

function getAdminEndpoint(path: string): string {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const finalPath = cleanPath.endsWith('/') ? cleanPath : `${cleanPath}/`;
  return `/api/admin/${env.ADMIN_SECRET}/${finalPath}`;
}

export const endpoints = {
  auth: {
    login: () => getAdminEndpoint('auth/login'),
    logout: () => getAdminEndpoint('auth/logout'),
    csrfToken: () => getAdminEndpoint('auth/login'),
    captchaGenerate: () => `${getAdminEndpoint('auth/captcha')}generate/`,
    getCurrentUser: () => getAdminEndpoint('management/me'),
  },
};

