export const PERMISSION_TRANSLATIONS = {
  resources: {
    // ============================================
    // 🔵 CORE RESOURCES - همیشه لازم (نگه دارید)
    // ============================================
    'All Modules': 'تمام ماژول‌ها',
    'User Management': 'کاربران',
    'Admin Management': 'ادمین‌ها',
    'Media Management': 'رسانه',
    'Media Library': 'رسانه',
    'Analytics': 'تحلیل‌ها و گزارش‌گیری',
    'Analytics & Reports': 'تحلیل‌ها و گزارش‌گیری',
    'Panel Settings': 'تنظیمات پنل ادمین',
    'System Settings': 'تنظیمات سیستم',
    'Statistics Center': 'آمار',
    'User Profile': 'پروفایل کاربر',
    'Admin Roles': 'نقش‌های ادمین',
    'Settings': 'تنظیمات',
    'Permissions': 'دسترسی‌ها',
    'Roles': 'نقش‌ها',
    'Users': 'کاربران',
    'Admins': 'ادمین‌ها',
    'Media': 'رسانه',
    
    // ============================================
    // 🟠 CORPORATE RESOURCES - اختیاری (اگر ندارید حذف کنید)
    // ============================================
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
    'AI Tools': 'ابزارهای هوش مصنوعی',
    'Chatbot Management': 'مدیریت چت‌بات',
    'Ticket Management': 'مدیریت تیکت',
    'Email Center': 'ایمیل',
    'Forms Builder': 'سازنده فرم‌ها',
    'Pages Management': 'مدیریت صفحات',
    'Portfolio': 'نمونه کار',
    'Blog': 'وبلاگ',
  },

  roleNames: {
    // ============================================
    // 🔵 CORE ROLES - همیشه لازم (نگه دارید)
    // ============================================
    'super_admin': 'سوپر ادمین',
    'media_manager': 'مدیر رسانه',
    'settings_manager': 'مدیر تنظیمات سیستم',
    'panel_manager': 'مدیر تنظیمات پنل',
    'statistics_viewer': 'مشاهده‌گر آمار',
    'user_manager': 'مدیر کاربران',
    
    // ============================================
    // 🟠 CORPORATE ROLES - اختیاری (اگر ندارید حذف کنید)
    // ============================================
    'content_manager': 'مدیر محتوا',
    'blog_manager': 'مدیر وبلاگ',
    'portfolio_manager': 'مدیر نمونه‌کار',
    'forms_manager': 'مدیر فرم‌ها',
    'pages_manager': 'مدیر صفحات',
    'email_manager': 'مدیر ایمیل',
    'ticket_manager': 'مدیر تیکت',
    'chatbot_manager': 'مدیر چت‌بات',
    'ai_manager': 'مدیر AI',
  },

  roleDescriptions: {
    // ============================================
    // 🔵 CORE ROLE DESCRIPTIONS - همیشه لازم (نگه دارید)
    // ============================================
    'super_admin': 'دسترسی کامل به تمام سیستم. می‌تواند تمام کاربران، محتوا و تنظیمات سیستم را مدیریت کند.',
    'media_manager': 'مدیریت فایل‌های رسانه، آپلودها و سازماندهی فایل‌ها. محدود به توابع مرتبط با رسانه.',
    'settings_manager': 'مدیریت تنظیمات کل سیستم و پیکربندی‌های امنیتی.',
    'panel_manager': 'مدیریت ظاهر، برندینگ و تنظیمات رابط کاربری پنل ادمین.',
    'statistics_viewer': 'دسترسی فقط خواندنی به داشبورد آمار و گزارش‌ها.',
    'user_manager': 'مدیریت کاربران وب‌سایت. می‌تواند پروفایل‌ها را مشاهده و ویرایش کند اما دسترسی به ادمین‌ها ندارد.',
    
    // ============================================
    // 🟠 CORPORATE ROLE DESCRIPTIONS - اختیاری (اگر ندارید حذف کنید)
    // ============================================
    'content_manager': 'مدیریت کامل محتوای وبلاگ و نمونه‌کار شامل دسته‌بندی‌ها، برچسب‌ها و گزینه‌ها.',
    'blog_manager': 'مدیریت وبلاگ شامل پست‌ها، دسته‌بندی‌ها، برچسب‌ها و رسانه‌های مرتبط.',
    'portfolio_manager': 'مدیریت نمونه‌کار شامل پروژه‌ها، دسته‌بندی‌ها، برچسب‌ها و گزینه‌های اختصاصی.',
    'forms_manager': 'مدیریت فرم‌های تماس و فرم‌های سازنده همراه با فیلدها و اعتبارسنجی‌ها.',
    'pages_manager': 'مدیریت صفحات استاتیک مانند درباره ما، قوانین و صفحات لندینگ.',
    'email_manager': 'مدیریت صندوق ورودی، قالب‌ها و کمپین‌های ایمیل پنل ادمین.',
    'ticket_manager': 'مدیریت تیکت‌های پشتیبانی، پاسخ‌ها و درخواست‌های مشتریان.',
    'chatbot_manager': 'مدیریت تنظیمات چت‌بات، سوالات متداول و پاسخ‌های خودکار.',
    'ai_manager': 'مدیریت سرویس‌های هوش مصنوعی، پرامپت‌ها و تنظیمات مرتبط.',
  },

  cardDescriptions: {
    'statistics': 'دسترسی به آمارهای مختلف سیستم',
    'ai': 'دسترسی به امکانات هوش مصنوعی',
    'management': 'دسترسی مدیریت کلی به تنظیمات و ماژول‌های سیستم',
  },

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

  descriptions: {
    // ============================================
    // 🟠 CORPORATE DESCRIPTIONS - اختیاری (اگر ندارید حذف کنید)
    // ============================================
    'Manage Chatbot': 'مدیریت چت‌بات',
    'Allow full access to chatbot settings and FAQs': 'دسترسی کامل به تنظیمات چت‌بات و سوالات متداول',
    'Manage Tickets': 'مدیریت تیکت',
    'View Tickets': 'مشاهده تیکت‌ها',
    'Allow full access to ticket management and responses': 'دسترسی کامل به مدیریت تیکت‌ها و پاسخ‌ها',
    'View Email Messages': 'مشاهده پیام‌های ایمیل',
    'Manage Email': 'مدیریت ایمیل',
    'Manage Forms': 'مدیریت فرم‌ها',
    'View Portfolios': 'مشاهده نمونه کار',
    'View Portfolio': 'مشاهده نمونه کار',
    'View Blogs': 'مشاهده وبلاگ',
    'View Blog': 'مشاهده وبلاگ',
    'Can view portfolio items': 'امکان مشاهده آیتم‌های نمونه کار',
    'Can manage portfolio items': 'امکان مدیریت آیتم‌های نمونه کار',
    'Can create portfolio items': 'امکان ایجاد آیتم‌های نمونه کار',
    'Can edit portfolio items': 'امکان ویرایش آیتم‌های نمونه کار',
    'Can delete portfolio items': 'امکان حذف آیتم‌های نمونه کار',
    'AI Chat': 'چت هوشمند',
    'Access to AI chat and smart responses': 'دسترسی به چت هوشمند و پاسخ‌های خودکار',
    'AI Content Generation': 'تولید محتوا با AI',
    'Access to AI text and content generation': 'دسترسی به تولید متن و محتوا با هوش مصنوعی',
    'AI Image Generation': 'تولید تصویر با AI',
    'Access to AI image generation': 'دسترسی به تولید تصویر با هوش مصنوعی',
    'AI Audio Generation': 'تولید پادکست با AI',
    'Access to text-to-speech and audio generation with AI': 'دسترسی به تبدیل متن به گفتار و تولید پادکست با هوش مصنوعی',
    'Full AI Access': 'دسترسی کامل به AI',
    'Full access to all AI features (chat, content, image, audio)': 'دسترسی کامل به تمام امکانات هوش مصنوعی (چت، محتوا، تصویر، پادکست)',
    'Manage Personal API Key': 'مدیریت API شخصی',
    'Manage personal API Key for exclusive use': 'مدیریت کلید API شخصی برای استفاده اختصاصی',
    
    // ============================================
    // 🔵 CORE DESCRIPTIONS - همیشه لازم (نگه دارید)
    // ============================================
    'View Media Library': 'مشاهده رسانه',
    'View Media': 'مشاهده رسانه',
    'View Users': 'مشاهده کاربران',
    'View User': 'مشاهده کاربران',
    'View Dashboard Overview': 'مشاهده داشبورد کلی',
    'View basic dashboard statistics (safe, general info)': 'مشاهده آمار پایه داشبورد (اطلاعات عمومی و ایمن)',
    'View Users Statistics': 'مشاهده آمار کاربران',
    'View detailed user statistics (sensitive)': 'مشاهده آمار تفصیلی کاربران (حساس)',
    'View Admins Statistics': 'مشاهده آمار ادمین‌ها',
    'View admin user statistics (highly sensitive)': 'مشاهده آمار کاربران ادمین (بسیار حساس)',
    'View Content Statistics': 'مشاهده آمار محتوا',
    'View portfolio, blog, media statistics': 'مشاهده آمار نمونه کار، وبلاگ و رسانه',
    'View Tickets Statistics': 'مشاهده آمار تیکت‌ها',
    'View support tickets statistics and analytics': 'مشاهده آمار تیکت‌های پشتیبانی و تحلیل‌ها',
    'View Emails Statistics': 'مشاهده آمار ایمیل‌ها',
    'View email messages statistics and analytics': 'مشاهده آمار پیام‌های ایمیل و تحلیل‌ها',
    'View System Statistics': 'مشاهده آمار سیستم',
    'View system-level statistics (server, performance, logs)': 'مشاهده آمار سطح سیستم (سرور، عملکرد، لاگ‌ها)',
    'Manage Statistics': 'دسترسی کامل به آمار',
    'Full access to all statistics features (view)': 'دسترسی کامل به تمام امکانات آمار (مشاهده)',
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
    'Can view admin roles': 'امکان مشاهده نقش‌های ادمین',
    'Can manage admin roles': 'امکان مدیریت نقش‌های ادمین',
    'Can create admin roles': 'امکان ایجاد نقش‌های ادمین',
    'Can edit admin roles': 'امکان ویرایش نقش‌های ادمین',
    'Can delete admin roles': 'امکان حذف نقش‌های ادمین',
    
    // عمومی
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
  
  roleErrors: {
    'Cannot delete role. It is assigned to {count} users.': 'نقش به {count} کاربر اختصاص دارد. ابتدا نقش را از کاربران جدا کنید.',
    'Cannot delete {count} roles that are assigned to users': 'نقش‌ها به کاربران اختصاص دارند. ابتدا نقش‌ها را از کاربران جدا کنید.',
    'System roles cannot be deleted': 'نقش‌های سیستمی قابل حذف نیستند.',
    'No role IDs provided': 'شناسه‌های نقش برای حذف ارائه نشده است.',
  },
  
  roleSuccess: {
    'Successfully deleted {deleted_count} admin roles': '{deleted_count} نقش با موفقیت حذف شدند.',
    'Role deleted successfully': 'نقش با موفقیت حذف شد.',
  }
} as const;

export function getPermissionTranslation(
  text: string, 
  type: 'resource' | 'action' | 'description' | 'role' | 'roleDescription' | 'roleError' | 'roleSuccess' = 'resource'
): string {
  if (!text) return text;
  
  const normalizedText = text.trim();
  const translations = PERMISSION_TRANSLATIONS;
  
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
      if (translations.roleErrors[normalizedText as keyof typeof translations.roleErrors]) {
        return translations.roleErrors[normalizedText as keyof typeof translations.roleErrors];
      }
      for (const [key, value] of Object.entries(translations.roleErrors)) {
        const escapedKey = key.replace(/{count}|{deleted_count}/g, '(\\d+)');
        const regex = new RegExp(escapedKey);
        const match = normalizedText.match(regex);
        
        if (match) {
          let result = value as string;
          if (match[1]) {
            result = result.replace(/{count}|{deleted_count}/g, match[1]);
          }
          return result;
        }
      }
      break;
    case 'roleSuccess':
      if (translations.roleSuccess[normalizedText as keyof typeof translations.roleSuccess]) {
        return translations.roleSuccess[normalizedText as keyof typeof translations.roleSuccess];
      }
      for (const [key, value] of Object.entries(translations.roleSuccess)) {
        const escapedKey = key.replace(/{deleted_count}/g, '(\\d+)');
        const regex = new RegExp(escapedKey);
        const match = normalizedText.match(regex);
        
        if (match) {
          let result = value as string;
          if (match[1]) {
            result = result.replace(/{deleted_count}/g, match[1]);
          }
          return result;
        }
      }
      break;
  }
  
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
  
  return text;
}