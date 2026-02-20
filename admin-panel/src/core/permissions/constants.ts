export const PERMISSIONS = {
  AI: {
    MANAGE: 'ai.manage',
    MODELS_MANAGE: 'ai.models.manage',
    CHAT_MANAGE: 'ai.chat.manage',
    CONTENT_MANAGE: 'ai.content.manage',
    IMAGE_MANAGE: 'ai.image.manage',
    AUDIO_MANAGE: 'ai.audio.manage',
    SETTINGS_SHARED_MANAGE: 'ai.settings.shared.manage',
    SETTINGS_PERSONAL_MANAGE: 'ai.settings.personal.manage',
  },
  
  BLOG: {
    CREATE: 'blog.create',
    READ: 'blog.read',
    UPDATE: 'blog.update',
    DELETE: 'blog.delete',
    MANAGE: 'blog.manage',
  },
  
  BLOG_CATEGORIES: {
    CREATE: 'blog.category.create',
    READ: 'blog.category.read',
    UPDATE: 'blog.category.update',
    DELETE: 'blog.category.delete',
  },
  
  BLOG_TAGS: {
    CREATE: 'blog.tag.create',
    READ: 'blog.tag.read',
    UPDATE: 'blog.tag.update',
    DELETE: 'blog.tag.delete',
  },

  PORTFOLIO: {
    CREATE: 'portfolio.create',
    READ: 'portfolio.read',
    UPDATE: 'portfolio.update',
    DELETE: 'portfolio.delete',
    MANAGE: 'portfolio.manage',
  },
  
  PORTFOLIO_CATEGORIES: {
    CREATE: 'portfolio.category.create',
    READ: 'portfolio.category.read',
    UPDATE: 'portfolio.category.update',
    DELETE: 'portfolio.category.delete',
  },
  
  PORTFOLIO_TAGS: {
    CREATE: 'portfolio.tag.create',
    READ: 'portfolio.tag.read',
    UPDATE: 'portfolio.tag.update',
    DELETE: 'portfolio.tag.delete',
  },
  
  PORTFOLIO_OPTIONS: {
    CREATE: 'portfolio.option.create',
    READ: 'portfolio.option.read',
    UPDATE: 'portfolio.option.update',
    DELETE: 'portfolio.option.delete',
  },

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

  ADMIN: {
    CREATE: 'admin.create',
    READ: 'admin.read',
    UPDATE: 'admin.update',
    DELETE: 'admin.delete',
    MANAGE: 'admin.manage',
  },

  USERS: {
    CREATE: 'users.create',
    READ: 'users.read',
    UPDATE: 'users.update',
    DELETE: 'users.delete',
    MANAGE: 'users.manage',
  },

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

  EMAIL: {
    CREATE: 'email.create',
    READ: 'email.read',
    UPDATE: 'email.update',
    DELETE: 'email.delete',
    VIEW: 'email.view',
    MANAGE: 'email.manage',
  },

  TICKET: {
    READ: 'ticket.read',
    UPDATE: 'ticket.update',
    DELETE: 'ticket.delete',
    MANAGE: 'ticket.manage',
  },

  SETTINGS: {
    MANAGE: 'settings.manage',
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

  DASHBOARD: {
    READ: 'dashboard.read',
  },

  PROFILE: {
    READ: 'profile.read',
    UPDATE: 'profile.update',
  },
  
  REAL_ESTATE: {
    PROPERTY_READ: 'real_estate.property.read',
    PROPERTY_CREATE: 'real_estate.property.create',
    PROPERTY_UPDATE: 'real_estate.property.update',
    PROPERTY_FINALIZE: 'real_estate.property.finalize',
    PROPERTY_DELETE: 'real_estate.property.delete',
    AGENT_READ: 'real_estate.agent.read',
    AGENT_CREATE: 'real_estate.agent.create',
    AGENT_UPDATE: 'real_estate.agent.update',
    AGENT_DELETE: 'real_estate.agent.delete',
    AGENCY_READ: 'real_estate.agency.read',
    AGENCY_CREATE: 'real_estate.agency.create',
    AGENCY_UPDATE: 'real_estate.agency.update',
    AGENCY_DELETE: 'real_estate.agency.delete',
    TYPE_READ: 'real_estate.type.read',
    TYPE_CREATE: 'real_estate.type.create',
    TYPE_UPDATE: 'real_estate.type.update',
    TYPE_DELETE: 'real_estate.type.delete',
    STATE_READ: 'real_estate.state.read',
    STATE_CREATE: 'real_estate.state.create',
    STATE_UPDATE: 'real_estate.state.update',
    STATE_DELETE: 'real_estate.state.delete',
    LOCATION_READ: 'real_estate.location.read',
    LOCATION_CREATE: 'real_estate.location.create',
    LOCATION_UPDATE: 'real_estate.location.update',
    LOCATION_DELETE: 'real_estate.location.delete',
    LABEL_READ: 'real_estate.label.read',
    LABEL_CREATE: 'real_estate.label.create',
    LABEL_UPDATE: 'real_estate.label.update',
    LABEL_DELETE: 'real_estate.label.delete',
    FEATURE_READ: 'real_estate.feature.read',
    FEATURE_CREATE: 'real_estate.feature.create',
    FEATURE_UPDATE: 'real_estate.feature.update',
    FEATURE_DELETE: 'real_estate.feature.delete',
    TAG_READ: 'real_estate.tag.read',
    TAG_CREATE: 'real_estate.tag.create',
    TAG_UPDATE: 'real_estate.tag.update',
    TAG_DELETE: 'real_estate.tag.delete',
  },
} as const;

export type PermissionId = 
  | typeof PERMISSIONS.AI[keyof typeof PERMISSIONS.AI]
  | typeof PERMISSIONS.BLOG[keyof typeof PERMISSIONS.BLOG]
  | typeof PERMISSIONS.BLOG_CATEGORIES[keyof typeof PERMISSIONS.BLOG_CATEGORIES]
  | typeof PERMISSIONS.BLOG_TAGS[keyof typeof PERMISSIONS.BLOG_TAGS]
  | typeof PERMISSIONS.PORTFOLIO[keyof typeof PERMISSIONS.PORTFOLIO]
  | typeof PERMISSIONS.PORTFOLIO_CATEGORIES[keyof typeof PERMISSIONS.PORTFOLIO_CATEGORIES]
  | typeof PERMISSIONS.PORTFOLIO_TAGS[keyof typeof PERMISSIONS.PORTFOLIO_TAGS]
  | typeof PERMISSIONS.PORTFOLIO_OPTIONS[keyof typeof PERMISSIONS.PORTFOLIO_OPTIONS]
  | typeof PERMISSIONS.MEDIA[keyof typeof PERMISSIONS.MEDIA]
  | typeof PERMISSIONS.MEDIA_IMAGE[keyof typeof PERMISSIONS.MEDIA_IMAGE]
  | typeof PERMISSIONS.MEDIA_VIDEO[keyof typeof PERMISSIONS.MEDIA_VIDEO]
  | typeof PERMISSIONS.MEDIA_AUDIO[keyof typeof PERMISSIONS.MEDIA_AUDIO]
  | typeof PERMISSIONS.MEDIA_DOCUMENT[keyof typeof PERMISSIONS.MEDIA_DOCUMENT]
  | typeof PERMISSIONS.ADMIN[keyof typeof PERMISSIONS.ADMIN]
  | typeof PERMISSIONS.USERS[keyof typeof PERMISSIONS.USERS]
  | typeof PERMISSIONS.ANALYTICS[keyof typeof PERMISSIONS.ANALYTICS]
  | typeof PERMISSIONS.EMAIL[keyof typeof PERMISSIONS.EMAIL]
  | typeof PERMISSIONS.TICKET[keyof typeof PERMISSIONS.TICKET]
  | typeof PERMISSIONS.SETTINGS[keyof typeof PERMISSIONS.SETTINGS]
  | typeof PERMISSIONS.FORMS[keyof typeof PERMISSIONS.FORMS]
  | typeof PERMISSIONS.PAGES[keyof typeof PERMISSIONS.PAGES]
  | typeof PERMISSIONS.CHATBOT[keyof typeof PERMISSIONS.CHATBOT]
  | typeof PERMISSIONS.DASHBOARD[keyof typeof PERMISSIONS.DASHBOARD]
  | typeof PERMISSIONS.PROFILE[keyof typeof PERMISSIONS.PROFILE]
  | typeof PERMISSIONS.REAL_ESTATE[keyof typeof PERMISSIONS.REAL_ESTATE];

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

export function isValidPermission(permissionId: string): boolean {
  return getAllPermissions().includes(permissionId);
}
