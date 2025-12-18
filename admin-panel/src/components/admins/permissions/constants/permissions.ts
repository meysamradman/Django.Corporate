/**
 * Permission Constants
 * Single source of truth for all permission IDs
 * استفاده: import { PERMISSIONS } from '@/core/permissions/constants'
 */

export const PERMISSIONS = {
  // ==================== AI ====================
  AI: {
    MANAGE: 'ai.manage',
    CHAT_MANAGE: 'ai.chat.manage',
    CONTENT_MANAGE: 'ai.content.manage',
    IMAGE_MANAGE: 'ai.image.manage',
    AUDIO_MANAGE: 'ai.audio.manage',
    SETTINGS_SHARED_MANAGE: 'ai.settings.shared.manage',
    SETTINGS_PERSONAL_MANAGE: 'ai.settings.personal.manage',
  },
  
  // ==================== Blog ====================
  BLOG: {
    CREATE: 'blog.create',
    READ: 'blog.read',
    UPDATE: 'blog.update',
    DELETE: 'blog.delete',
    MANAGE: 'blog.manage',
  },
  
  BLOG_CATEGORIES: {
    CREATE: 'blog_categories.create',
    READ: 'blog_categories.read',
    UPDATE: 'blog_categories.update',
    DELETE: 'blog_categories.delete',
  },
  
  BLOG_TAGS: {
    CREATE: 'blog_tags.create',
    READ: 'blog_tags.read',
    UPDATE: 'blog_tags.update',
    DELETE: 'blog_tags.delete',
  },
  
  // ==================== Portfolio ====================
  PORTFOLIO: {
    CREATE: 'portfolio.create',
    READ: 'portfolio.read',
    UPDATE: 'portfolio.update',
    DELETE: 'portfolio.delete',
    MANAGE: 'portfolio.manage',
  },
  
  PORTFOLIO_CATEGORIES: {
    CREATE: 'portfolio_categories.create',
    READ: 'portfolio_categories.read',
    UPDATE: 'portfolio_categories.update',
    DELETE: 'portfolio_categories.delete',
  },
  
  PORTFOLIO_TAGS: {
    CREATE: 'portfolio_tags.create',
    READ: 'portfolio_tags.read',
    UPDATE: 'portfolio_tags.update',
    DELETE: 'portfolio_tags.delete',
  },
  
  PORTFOLIO_OPTIONS: {
    CREATE: 'portfolio_options.create',
    READ: 'portfolio_options.read',
    UPDATE: 'portfolio_options.update',
    DELETE: 'portfolio_options.delete',
  },
  
  // ==================== Media ====================
  MEDIA: {
    READ: 'media.read',
    UPLOAD: 'media.upload',
    CREATE: 'media.create',
    UPDATE: 'media.update',
    DELETE: 'media.delete',
    MANAGE: 'media.manage',
  },
  
  MEDIA_IMAGE: {
    UPLOAD: 'media.image.upload',
    UPDATE: 'media.image.update',
    DELETE: 'media.image.delete',
  },
  
  MEDIA_VIDEO: {
    UPLOAD: 'media.video.upload',
    UPDATE: 'media.video.update',
    DELETE: 'media.video.delete',
  },
  
  MEDIA_AUDIO: {
    UPLOAD: 'media.audio.upload',
    UPDATE: 'media.audio.update',
    DELETE: 'media.audio.delete',
  },
  
  MEDIA_DOCUMENT: {
    UPLOAD: 'media.document.upload',
    UPDATE: 'media.document.update',
    DELETE: 'media.document.delete',
  },
  
  // ==================== Admin ====================
  ADMIN: {
    CREATE: 'admin.create',
    READ: 'admin.read',
    UPDATE: 'admin.update',
    DELETE: 'admin.delete',
    MANAGE: 'admin.manage',
  },
  
  // ==================== Users ====================
  USERS: {
    CREATE: 'users.create',
    READ: 'users.read',
    UPDATE: 'users.update',
    DELETE: 'users.delete',
    MANAGE: 'users.manage',
  },
  
  // ==================== Analytics ====================
  ANALYTICS: {
    MANAGE: 'analytics.manage',
    STATS_MANAGE: 'analytics.stats.manage',
    USERS_READ: 'analytics.users.read',
    ADMINS_READ: 'analytics.admins.read',
    CONTENT_READ: 'analytics.content.read',
    TICKETS_READ: 'analytics.tickets.read',
    EMAILS_READ: 'analytics.emails.read',
    SYSTEM_READ: 'analytics.system.read',
  },
  
  // ==================== Email ====================
  EMAIL: {
    CREATE: 'email.create',
    READ: 'email.read',
    UPDATE: 'email.update',
    DELETE: 'email.delete',
    VIEW: 'email.view',
  },
  
  // ==================== Ticket ====================
  TICKET: {
    CREATE: 'ticket.create',
    READ: 'ticket.read',
    UPDATE: 'ticket.update',
    DELETE: 'ticket.delete',
    MANAGE: 'ticket.manage',
  },
  
  // ==================== Settings ====================
  SETTINGS: {
    MANAGE: 'settings.manage',
  },
  
  PANEL: {
    MANAGE: 'panel.manage',
    READ: 'panel.read',
  },
  
  FORMS: {
    MANAGE: 'forms.manage',
  },
  
  PAGES: {
    MANAGE: 'pages.manage',
  },
  
  CHATBOT: {
    MANAGE: 'chatbot.manage',
  },
  
  // ==================== Dashboard ====================
  DASHBOARD: {
    READ: 'dashboard.read',
  },
  
  // ==================== Profile ====================
  PROFILE: {
    READ: 'profile.read',
    UPDATE: 'profile.update',
  },
} as const;

// Type helper for autocomplete
export type PermissionId = 
  | typeof PERMISSIONS.AI[keyof typeof PERMISSIONS.AI]
  | typeof PERMISSIONS.BLOG[keyof typeof PERMISSIONS.BLOG]
  | typeof PERMISSIONS.PORTFOLIO[keyof typeof PERMISSIONS.PORTFOLIO]
  | typeof PERMISSIONS.MEDIA[keyof typeof PERMISSIONS.MEDIA]
  | typeof PERMISSIONS.ADMIN[keyof typeof PERMISSIONS.ADMIN]
  | typeof PERMISSIONS.USERS[keyof typeof PERMISSIONS.USERS]
  | typeof PERMISSIONS.ANALYTICS[keyof typeof PERMISSIONS.ANALYTICS]
  | typeof PERMISSIONS.EMAIL[keyof typeof PERMISSIONS.EMAIL]
  | typeof PERMISSIONS.TICKET[keyof typeof PERMISSIONS.TICKET]
  | typeof PERMISSIONS.SETTINGS[keyof typeof PERMISSIONS.SETTINGS]
  | typeof PERMISSIONS.PANEL[keyof typeof PERMISSIONS.PANEL]
  | typeof PERMISSIONS.FORMS[keyof typeof PERMISSIONS.FORMS]
  | typeof PERMISSIONS.PAGES[keyof typeof PERMISSIONS.PAGES]
  | typeof PERMISSIONS.CHATBOT[keyof typeof PERMISSIONS.CHATBOT]
  | typeof PERMISSIONS.DASHBOARD[keyof typeof PERMISSIONS.DASHBOARD]
  | typeof PERMISSIONS.PROFILE[keyof typeof PERMISSIONS.PROFILE];

/**
 * Helper function to get all permissions as array
 */
export function getAllPermissions(): string[] {
  const permissions: string[] = [];
  
  Object.values(PERMISSIONS).forEach(module => {
    Object.values(module).forEach(permission => {
      if (typeof permission === 'string') {
        permissions.push(permission);
      }
    });
  });
  
  return permissions;
}

/**
 * Helper function to check if a permission ID is valid
 */
export function isValidPermission(permissionId: string): boolean {
  return getAllPermissions().includes(permissionId);
}
