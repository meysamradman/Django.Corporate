export const PROFILE_OVERVIEW_TABS = [
  { value: "admin-info", label: "اطلاعات ادمین" },
  { value: "consultant", label: "مشاور" },
  { value: "properties", label: "املاک" },
  { value: "permissions", label: "دسترسی‌ها" },
  { value: "security", label: "امنیت" },
  { value: "social", label: "شبکه‌های اجتماعی" },
] as const;

export const ADMIN_ROLE_OPTIONS = [
  { value: "none", label: "بدون نقش" },
  { value: "content_manager", label: "مدیر محتوا" },
  { value: "media_manager", label: "مدیر مدیا" },
  { value: "property_manager", label: "مدیر املاک" },
] as const;

export const ADMIN_ROLE_LIST = [
  {
    value: "none",
    label: "بدون نقش",
    description: "ادمین فقط دسترسی‌های دستی انتخاب‌شده را دارد.",
    isProtected: false,
    permissionIds: [] as number[],
  },
  {
    value: "content_manager",
    label: "مدیر محتوا",
    description: "مدیریت محتوای پنل و ویرایش اطلاعات مرتبط.",
    isProtected: false,
    permissionIds: [1, 2] as number[],
  },
  {
    value: "media_manager",
    label: "مدیر مدیا",
    description: "مدیریت فایل‌ها، ایجاد و حذف مدیا در پنل.",
    isProtected: false,
    permissionIds: [3, 4, 5] as number[],
  },
  {
    value: "property_manager",
    label: "مدیر املاک",
    description: "دسترسی به مدیریت داده‌های عملیاتی املاک.",
    isProtected: true,
    permissionIds: [1, 3] as number[],
  },
] as const;

export const ADMIN_PERMISSION_ITEMS = [
  { id: 1, title: "مشاهده ادمین", codename: "view_admin", module: "admins", action: "read" },
  { id: 2, title: "ویرایش ادمین", codename: "change_admin", module: "admins", action: "update" },
  { id: 3, title: "مشاهده مدیا", codename: "view_media", module: "media", action: "read" },
  { id: 4, title: "ایجاد مدیا", codename: "add_media", module: "media", action: "create" },
  { id: 5, title: "حذف مدیا", codename: "delete_media", module: "media", action: "delete" },
] as const;

export const FAVORITE_ITEMS = [
  {
    id: 1,
    author: "Fran Riley",
    title: "رویداد Pride@Work برای تیم ERG",
    subtitle: "به یک کارگاه تعاملی ویژه توسعه رهبران بپیوندید.",
    date: "2 November 2024",
    category: "کارگاه",
    tag: "ERG بانوان",
  },
  {
    id: 2,
    author: "Esther Howard",
    title: "Blackbird",
    subtitle: "کارگاه تعاملی ویژه تیم‌های فراگیر و همکاری موثر.",
    date: "12 November 2024",
    category: "کارگاه",
    tag: "ERG بانوان",
  },
  {
    id: 3,
    author: "Miles, Esther",
    title: "میزبانی MERGE در Sharp Business USA",
    subtitle: "رویداد آموزشی برای رشد حرفه‌ای در محیط کار.",
    date: "16 November 2024",
    category: "کارگاه",
    tag: "ERG بانوان",
  },
] as const;

export const RECENT_ACTIVITY_ITEMS = [
  "مشاهده: کارگاه رهبری فراگیر",
  "جستجو: منابع سلامت روان",
  "جستجو: منابع سلامت روان",
  "مشاهده: مجموعه سخنرانان ماه افتخار",
  "جستجو: منابع سلامت روان",
  "جستجو: منابع سلامت روان",
] as const;

export const COLLAB_ITEMS = [
  {
    id: 1,
    title: "تیم ERG من",
    members: "الکسیس، جردن، کیسی",
  },
  {
    id: 2,
    title: "همکاری Black x Pride BHM",
    members: "الکسیس، جردن، کیسی",
  },
] as const;

export const NOTIFICATION_ITEMS = [
  {
    id: 1,
    title: "دعوت جدید برای همکاری",
    description: "تیم شما شما را به ERG Growth Circle دعوت کرده است.",
    time: "۲ ساعت پیش",
  },
  {
    id: 2,
    title: "یادآوری رویداد",
    description: "کارگاه Blackbird فردا ساعت ۱۰:۰۰ شروع می‌شود.",
    time: "۱ روز پیش",
  },
] as const;
