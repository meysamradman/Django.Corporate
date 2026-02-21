export const staticAdminTabs = [
  { value: "account", label: "حساب کاربری" },
  { value: "profile", label: "پروفایل" },
  { value: "permissions", label: "دسترسی‌ها" },
  { value: "security", label: "گذرواژه" },
  { value: "social", label: "شبکه‌های اجتماعی" },
] as const;

export const staticRoleOptions = [
  { value: "none", label: "بدون نقش" },
  { value: "content_manager", label: "مدیر محتوا" },
  { value: "media_manager", label: "مدیر مدیا" },
  { value: "property_manager", label: "مدیر املاک" },
] as const;

export const staticPermissionBadgeClass: Record<string, string> = {
  create: "bg-success text-success-2",
  read: "bg-blue text-blue-2",
  update: "bg-yellow text-yellow-2",
  delete: "bg-danger text-danger-2",
};

export const staticPermissionItems = [
  { id: 1, codename: "view_admin", title: "مشاهده ادمین", action: "read", module: "admins" },
  { id: 2, codename: "change_admin", title: "ویرایش ادمین", action: "update", module: "admins" },
  { id: 3, codename: "view_media", title: "مشاهده مدیا", action: "read", module: "media" },
  { id: 4, codename: "add_media", title: "ایجاد مدیا", action: "create", module: "media" },
  { id: 5, codename: "view_setting", title: "مشاهده تنظیمات", action: "read", module: "settings" },
] as const;

export interface StaticAdminFormState {
  username: string;
  email: string;
  isStaff: boolean;
  isSuperuser: boolean;
  firstName: string;
  lastName: string;
  birthDate: string;
  nationalId: string;
  phone: string;
  province: string;
  city: string;
  address: string;
  bio: string;
  role: string;
  customRole: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  twoFactorEnabled: boolean;
  forcePasswordChange: boolean;
  instagram: string;
  telegram: string;
  whatsapp: string;
  linkedin: string;
  website: string;
}

export const staticDefaultAdminForm: StaticAdminFormState = {
  username: "barakat_admin",
  email: "admin@example.com",
  isStaff: true,
  isSuperuser: false,
  firstName: "باراکت",
  lastName: "الله",
  birthDate: "1375/05/10",
  nationalId: "0012345678",
  phone: "09121234567",
  province: "تهران",
  city: "تهران",
  address: "تهران، خیابان ولیعصر، پلاک 100",
  bio: "مدیر سیستم با تمرکز روی معماری، امنیت و بهینه‌سازی فرآیندهای ادمین.",
  role: "content_manager",
  customRole: "",
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
  twoFactorEnabled: false,
  forcePasswordChange: false,
  instagram: "https://instagram.com/admin",
  telegram: "https://t.me/admin",
  whatsapp: "https://wa.me/989121234567",
  linkedin: "https://linkedin.com/in/admin",
  website: "https://example.com",
};

export const ADMIN_STATIC_TABS = staticAdminTabs;
export const ADMIN_ROLE_OPTIONS = staticRoleOptions;
export const ADMIN_PERMISSION_BADGES = staticPermissionItems.map((item) => ({
  id: item.id,
  label: item.codename,
  variant: item.action,
}));
export const ADMIN_STATIC_DEFAULTS = {
  fullName: `${staticDefaultAdminForm.firstName} ${staticDefaultAdminForm.lastName}`,
  firstName: staticDefaultAdminForm.firstName,
  lastName: staticDefaultAdminForm.lastName,
  mobile: staticDefaultAdminForm.phone,
  email: staticDefaultAdminForm.email,
  password: "",
  birthDate: staticDefaultAdminForm.birthDate,
  nationalId: staticDefaultAdminForm.nationalId,
  phone: staticDefaultAdminForm.phone,
  province: staticDefaultAdminForm.province,
  city: staticDefaultAdminForm.city,
  address: staticDefaultAdminForm.address,
  bio: staticDefaultAdminForm.bio,
  roleId: staticDefaultAdminForm.role,
  isSuperuser: staticDefaultAdminForm.isSuperuser,
  isActive: true,
  currentPassword: staticDefaultAdminForm.currentPassword,
  newPassword: staticDefaultAdminForm.newPassword,
  confirmPassword: staticDefaultAdminForm.confirmPassword,
  instagram: staticDefaultAdminForm.instagram,
  linkedin: staticDefaultAdminForm.linkedin,
};
