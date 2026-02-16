export const IS_PRODUCTION = process.env.NODE_ENV === 'production';
export const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';
export const IS_TEST = process.env.NODE_ENV === 'test';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
const MEDIA_BASE_URL = process.env.NEXT_PUBLIC_MEDIA_BASE_URL?.trim();

const assertEnvValue = (key: string, value: string | undefined): string => {
  if (!value) {
    if (IS_PRODUCTION) {
      throw new Error(`🚨 CONFIGURATION ERROR: ${key} environment variable is required in production.`);
    }

    throw new Error(`🚨 DEVELOPMENT ERROR: ${key} environment variable is required. Please set it in .env.local`);
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

  get APP_VERSION(): string { return process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'; },
  get ENABLE_DEBUG_MODE(): boolean { return process.env.NEXT_PUBLIC_ENABLE_DEBUG_MODE === 'true' || IS_DEVELOPMENT; },

  isSecure: IS_PRODUCTION,
  isDevelopment: IS_DEVELOPMENT,
} as const;