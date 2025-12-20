const IS_DEV = import.meta.env.DEV;
const IS_PROD = import.meta.env.PROD;

const getEnvVar = (key: string, devDefault?: string): string => {
  const value = import.meta.env[key]?.trim();
  
  if (!value) {
    if (IS_PROD) {
      throw new Error(`🚨 CONFIGURATION ERROR: ${key} environment variable is required in production. Please set it in your .env file.`);
    }
    
    if (devDefault) {
      return devDefault;
    }
    
    throw new Error(`Environment variable ${key} is required`);
  }
  
  return value;
};

let cachedAPI_URL: string | null = null;
let cachedADMIN_SECRET: string | null = null;
let cachedMEDIA_BASE_URL: string | null = null;

export const env = {
  get API_URL(): string {
    if (cachedAPI_URL === null) {
      cachedAPI_URL = getEnvVar('VITE_API_URL', IS_DEV ? 'http://localhost:8000/api' : undefined);
    }
    return cachedAPI_URL;
  },

  get ADMIN_SECRET(): string {
    if (cachedADMIN_SECRET === null) {
      cachedADMIN_SECRET = getEnvVar('VITE_ADMIN_SECRET', IS_DEV ? 'x7K9mP2qL5nR8tY3vZ6wC4fH1jN0bM' : undefined);
    }
    return cachedADMIN_SECRET;
  },

  get MEDIA_BASE_URL(): string {
    if (cachedMEDIA_BASE_URL === null) {
      cachedMEDIA_BASE_URL = getEnvVar('VITE_MEDIA_BASE_URL', IS_DEV ? 'http://localhost:8000' : undefined);
    }
    return cachedMEDIA_BASE_URL;
  },

  get IS_DEV(): boolean {
    return IS_DEV;
  },

  get IS_PROD(): boolean {
    return IS_PROD;
  },
} as const;

