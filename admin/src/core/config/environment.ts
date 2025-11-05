export const IS_PRODUCTION = process.env.NODE_ENV === 'production';
export const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';
export const IS_TEST = process.env.NODE_ENV === 'test';

const getSecureInt = (envVar: string, varName: string): number => {
  const value = process.env[envVar];
  
  if (!value) {
    if (IS_PRODUCTION) {
      throw new Error(`🚨 SECURITY ERROR: ${varName} (envVar: ${envVar}) not found in environment.`);
    }
    
    // Development fallback values
    const fallbackValues: Record<string, number> = {
      'NEXT_PUBLIC_MEDIA_IMAGE_SIZE_LIMIT': 5242880,      // 5MB
      'NEXT_PUBLIC_MEDIA_VIDEO_SIZE_LIMIT': 157286400,    // 150MB
      'NEXT_PUBLIC_MEDIA_AUDIO_SIZE_LIMIT': 20971520,     // 20MB
      'NEXT_PUBLIC_MEDIA_PDF_SIZE_LIMIT': 10485760,       // 10MB
      'NEXT_PUBLIC_UPLOAD_CHUNK_SIZE': 1048576,           // 1MB
      'NEXT_PUBLIC_UPLOAD_TIMEOUT': 300000,               // 5 minutes
      'NEXT_PUBLIC_MAX_PARALLEL_UPLOADS': 3,              // 3 parallel uploads
      'NEXT_PUBLIC_PORTFOLIO_EXPORT_PRINT_MAX_ITEMS': 2000,  // Max items for print
      'NEXT_PUBLIC_PORTFOLIO_EXPORT_MAX_ITEMS': 500,  // Max items for Excel/PDF export
      'NEXT_PUBLIC_PORTFOLIO_MEDIA_UPLOAD_MAX': 50,    // Max media files per upload
      'NEXT_PUBLIC_PORTFOLIO_MEDIA_LIST_LIMIT': 5,     // Max media items in list view
    };
    
    const fallback = fallbackValues[envVar];
    if (fallback !== undefined) {
      return fallback;
    }
    
    return 0; // Generic fallback
  }
  
  const parsed = parseInt(value, 10);
  
  if (isNaN(parsed) || parsed <= 0) {
    if (IS_PRODUCTION) {
      throw new Error(`🚨 SECURITY ERROR: ${varName} must be a positive integer, got: ${value}.`);
    }
    return 0; // Fallback for development
  }
  
  return parsed;
};

const getSecureExtensions = (envVar: string, varName: string): string[] => {
  const value = process.env[envVar];
  
  if (!value) {
    if (IS_PRODUCTION) {
      throw new Error(`🚨 SECURITY ERROR: ${varName} (envVar: ${envVar}) not found in environment.`);
    }
    
    // Development fallback values
    const fallbackValues: Record<string, string[]> = {
      'NEXT_PUBLIC_MEDIA_IMAGE_EXTENSIONS': ['jpg', 'jpeg', 'webp', 'png', 'svg', 'gif'],
      'NEXT_PUBLIC_MEDIA_VIDEO_EXTENSIONS': ['mp4', 'webm', 'mov'],
      'NEXT_PUBLIC_MEDIA_AUDIO_EXTENSIONS': ['mp3', 'ogg'],
      'NEXT_PUBLIC_MEDIA_PDF_EXTENSIONS': ['pdf'],
    };
    
    const fallback = fallbackValues[envVar];
    if (fallback !== undefined) {
      return fallback;
    }
    
    return []; // Generic fallback
  }
  
  const extensions = value.split(',').map(ext => ext.trim().toLowerCase());
  
  // Check for empty extensions
  if (extensions.length === 0 || extensions.some(ext => ext === '')) {
    if (IS_PRODUCTION) {
      throw new Error(`🚨 SECURITY ERROR: ${varName} contains empty extensions.`);
    }
    return [];
  }

  const validExtensionRegex = /^[a-z0-9]+$/;
  const invalidExtensions = extensions.filter(ext => !validExtensionRegex.test(ext));
  
  if (invalidExtensions.length > 0) {
    if (IS_PRODUCTION) {
      throw new Error(`🚨 SECURITY ERROR: ${varName} contains invalid extensions: ${invalidExtensions.join(', ')}.`);
    }
    return []; // Fallback
  }
  
  return extensions;
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
  
  // Portfolio Media Limits
  get PORTFOLIO_MEDIA_UPLOAD_MAX(): number { 
    return parseInt(process.env.NEXT_PUBLIC_PORTFOLIO_MEDIA_UPLOAD_MAX || '50', 10); 
  },
  get PORTFOLIO_MEDIA_LIST_LIMIT(): number { 
    return parseInt(process.env.NEXT_PUBLIC_PORTFOLIO_MEDIA_LIST_LIMIT || '5', 10); 
  },
  get APP_NAME(): string { return process.env.NEXT_PUBLIC_APP_NAME || 'Admin Panel'; },

  // Feature Flags (can be read directly)
  get ENABLE_ANALYTICS(): boolean { return process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true'; },
  get ENABLE_DEBUG_MODE(): boolean { return process.env.NEXT_PUBLIC_ENABLE_DEBUG_MODE === 'true' || IS_DEVELOPMENT; },

  // Media settings (accessed via getters for lazy evaluation and validation)
  get MEDIA_IMAGE_SIZE_LIMIT(): number { return getSecureInt('NEXT_PUBLIC_MEDIA_IMAGE_SIZE_LIMIT', 'MEDIA_IMAGE_SIZE_LIMIT'); },
  get MEDIA_VIDEO_SIZE_LIMIT(): number { return getSecureInt('NEXT_PUBLIC_MEDIA_VIDEO_SIZE_LIMIT', 'MEDIA_VIDEO_SIZE_LIMIT'); },
  get MEDIA_AUDIO_SIZE_LIMIT(): number { return getSecureInt('NEXT_PUBLIC_MEDIA_AUDIO_SIZE_LIMIT', 'MEDIA_AUDIO_SIZE_LIMIT'); },
  get MEDIA_PDF_SIZE_LIMIT(): number { return getSecureInt('NEXT_PUBLIC_MEDIA_PDF_SIZE_LIMIT', 'MEDIA_PDF_SIZE_LIMIT'); },

  get MEDIA_IMAGE_EXTENSIONS(): string[] { return getSecureExtensions('NEXT_PUBLIC_MEDIA_IMAGE_EXTENSIONS', 'MEDIA_IMAGE_EXTENSIONS'); },
  get MEDIA_VIDEO_EXTENSIONS(): string[] { return getSecureExtensions('NEXT_PUBLIC_MEDIA_VIDEO_EXTENSIONS', 'MEDIA_VIDEO_EXTENSIONS'); },
  get MEDIA_AUDIO_EXTENSIONS(): string[] { return getSecureExtensions('NEXT_PUBLIC_MEDIA_AUDIO_EXTENSIONS', 'MEDIA_VIDEO_EXTENSIONS'); },
  get MEDIA_PDF_EXTENSIONS(): string[] { return getSecureExtensions('NEXT_PUBLIC_MEDIA_PDF_EXTENSIONS', 'MEDIA_PDF_EXTENSIONS'); },

  get UPLOAD_CHUNK_SIZE(): number { return getSecureInt('NEXT_PUBLIC_UPLOAD_CHUNK_SIZE', 'UPLOAD_CHUNK_SIZE'); },
  get UPLOAD_TIMEOUT(): number { return getSecureInt('NEXT_PUBLIC_UPLOAD_TIMEOUT', 'UPLOAD_TIMEOUT'); },
  get MAX_PARALLEL_UPLOADS(): number { return getSecureInt('NEXT_PUBLIC_MAX_PARALLEL_UPLOADS', 'MAX_PARALLEL_UPLOADS'); },
  get SHOW_UPLOAD_PROGRESS(): boolean { return process.env.NEXT_PUBLIC_SHOW_UPLOAD_PROGRESS === 'true'; },
  
  // Portfolio Export Settings (only for print - export limits are handled by backend)
  get PORTFOLIO_EXPORT_PRINT_MAX_ITEMS(): number { return getSecureInt('NEXT_PUBLIC_PORTFOLIO_EXPORT_PRINT_MAX_ITEMS', 'PORTFOLIO_EXPORT_PRINT_MAX_ITEMS'); },

  // Security helpers
  isSecure: IS_PRODUCTION,
  isDevelopment: IS_DEVELOPMENT,
} as const;