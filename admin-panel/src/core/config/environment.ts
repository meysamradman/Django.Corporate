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
} as const;

export const MEDIA_CONFIG = {
  IMAGE_SIZE_LIMIT: 5000000,        // 5 MB
  VIDEO_SIZE_LIMIT: 157286400,      // 150 MB
  AUDIO_SIZE_LIMIT: 20971520,       // 20 MB
  PDF_SIZE_LIMIT: 10485760,         // 10 MB

  IMAGE_EXTENSIONS: ['jpg', 'jpeg', 'webp', 'png', 'svg', 'gif'],
  VIDEO_EXTENSIONS: ['mp4', 'webm'],
  AUDIO_EXTENSIONS: ['mp3', 'ogg', 'aac', 'm4a'],
  PDF_EXTENSIONS: ['pdf'],

  PORTFOLIO_UPLOAD_MAX: 10,
  BLOG_UPLOAD_MAX: 10,
  REAL_ESTATE_UPLOAD_MAX: 30,

  PORTFOLIO_EXPORT_PRINT_MAX_ITEMS: 2000,
  BLOG_EXPORT_PRINT_MAX_ITEMS: 2000,
  REAL_ESTATE_EXPORT_PRINT_MAX_ITEMS: 2000,
} as const;
