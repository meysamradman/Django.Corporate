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
    description: 'مدیریت محتوا، پرتفولیو، بلاگ و رسانه',
    icon: 'FileText',
    color: 'blue',
    level: 2,
    is_system_role: true
  },
  user_manager: {
    name: 'user_manager',
    display_name: 'مدیر کاربران',
    display_name_short: 'مدیر کاربران',
    description: 'مدیریت کاربران عادی و مشاهده آمار',
    icon: 'Users',
    color: 'green',
    level: 3,
    is_system_role: true
  },
  media_manager: {
    name: 'media_manager',
    display_name: 'مدیر رسانه',
    display_name_short: 'مدیر رسانه',
    description: 'مدیریت فایل‌ها و رسانه‌های سیستم',
    icon: 'Image',
    color: 'purple',
    level: 4,
    is_system_role: true
  },
  analytics_viewer: {
    name: 'analytics_viewer',
    display_name: 'مشاهده‌گر آمار',
    display_name_short: 'بازدید آمار',
    description: 'مشاهده آمار و گزارشات سیستم',
    icon: 'BarChart3',
    color: 'orange',
    level: 5,
    is_system_role: true
  },
  support_admin: {
    name: 'support_admin',
    display_name: 'ادمین پشتیبانی',
    display_name_short: 'پشتیبان',
    description: 'پشتیبانی محدود از کاربران',
    icon: 'HeadphonesIcon',
    color: 'gray',
    level: 6,
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