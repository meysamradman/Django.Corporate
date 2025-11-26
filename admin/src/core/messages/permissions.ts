// Permission translations for the admin panel
// This file contains all Persian translations for permission-related terms

export const PERMISSION_TRANSLATIONS = {
  // Resource translations
  resources: {
    'All Modules': 'تمام ماژول‌ها',
    'User Management': 'کاربران',
    'Admin Management': 'ادمین‌ها',
    'Media Management': 'رسانه',
    'Media Library': 'رسانه',
    'Portfolio Management': 'نمونه کار',
    'Blog Management': 'وبلاگ',
    'Content Taxonomies': 'دسته‌بندی، برچسب و گزینه‌های وبلاگ/نمونه‌کار',
    'Category Management': 'دسته‌بندی، برچسب و گزینه‌های وبلاگ/نمونه‌کار',
    'Blog Categories': 'دسته‌بندی‌های وبلاگ',
    'Blog Tags': 'برچسب‌های وبلاگ',
    'Portfolio Categories': 'دسته‌بندی‌های نمونه‌کار',
    'Portfolio Tags': 'برچسب‌های نمونه‌کار',
    'Portfolio Options': 'گزینه‌های نمونه‌کار',
    'Portfolio Option Values': 'مقادیر گزینه‌های نمونه‌کار',
    'Analytics': 'تحلیل‌ها و گزارش‌گیری',
    'Analytics & Reports': 'تحلیل‌ها و گزارش‌گیری',
    'Panel Settings': 'تنظیمات پنل ادمین',
    'System Settings': 'تنظیمات سیستم',
    'AI Tools': 'ابزارهای هوش مصنوعی',
    'Chatbot Management': 'مدیریت چت‌بات',
    'Ticket Management': 'مدیریت تیکت',
    'Email Center': 'ایمیل',
    'Forms Builder': 'سازنده فرم‌ها',
    'Pages Management': 'مدیریت صفحات',
    'Statistics Center': 'آمار',
    'User Profile': 'پروفایل کاربر',
    'Admin Roles': 'نقش‌های ادمین',
    'Settings': 'تنظیمات',
    'Permissions': 'دسترسی‌ها',
    'Roles': 'نقش‌ها',
    'Users': 'کاربران',
    'Admins': 'ادمین‌ها',
    'Media': 'رسانه',
    'Portfolio': 'نمونه کار',
    'Blog': 'وبلاگ',
  },

  // Role name translations
  roleNames: {
    'super_admin': 'سوپر ادمین',
    'content_manager': 'مدیر محتوا',
    'blog_manager': 'مدیر وبلاگ',
    'portfolio_manager': 'مدیر نمونه‌کار',
    'media_manager': 'مدیر رسانه',
    'forms_manager': 'مدیر فرم‌ها',
    'pages_manager': 'مدیر صفحات',
    'email_manager': 'مدیر ایمیل',
    'ticket_manager': 'مدیر تیکت',
    'chatbot_manager': 'مدیر چت‌بات',
    'ai_manager': 'مدیر AI',
    'settings_manager': 'مدیر تنظیمات سیستم',
    'panel_manager': 'مدیر تنظیمات پنل',
    'statistics_viewer': 'مشاهده‌گر آمار',
    'user_manager': 'مدیر کاربران',
  },

  // Role descriptions
  roleDescriptions: {
    'super_admin': 'دسترسی کامل به تمام سیستم. می‌تواند تمام کاربران، محتوا و تنظیمات سیستم را مدیریت کند.',
    'content_manager': 'مدیریت کامل محتوای وبلاگ و نمونه‌کار شامل دسته‌بندی‌ها، برچسب‌ها و گزینه‌ها.',
    'blog_manager': 'مدیریت وبلاگ شامل پست‌ها، دسته‌بندی‌ها، برچسب‌ها و رسانه‌های مرتبط.',
    'portfolio_manager': 'مدیریت نمونه‌کار شامل پروژه‌ها، دسته‌بندی‌ها، برچسب‌ها و گزینه‌های اختصاصی.',
    'media_manager': 'مدیریت فایل‌های رسانه، آپلودها و سازماندهی فایل‌ها. محدود به توابع مرتبط با رسانه.',
    'forms_manager': 'مدیریت فرم‌های تماس و فرم‌های سازنده همراه با فیلدها و اعتبارسنجی‌ها.',
    'pages_manager': 'مدیریت صفحات استاتیک مانند درباره ما، قوانین و صفحات لندینگ.',
    'email_manager': 'مدیریت صندوق ورودی، قالب‌ها و کمپین‌های ایمیل پنل ادمین.',
    'ticket_manager': 'مدیریت تیکت‌های پشتیبانی، پاسخ‌ها و درخواست‌های مشتریان.',
    'chatbot_manager': 'مدیریت تنظیمات چت‌بات، سوالات متداول و پاسخ‌های خودکار.',
    'ai_manager': 'مدیریت سرویس‌های هوش مصنوعی، پرامپت‌ها و تنظیمات مرتبط.',
    'settings_manager': 'مدیریت تنظیمات کل سیستم و پیکربندی‌های امنیتی.',
    'panel_manager': 'مدیریت ظاهر، برندینگ و تنظیمات رابط کاربری پنل ادمین.',
    'statistics_viewer': 'دسترسی فقط خواندنی به داشبورد آمار و گزارش‌ها.',
    'user_manager': 'مدیریت کاربران وب‌سایت. می‌تواند پروفایل‌ها را مشاهده و ویرایش کند اما دسترسی به ادمین‌ها ندارد.',
  },

  // Card descriptions for role creation/edit pages
  cardDescriptions: {
    'statistics': 'دسترسی به آمارهای مختلف سیستم',
    'ai': 'دسترسی به امکانات هوش مصنوعی',
    'management': 'دسترسی مدیریت کلی به تنظیمات و ماژول‌های سیستم',
  },

  // Action translations
  actions: {
    'view': 'مشاهده',
    'list': 'لیست',
    'create': 'ایجاد',
    'edit': 'ویرایش',
    'delete': 'حذف',
    'manage': 'مدیریت',
    'read': 'خواندن',
    'write': 'نوشتن',
    'update': 'بروزرسانی',
    'get': 'دریافت',
    'post': 'ارسال',
    'put': 'ویرایش',
    'patch': 'به‌روزرسانی',
    'export': 'خروجی',
  },

  // Description translations
  descriptions: {
    // Chatbot permissions
    'Manage Chatbot': 'مدیریت چت‌بات',
    'Allow full access to chatbot settings and FAQs': 'دسترسی کامل به تنظیمات چت‌بات و سوالات متداول',
    // Ticket permissions
    'Manage Tickets': 'مدیریت تیکت',
    'Allow full access to ticket management and responses': 'دسترسی کامل به مدیریت تیکت‌ها و پاسخ‌ها',
    // Statistics permissions
    'View Dashboard Overview': 'مشاهده داشبورد کلی',
    'View Users Statistics': 'مشاهده آمار کاربران',
    'View Admins Statistics': 'مشاهده آمار ادمین‌ها',
    'View Content Statistics': 'مشاهده آمار محتوا',
    'View Financial Statistics': 'مشاهده آمار مالی',
    'Export Statistics': 'خروجی آمار',
    'Manage Statistics': 'دسترسی کامل به آمار',
    // AI permissions
    'AI Chat': 'چت هوشمند',
    'Access to AI chat and smart responses': 'دسترسی به چت هوشمند و پاسخ‌های خودکار',
    'AI Content Generation': 'تولید محتوا با AI',
    'Access to AI text and content generation': 'دسترسی به تولید متن و محتوا با هوش مصنوعی',
    'AI Image Generation': 'تولید تصویر با AI',
    'Access to AI image generation': 'دسترسی به تولید تصویر با هوش مصنوعی',
    'Full AI Access': 'دسترسی کامل به AI',
    'Full access to all AI features (chat, content, image)': 'دسترسی کامل به تمام امکانات هوش مصنوعی (چت، محتوا، تصویر)',
    'Manage Personal API Key': 'مدیریت API شخصی',
    'Manage personal API Key for exclusive use': 'مدیریت کلید API شخصی برای استفاده اختصاصی',
    // Complete phrases
    'Can view admin users': 'امکان مشاهده کاربران ادمین',
    'Can manage admin users': 'امکان مدیریت کاربران ادمین',
    'Can create admin users': 'امکان ایجاد کاربران ادمین',
    'Can edit admin users': 'امکان ویرایش کاربران ادمین',
    'Can delete admin users': 'امکان حذف کاربران ادمین',
    'Can view user profiles': 'امکان مشاهده پروفایل‌های کاربران',
    'Can manage user profiles': 'امکان مدیریت پروفایل‌های کاربران',
    'Can create user profiles': 'امکان ایجاد پروفایل‌های کاربران',
    'Can edit user profiles': 'امکان ویرایش پروفایل‌های کاربران',
    'Can delete user profiles': 'امکان حذف پروفایل‌های کاربران',
    'Can view media files': 'امکان مشاهده فایل‌های رسانه',
    'Can manage media files': 'امکان مدیریت فایل‌های رسانه',
    'Can create media files': 'امکان ایجاد فایل‌های رسانه',
    'Can edit media files': 'امکان ویرایش فایل‌های رسانه',
    'Can delete media files': 'امکان حذف فایل‌های رسانه',
    'Can view portfolio items': 'امکان مشاهده آیتم‌های نمونه کار',
    'Can manage portfolio items': 'امکان مدیریت آیتم‌های نمونه کار',
    'Can create portfolio items': 'امکان ایجاد آیتم‌های نمونه کار',
    'Can edit portfolio items': 'امکان ویرایش آیتم‌های نمونه کار',
    'Can delete portfolio items': 'امکان حذف آیتم‌های نمونه کار',
    'Can view admin roles': 'امکان مشاهده نقش‌های ادمین',
    'Can manage admin roles': 'امکان مدیریت نقش‌های ادمین',
    'Can create admin roles': 'امکان ایجاد نقش‌های ادمین',
    'Can edit admin roles': 'امکان ویرایش نقش‌های ادمین',
    'Can delete admin roles': 'امکان حذف نقش‌های ادمین',
    
    // Keywords
    'Can view': 'امکان مشاهده',
    'Can list': 'امکان لیست کردن',
    'Can create': 'امکان ایجاد',
    'Can edit': 'امکان ویرایش',
    'Can delete': 'امکان حذف',
    'Can manage': 'امکان مدیریت',
    'Can read': 'امکان خواندن',
    'Can write': 'امکان نوشتن',
    'Can update': 'امکان بروزرسانی',
    'Can get': 'امکان دریافت',
    'Can post': 'امکان ارسال',
    'Can put': 'امکان ویرایش',
    'Can patch': 'امکان به‌روزرسانی',
    'Can export': 'امکان خروجی گرفتن',
    'admin users': 'کاربران ادمین',
    'user profiles': 'پروفایل‌های کاربران',
    'media files': 'فایل‌های رسانه',
    'portfolio items': 'آیتم‌های نمونه کار',
    'admin roles': 'نقش‌های ادمین',
  },
  
  // Role error messages
  roleErrors: {
    'Cannot delete role. It is assigned to {count} users.': 'نقش به {count} کاربر اختصاص دارد. ابتدا نقش را از کاربران جدا کنید.',
    'Cannot delete {count} roles that are assigned to users': 'نقش‌ها به کاربران اختصاص دارند. ابتدا نقش‌ها را از کاربران جدا کنید.',
    'System roles cannot be deleted': 'نقش‌های سیستمی قابل حذف نیستند.',
    'No role IDs provided': 'شناسه‌های نقش برای حذف ارائه نشده است.',
  },
  
  // Role success messages
  roleSuccess: {
    'Successfully deleted {deleted_count} admin roles': '{deleted_count} نقش با موفقیت حذف شدند.',
    'Role deleted successfully': 'نقش با موفقیت حذف شد.',
  }
} as const;

// Helper function to get translation
export function getPermissionTranslation(
  text: string, 
  type: 'resource' | 'action' | 'description' | 'role' | 'roleDescription' | 'roleError' | 'roleSuccess' = 'resource'
): string {
  if (!text) return text;
  
  const normalizedText = text.trim();
  const translations = PERMISSION_TRANSLATIONS;
  
  // Try exact match based on type
  switch (type) {
    case 'resource':
      if (translations.resources[normalizedText as keyof typeof translations.resources]) {
        return translations.resources[normalizedText as keyof typeof translations.resources];
      }
      break;
    case 'action':
      if (translations.actions[normalizedText as keyof typeof translations.actions]) {
        return translations.actions[normalizedText as keyof typeof translations.actions];
      }
      break;
    case 'description':
      if (translations.descriptions[normalizedText as keyof typeof translations.descriptions]) {
        return translations.descriptions[normalizedText as keyof typeof translations.descriptions];
      }
      break;
    case 'role':
      if (translations.roleNames[normalizedText as keyof typeof translations.roleNames]) {
        return translations.roleNames[normalizedText as keyof typeof translations.roleNames];
      }
      break;
    case 'roleDescription':
      if (translations.roleDescriptions[normalizedText as keyof typeof translations.roleDescriptions]) {
        return translations.roleDescriptions[normalizedText as keyof typeof translations.roleDescriptions];
      }
      break;
    case 'roleError':
      // Check for exact match first
      if (translations.roleErrors[normalizedText as keyof typeof translations.roleErrors]) {
        return translations.roleErrors[normalizedText as keyof typeof translations.roleErrors];
      }
      // Check for partial match with parameter replacement
      for (const [key, value] of Object.entries(translations.roleErrors)) {
        // Create regex pattern to match the key with numbers
        const escapedKey = key.replace(/{count}|{deleted_count}/g, '(\\d+)');
        const regex = new RegExp(escapedKey);
        const match = normalizedText.match(regex);
        
        if (match) {
          // Replace parameters in the message
          let result = value as string;
          if (match[1]) {
            result = result.replace(/{count}|{deleted_count}/g, match[1]);
          }
          return result;
        }
      }
      break;
    case 'roleSuccess':
      // Check for exact match first
      if (translations.roleSuccess[normalizedText as keyof typeof translations.roleSuccess]) {
        return translations.roleSuccess[normalizedText as keyof typeof translations.roleSuccess];
      }
      // Check for partial match with parameter replacement
      for (const [key, value] of Object.entries(translations.roleSuccess)) {
        // Create regex pattern to match the key with numbers
        const escapedKey = key.replace(/{deleted_count}/g, '(\\d+)');
        const regex = new RegExp(escapedKey);
        const match = normalizedText.match(regex);
        
        if (match) {
          // Replace parameters in the message
          let result = value as string;
          if (match[1]) {
            result = result.replace(/{deleted_count}/g, match[1]);
          }
          return result;
        }
      }
      break;
  }
  
  // Try case insensitive match
  const lowerText = normalizedText.toLowerCase();
  
  switch (type) {
    case 'resource':
      for (const [key, value] of Object.entries(translations.resources)) {
        if (key.toLowerCase() === lowerText) {
          return value;
        }
      }
      break;
    case 'action':
      for (const [key, value] of Object.entries(translations.actions)) {
        if (key.toLowerCase() === lowerText) {
          return value;
        }
      }
      break;
    case 'description':
      for (const [key, value] of Object.entries(translations.descriptions)) {
        if (key.toLowerCase() === lowerText) {
          return value;
        }
      }
      break;
    case 'role':
      for (const [key, value] of Object.entries(translations.roleNames)) {
        if (key.toLowerCase() === lowerText) {
          return value;
        }
      }
      break;
    case 'roleDescription':
      for (const [key, value] of Object.entries(translations.roleDescriptions)) {
        if (key.toLowerCase() === lowerText) {
          return value;
        }
      }
      break;
  }
  
  // Try partial matching for longer texts
  if (normalizedText.length > 5) {
    switch (type) {
      case 'resource':
        for (const [key, value] of Object.entries(translations.resources)) {
          if (normalizedText.includes(key) || key.includes(normalizedText)) {
            return normalizedText.replace(new RegExp(key, 'gi'), value);
          }
        }
        break;
      case 'action':
        for (const [key, value] of Object.entries(translations.actions)) {
          if (normalizedText.includes(key) || key.includes(normalizedText)) {
            return normalizedText.replace(new RegExp(key, 'gi'), value);
          }
        }
        break;
      case 'description':
        for (const [key, value] of Object.entries(translations.descriptions)) {
          if (normalizedText.includes(key) || key.includes(normalizedText)) {
            return normalizedText.replace(new RegExp(key, 'gi'), value);
          }
        }
        break;
      case 'role':
        for (const [key, value] of Object.entries(translations.roleNames)) {
          if (normalizedText.includes(key) || key.includes(normalizedText)) {
            return normalizedText.replace(new RegExp(key, 'gi'), value);
          }
        }
        break;
      case 'roleDescription':
        for (const [key, value] of Object.entries(translations.roleDescriptions)) {
          if (normalizedText.includes(key) || key.includes(normalizedText)) {
            return normalizedText.replace(new RegExp(key, 'gi'), value);
          }
        }
        break;
    }
  }
  
  // Return original text if no translation found
  return text;
}