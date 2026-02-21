import type { AdminProfileFormState, AdminPropertyItem } from "./types";

export const adminProfileDefault: AdminProfileFormState = {
  firstName: "سشی",
  lastName: "سشییس",
  roleTitle: "ادمین پنل املاک",
  birthDate: "7 بهمن 1404",
  nationalId: "0083529694",
  phone: "02188994567",
  mobile: "09124707989",
  email: "admin@example.com",
  province: "تهران",
  city: "تهران",
  address: "تهران، خیابان ولیعصر، کوچه ناصری، پلاک ۱۲، واحد ۴",
  bio: "مدیر سیستم با تمرکز بر کنترل عملیات پنل، کیفیت داده و هماهنگی بین تیم محتوا و املاک.",
  active: true,
  createdAt: "1404/02/07",
  instagram: "@admin.panel",
  telegram: "t.me/adminpanel",
  linkedin: "linkedin.com/in/admin-panel",
  website: "https://example.com",
  avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=240&q=80",
  coverUrl: "/images/profileone.webp",
  profileViews: "۱۲۹",
  propertyCount: "۱۲",
  ticketCount: "۹۴۷",
};

export const adminProperties: AdminPropertyItem[] = [
  { id: 1102, title: "آپارتمان دو خوابه نوساز", city: "تهران", propertyType: "آپارتمان", dealType: "فروش", status: "فعال", price: "۸۵۰۰ میلیون", viewLink: "/real-estate/properties/1102/view", updatedAt: "1404/11/02" },
  { id: 1108, title: "واحد اداری موقعیت عالی", city: "تهران", propertyType: "اداری", dealType: "اجاره", status: "در انتظار", price: "۲۴۰۰ میلیون", viewLink: "/real-estate/properties/1108/view", updatedAt: "1404/10/29" },
  { id: 1125, title: "ویلا دوبلکس بازسازی شده", city: "کرج", propertyType: "ویلا", dealType: "فروش", status: "فعال", price: "۱۲۰۰۰ میلیون", viewLink: "/real-estate/properties/1125/view", updatedAt: "1404/10/20" },
  { id: 1130, title: "مغازه بر اصلی", city: "مشهد", propertyType: "تجاری", dealType: "رهن و اجاره", status: "غیرفعال", price: "۳۹۰۰ میلیون", viewLink: "/real-estate/properties/1130/view", updatedAt: "1404/10/14" },
  { id: 1138, title: "پنت‌هاوس نورگیر", city: "شیراز", propertyType: "آپارتمان", dealType: "پیش‌فروش", status: "فعال", price: "۹۷۰۰ میلیون", viewLink: "/real-estate/properties/1138/view", updatedAt: "1404/10/08" },
];
