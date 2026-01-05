export const IS_PRODUCTION = process.env.NODE_ENV === 'production';
export const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';
export const IS_TEST = process.env.NODE_ENV === 'test';

export const env = {
  get API_BASE_URL(): string {
    const url = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!url) {
      throw new Error('🚨 CONFIGURATION ERROR: NEXT_PUBLIC_API_BASE_URL environment variable is required.');
    }
    return url;
  },

  get MEDIA_BASE_URL(): string {
    const url = process.env.NEXT_PUBLIC_MEDIA_BASE_URL;
    if (!url) {
      throw new Error('🚨 CONFIGURATION ERROR: NEXT_PUBLIC_MEDIA_BASE_URL environment variable is required.');
    }
    return url;
  },

  get APP_VERSION(): string { return process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'; },
  get ENABLE_DEBUG_MODE(): boolean { return process.env.NEXT_PUBLIC_ENABLE_DEBUG_MODE === 'true' || IS_DEVELOPMENT; },

  isSecure: IS_PRODUCTION,
  isDevelopment: IS_DEVELOPMENT,
} as const;