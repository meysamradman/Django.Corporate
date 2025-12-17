// Fallback value باید با Django settings یکسان باشد
const ADMIN_SECRET = import.meta.env.VITE_ADMIN_SECRET || 'x7K9mP2qL5nR8tY3vZ6wC4fH1jN0bM';

function getAdminEndpoint(path: string): string {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const finalPath = cleanPath.endsWith('/') ? cleanPath : `${cleanPath}/`;
  return `/api/admin/${ADMIN_SECRET}/${finalPath}`;
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

