export const PROFILE_OVERVIEW_TABS = [
  { value: "admin-info", label: "اطلاعات ادمین" },
  { value: "consultant", label: "مشاور" },
  { value: "properties", label: "املاک" },
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
