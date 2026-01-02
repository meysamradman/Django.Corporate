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

let cachedAPI_URL: string | null = null;
let cachedMEDIA_BASE_URL: string | null = null;

export const env = {
  get API_URL(): string {
    if (cachedAPI_URL === null) {
      // بدون fallback - باید از .env بیاید
      cachedAPI_URL = getEnvVar('VITE_API_URL');
    }
    return cachedAPI_URL;
  },

  get MEDIA_BASE_URL(): string {
    if (cachedMEDIA_BASE_URL === null) {
      // بدون fallback - باید از .env بیاید
      cachedMEDIA_BASE_URL = getEnvVar('VITE_MEDIA_BASE_URL');
    }
    return cachedMEDIA_BASE_URL;
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

