export interface FeatureFlagConfig {
  key: string;
  description: string;
}

export const FEATURE_FLAGS_CONFIG: FeatureFlagConfig[] = [
  { 
    key: "portfolio", 
    description: "مدیریت پورتفولیو و نمونه کارها"
  },
  { 
    key: "blog", 
    description: "سیستم بلاگ و مقالات"
  },
  { 
    key: "ai", 
    description: "قابلیت‌های هوش مصنوعی"
  },
  { 
    key: "chatbot", 
    description: "چت‌بات و پشتیبانی"
  },
  { 
    key: "ticket", 
    description: "سیستم تیکت و پشتیبانی"
  },
  { 
    key: "email", 
    description: "مدیریت ایمیل"
  },
  { 
    key: "page", 
    description: "صفحات استاتیک (درباره ما، قوانین)"
  },
  { 
    key: "form", 
    description: "سازنده فرم"
  },
  { 
    key: "real_estate", 
    description: "مدیریت املاک"
  },
];

export const MODULE_TO_FEATURE_FLAG: Record<string, string> = {
  blog: "blog",
  portfolio: "portfolio",
  real_estate: "real_estate",
  ai: "ai",
  chatbot: "chatbot",
  ticket: "ticket",
  email: "email",
  pages: "page",
  forms: "form",
};

export function getFeatureFlagConfig(key: string): FeatureFlagConfig | undefined {
  return FEATURE_FLAGS_CONFIG.find(config => config.key === key);
}
