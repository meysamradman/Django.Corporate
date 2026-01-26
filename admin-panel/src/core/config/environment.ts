const IS_DEV = import.meta.env.DEV;
const IS_PROD = import.meta.env.PROD;

const getEnvVar = (key: string, devDefault?: string): string => {
  const value = import.meta.env[key]?.trim();

  if (!value) {
    if (IS_PROD) {
      throw new Error(`🚨 CONFIGURATION ERROR: ${key} environment variable is required in production. Please set it in your .env file.`);
    }

    if (devDefault !== undefined) {
      return devDefault;
    }

    throw new Error(`🚨 DEVELOPMENT ERROR: ${key} environment variable is required. Please create a .env file based on .env.example`);
  }

  return value;
};

export const env = {
  get API_URL(): string {
    return getEnvVar('VITE_API_URL');
  },

  get MEDIA_BASE_URL(): string {
    return getEnvVar('VITE_MEDIA_BASE_URL');
  },

  get ADMIN_URL_SECRET(): string {
    return getEnvVar('VITE_ADMIN_URL_SECRET');
  },

  get IS_DEV(): boolean {
    return IS_DEV;
  },

  get IS_PROD(): boolean {
    return IS_PROD;
  },

  get BLOG_MEDIA_UPLOAD_MAX(): number {
    const value = import.meta.env.VITE_BLOG_MEDIA_UPLOAD_MAX;
    return value ? parseInt(value, 10) : 10;
  },

  get PORTFOLIO_MEDIA_UPLOAD_MAX(): number {
    const value = import.meta.env.VITE_PORTFOLIO_MEDIA_UPLOAD_MAX;
    return value ? parseInt(value, 10) : 10;
  },

  get REAL_ESTATE_MEDIA_UPLOAD_MAX(): number {
    const value = import.meta.env.VITE_REAL_ESTATE_MEDIA_UPLOAD_MAX;
    return value ? parseInt(value, 10) : 50;
  },

  get BLOG_EXPORT_PRINT_MAX_ITEMS(): number {
    const value = import.meta.env.VITE_BLOG_EXPORT_PRINT_MAX_ITEMS;
    return value ? parseInt(value, 10) : 100;
  },

  get PORTFOLIO_EXPORT_PRINT_MAX_ITEMS(): number {
    const value = import.meta.env.VITE_PORTFOLIO_EXPORT_PRINT_MAX_ITEMS;
    return value ? parseInt(value, 10) : 100;
  },

  get REAL_ESTATE_EXPORT_PRINT_MAX_ITEMS(): number {
    const value = import.meta.env.VITE_REAL_ESTATE_EXPORT_PRINT_MAX_ITEMS;
    return value ? parseInt(value, 10) : 100;
  },
} as const;

