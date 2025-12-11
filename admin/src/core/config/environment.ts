export const IS_PRODUCTION = process.env.NODE_ENV === 'production';
export const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';
export const IS_TEST = process.env.NODE_ENV === 'test';

const getSecureInt = (envVar: string, varName: string): number => {
  const value = process.env[envVar];
  
  if (!value) {
    if (IS_PRODUCTION) {
      throw new Error(`🚨 SECURITY ERROR: ${varName} (envVar: ${envVar}) not found in environment.`);
    }
    
    const fallbackValues: Record<string, number> = {
      'NEXT_PUBLIC_PORTFOLIO_EXPORT_PRINT_MAX_ITEMS': 2000,
      'NEXT_PUBLIC_PORTFOLIO_EXPORT_MAX_ITEMS': 500,
    };
    
    const fallback = fallbackValues[envVar];
    if (fallback !== undefined) {
      return fallback;
    }
    
    return 0;
  }
  
  const parsed = parseInt(value, 10);
  
  if (isNaN(parsed) || parsed <= 0) {
    if (IS_PRODUCTION) {
      throw new Error(`🚨 SECURITY ERROR: ${varName} must be a positive integer, got: ${value}.`);
    }
    return 0;
  }
  
  return parsed;
};

export const env = {
  get API_BASE_URL(): string { 
    const url = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!url) {
      throw new Error('🚨 CONFIGURATION ERROR: NEXT_PUBLIC_API_BASE_URL environment variable is required. Please set it in your .env.local file.');
    }
    return url;
  },
  
  get MEDIA_BASE_URL(): string { 
    const url = process.env.NEXT_PUBLIC_MEDIA_BASE_URL;
    if (!url) {
      throw new Error('🚨 CONFIGURATION ERROR: NEXT_PUBLIC_MEDIA_BASE_URL environment variable is required. Please set it in your .env.local file.');
    }
    return url;
  },
  
  get APP_VERSION(): string { return process.env.NEXT_PUBLIC_APP_VERSION || '0.1.0'; },
  
  get PORTFOLIO_MEDIA_UPLOAD_MAX(): number { 
    return parseInt(process.env.NEXT_PUBLIC_PORTFOLIO_MEDIA_UPLOAD_MAX || '50', 10); 
  },
  get BLOG_MEDIA_UPLOAD_MAX(): number { 
    return parseInt(process.env.NEXT_PUBLIC_BLOG_MEDIA_UPLOAD_MAX || process.env.NEXT_PUBLIC_PORTFOLIO_MEDIA_UPLOAD_MAX || '50', 10); 
  },
  get PORTFOLIO_MEDIA_LIST_LIMIT(): number { 
    return parseInt(process.env.NEXT_PUBLIC_PORTFOLIO_MEDIA_LIST_LIMIT || '5', 10); 
  },
  get APP_NAME(): string { return process.env.NEXT_PUBLIC_APP_NAME || 'Admin Panel'; },

  get ENABLE_ANALYTICS(): boolean { return process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true'; },
  get ENABLE_DEBUG_MODE(): boolean { return process.env.NEXT_PUBLIC_ENABLE_DEBUG_MODE === 'true' || IS_DEVELOPMENT; },

  get PORTFOLIO_EXPORT_PRINT_MAX_ITEMS(): number { return getSecureInt('NEXT_PUBLIC_PORTFOLIO_EXPORT_PRINT_MAX_ITEMS', 'PORTFOLIO_EXPORT_PRINT_MAX_ITEMS'); },
  get BLOG_EXPORT_PRINT_MAX_ITEMS(): number { 
    const blogValue = process.env.NEXT_PUBLIC_BLOG_EXPORT_PRINT_MAX_ITEMS;
    if (blogValue) {
      return getSecureInt('NEXT_PUBLIC_BLOG_EXPORT_PRINT_MAX_ITEMS', 'BLOG_EXPORT_PRINT_MAX_ITEMS');
    }
    return getSecureInt('NEXT_PUBLIC_PORTFOLIO_EXPORT_PRINT_MAX_ITEMS', 'PORTFOLIO_EXPORT_PRINT_MAX_ITEMS');
  },

  isSecure: IS_PRODUCTION,
  isDevelopment: IS_DEVELOPMENT,
} as const;