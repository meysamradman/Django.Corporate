export const IS_PRODUCTION = process.env.NODE_ENV === 'production';
export const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';
export const IS_TEST = process.env.NODE_ENV === 'test';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
const MEDIA_BASE_URL = process.env.NEXT_PUBLIC_MEDIA_BASE_URL?.trim();
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.trim();
const API_INTERNAL_ORIGIN = process.env.API_INTERNAL_ORIGIN?.trim();

const assertEnvValue = (key: string, value: string | undefined): string => {
  if (!value) {
    throw new Error(`🚨 CONFIGURATION ERROR: ${key} environment variable is required.`);
  }

  return value.replace(/\/$/, '');
};

export const env = {
  get API_BASE_URL(): string {
    return assertEnvValue('NEXT_PUBLIC_API_BASE_URL', API_BASE_URL);
  },

  get MEDIA_BASE_URL(): string {
    return assertEnvValue('NEXT_PUBLIC_MEDIA_BASE_URL', MEDIA_BASE_URL);
  },

  get SITE_URL(): string {
    return SITE_URL || '';
  },

  get API_INTERNAL_ORIGIN(): string {
    return assertEnvValue('API_INTERNAL_ORIGIN', API_INTERNAL_ORIGIN);
  },

  get APP_VERSION(): string { return process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'; },
  get ENABLE_DEBUG_MODE(): boolean { return process.env.NEXT_PUBLIC_ENABLE_DEBUG_MODE === 'true' || IS_DEVELOPMENT; },

  isSecure: IS_PRODUCTION,
  isDevelopment: IS_DEVELOPMENT,
} as const;