/**
 * مدیریت مرکزی نقش‌ها و دسترسی‌ها - Role Management Configuration
 * 
 * این فایل مرکزی برای مدیریت:
 * 1. نقش‌های سیستم
 * 2. ترجمه نقش‌ها
 * 3. آیکن‌های نقش‌ها
 * 4. رنگ‌بندی نقش‌ها
 * 5. سطح‌بندی نقش‌ها
 */

export interface RoleConfig {
  name: string;
  display_name: string;
  display_name_short: string;
  description: string;
  icon: string;
  color: string;
  level: number;
  is_system_role: boolean;
}

export const SYSTEM_ROLES: Record<string, RoleConfig> = {
  super_admin: {
    name: 'super_admin',
    display_name: 'سوپر ادمین',
    display_name_short: 'سوپر ادمین',
    description: 'دسترسی کامل به تمام بخش‌های سیستم',
    icon: 'Crown',
    color: 'yellow',
    level: 1,
    is_system_role: true
  },
  content_manager: {
    name: 'content_manager',
    display_name: 'مدیر محتوا',
    display_name_short: 'مدیر محتوا',
    description: 'مدیریت جامع وبلاگ، نمونه‌کار و رسانه',
    icon: 'FileText',
    color: 'blue',
    level: 2,
    is_system_role: true
  },
  blog_manager: {
    name: 'blog_manager',
    display_name: 'مدیر وبلاگ',
    display_name_short: 'وبلاگ',
    description: 'مدیریت مقالات، دسته‌بندی‌ها و برچسب‌های وبلاگ',
    icon: 'Newspaper',
    color: 'green',
    level: 3,
    is_system_role: true
  },
  portfolio_manager: {
    name: 'portfolio_manager',
    display_name: 'مدیر نمونه‌کار',
    display_name_short: 'نمونه‌کار',
    description: 'مدیریت پروژه‌ها، دسته‌بندی‌ها و برچسب‌های نمونه‌کار',
    icon: 'Briefcase',
    color: 'purple',
    level: 3,
    is_system_role: true
  },
  media_manager: {
    name: 'media_manager',
    display_name: 'مدیر رسانه',
    display_name_short: 'رسانه',
    description: 'مدیریت فایل‌ها و کتابخانه رسانه',
    icon: 'Image',
    color: 'orange',
    level: 4,
    is_system_role: true
  },
  forms_manager: {
    name: 'forms_manager',
    display_name: 'مدیر فرم‌ها',
    display_name_short: 'فرم‌ها',
    description: 'مدیریت فرم‌های تماس و سفارشی',
    icon: 'FileSpreadsheet',
    color: 'blue',
    level: 4,
    is_system_role: true
  },
  pages_manager: {
    name: 'pages_manager',
    display_name: 'مدیر صفحات',
    display_name_short: 'صفحات',
    description: 'مدیریت صفحات استاتیک و لندینگ',
    icon: 'Layout',
    color: 'purple',
    level: 4,
    is_system_role: true
  },
  email_manager: {
    name: 'email_manager',
    display_name: 'مدیر ایمیل',
    display_name_short: 'ایمیل',
    description: 'مدیریت صندوق و کمپین‌های ایمیل',
    icon: 'Mail',
    color: 'orange',
    level: 5,
    is_system_role: true
  },
  ai_manager: {
    name: 'ai_manager',
    display_name: 'مدیر AI',
    display_name_short: 'AI',
    description: 'مدیریت ابزارها و سرویس‌های هوش مصنوعی',
    icon: 'Bot',
    color: 'green',
    level: 5,
    is_system_role: true
  },
  settings_manager: {
    name: 'settings_manager',
    display_name: 'مدیر تنظیمات سیستم',
    display_name_short: 'تنظیمات سیستم',
    description: 'مدیریت تنظیمات کل سیستم و یکپارچگی‌ها',
    icon: 'Settings',
    color: 'gray',
    level: 6,
    is_system_role: true
  },
  panel_manager: {
    name: 'panel_manager',
    display_name: 'مدیر تنظیمات پنل',
    display_name_short: 'تنظیمات پنل',
    description: 'مدیریت ظاهر و برندینگ پنل ادمین',
    icon: 'LayoutDashboard',
    color: 'blue',
    level: 6,
    is_system_role: true
  },
  statistics_viewer: {
    name: 'statistics_viewer',
    display_name: 'مشاهده‌گر آمار',
    display_name_short: 'آمار',
    description: 'دسترسی فقط خواندنی به آمار و داشبوردها',
    icon: 'BarChart3',
    color: 'green',
    level: 7,
    is_system_role: true
  },
  user_manager: {
    name: 'user_manager',
    display_name: 'مدیر کاربران',
    display_name_short: 'کاربران',
    description: 'مدیریت کاربران عادی سایت',
    icon: 'Users',
    color: 'gray',
    level: 7,
    is_system_role: true
  }
};

/**
 * دریافت تنظیمات نقش بر اساس نام
 */
export const getRoleConfig = (roleName: string): RoleConfig | null => {
  return SYSTEM_ROLES[roleName] || null;
};

/**
 * دریافت نام نمایشی نقش
 */
export const getRoleDisplayName = (roleName: string, short: boolean = false): string => {
  const config = getRoleConfig(roleName);
  if (!config) return roleName;
  
  return short ? config.display_name_short : config.display_name;
};

/**
 * دریافت آیکن نقش
 */
export const getRoleIcon = (roleName: string): string => {
  const config = getRoleConfig(roleName);
  return config?.icon || 'UserCheck';
};

/**
 * دریافت رنگ نقش
 */
export const getRoleColor = (roleName: string): string => {
  const config = getRoleConfig(roleName);
  return config?.color || 'gray';
};

/**
 * بررسی اینکه آیا کاربر سوپر ادمین است
 */
export const isSuperAdmin = (user: any): boolean => {
  return user?.is_super || 
         user?.is_superuser || 
         user?.roles?.some((role: any) => 
           role === 'super_admin' || role?.name === 'super_admin'
         );
};

/**
 * دریافت متن نمایشی برای نقش‌های کاربر
 */
export const getUserRoleDisplayText = (user: any): string => {
  if (!user) return 'بدون نقش';
  
  const roles = user.roles || [];
  
  if (roles.length === 0) return 'بدون نقش';
  
  // بررسی سوپر ادمین
  if (isSuperAdmin(user)) {
    return getRoleDisplayName('super_admin', true);
  }
  
  // برای ادمین‌های عادی، نقش اصلی را نمایش بده
  const mainRole = roles[0];
  const roleName = typeof mainRole === 'string' ? mainRole : mainRole?.name;
  
  if (roleName) {
    return getRoleDisplayName(roleName, true);
  }
  
  // اگر نتوانست نقش را تشخیص دهد، تعداد نقش‌ها را نمایش بده
  return `${roles.length} نقش`;
};

/**
 * دریافت تمام نقش‌های سیستم به ترتیب سطح
 */
export const getSystemRoles = (): RoleConfig[] => {
  return Object.values(SYSTEM_ROLES).sort((a, b) => a.level - b.level);
};

/**
 * دریافت نقش‌های قابل انتخاب برای کاربر بر اساس سطح دسترسی فعلی
 */
export const getAvailableRoles = (currentUserLevel: number = 10): RoleConfig[] => {
  return getSystemRoles().filter(role => role.level > currentUserLevel);
};

/**
 * رنگ‌های استاندارد برای نقش‌ها
 */
export const ROLE_COLORS = {
  yellow: {
    bg: 'bg-yellow',
    text: 'text-yellow-2',
    border: 'border-yellow-1'
  },
  blue: {
    bg: 'bg-blue',
    text: 'text-blue-2',
    border: 'border-blue-1'
  },
  green: {
    bg: 'bg-green',
    text: 'text-green-2',
    border: 'border-green-1'
  },
  purple: {
    bg: 'bg-purple',
    text: 'text-purple-2',
    border: 'border-purple-1'
  },
  orange: {
    bg: 'bg-orange',
    text: 'text-orange-2',
    border: 'border-orange-1'
  },
  gray: {
    bg: 'bg-gray',
    text: 'text-gray-2',
    border: 'border-gray-1'
  }
};

/**
 * دریافت کلاس‌های CSS برای رنگ نقش
 */
export const getRoleColorClasses = (roleName: string) => {
  const color = getRoleColor(roleName);
  return ROLE_COLORS[color as keyof typeof ROLE_COLORS] || ROLE_COLORS.gray;
};

