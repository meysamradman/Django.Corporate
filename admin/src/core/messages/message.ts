const ERROR_MESSAGES = {
  network: "خطا در اتصال به شبکه",
  unauthorized: "دسترسی غیر مجاز",
  forbidden: "دسترسی ممنوع",
  notFound: "یافت نشد",
  serverError: "خطای سرور",
  validation: "خطا در اعتبارسنجی اطلاعات",
  timeout: "زمان اتصال به پایان رسید",
  database: "خطای پایگاه داده",
  unknownError: "خطای نامشخص. لطفاً دوباره تلاش کنید",
  otpSendFailed: "خطا در ارسال کد یکبار مصرف"
} as const;

// Auth Messages
const AUTH_MESSAGES = {
  loginSuccess: "ورود موفقیت‌آمیز",
  logoutSuccess: "خروج موفقیت‌آمیز",
  loginFailed: "ورود ناموفق",
  invalidCredentials: "نام کاربری یا رمز عبور اشتباه است",
  sessionExpired: "جلسه کاری منقضی شده است",
  accessDenied: "دسترسی غیر مجاز",
  otpSent: "کد یکبار مصرف ارسال شد",
  otpSendFailed: "خطا در ارسال کد یکبار مصرف"
} as const;

// Validation Messages
const VALIDATION_MESSAGES = {
  // General
  required: "{field} الزامی است",
  minLength: "{field} باید حداقل {min} کاراکتر باشد",
  maxLength: "{field} نباید بیشتر از {max} کاراکتر باشد",
  
  // Mobile
  mobileRequired: "شماره موبایل الزامی است",
  mobileInvalid: "شماره موبایل معتبر نیست",
  
  // Email  
  emailRequired: "ایمیل الزامی است",
  emailInvalid: "فرمت ایمیل معتبر نیست",
  
  // Password
  passwordRequired: "رمز عبور الزامی است",
  passwordMinLength: "رمز عبور باید حداقل ۸ کاراکتر باشد",
  passwordUppercase: "رمز عبور باید حداقل یک حرف بزرگ داشته باشد",
  passwordLowercase: "رمز عبور باید حداقل یک حرف کوچک داشته باشد",
  passwordNumber: "رمز عبور باید حداقل یک عدد داشته باشد",
  passwordSpecial: "رمز عبور باید حداقل یک کاراکتر ویژه داشته باشد (!@#$%^&*)",
  
  // Login Form
  captchaRequired: "کپچا الزامی است",
  otpRequired: "کد یکبار مصرف الزامی است",
  
  // National ID
  nationalIdRequired: "کد ملی الزامی است",
  nationalIdLength: "کد ملی باید ۱۰ رقم باشد",
  nationalIdInvalid: "کد ملی معتبر نیست",
  
  // Phone
  phoneInvalid: "شماره تلفن معتبر نیست",
  
  // Admin Form
  fullNameRequired: "نام کامل الزامی است",
  fullNameMinLength: "نام کامل باید حداقل ۲ کاراکتر باشد",
  fullNameMaxLength: "نام کامل نباید بیشتر از ۱۰۰ کاراکتر باشد",
  firstNameMaxLength: "نام نباید بیشتر از ۵۰ کاراکتر باشد",
  lastNameMaxLength: "نام خانوادگی نباید بیشتر از ۵۰ کاراکتر باشد",
  addressMaxLength: "آدرس نباید بیشتر از ۵۰۰ کاراکتر باشد",
  departmentMaxLength: "بخش نباید بیشتر از ۱۰۰ کاراکتر باشد",
  positionMaxLength: "سمت نباید بیشتر از ۱۰۰ کاراکتر باشد",
  bioMaxLength: "بیوگرافی نباید بیشتر از ۱۰۰۰ کاراکتر باشد",
  notesMaxLength: "یادداشت‌ها نباید بیشتر از ۱۰۰۰ کاراکتر باشد",
  phoneMaxLength: "تلفن نباید بیشتر از ۱۵ کاراکتر باشد",
  provinceMaxLength: "نام استان نباید بیشتر از ۱۰۰ کاراکتر باشد",
  cityMaxLength: "نام شهر نباید بیشتر از ۱۰۰ کاراکتر باشد",
  provinceRequired: "انتخاب استان الزامی است",
  cityRequired: "انتخاب شهر الزامی است",
  passwordComplexity: "رمز عبور باید شامل حروف بزرگ، کوچک، عدد و کاراکتر ویژه باشد",
  
  // Portfolio
  portfolioNameRequired: "نام نمونه‌کار الزامی است",
  portfolioNameMinLength: "نام نمونه‌کار باید حداقل ۳ کاراکتر باشد",
  portfolioNameMaxLength: "نام نمونه‌کار نباید بیشتر از ۲۰۰ کاراکتر باشد",
  portfolioSlugRequired: "لینک (اسلاگ) الزامی است",
  portfolioSlugInvalid: "لینک (اسلاگ) فقط می‌تواند شامل حروف فارسی، انگلیسی، اعداد و خط تیره باشد",
  portfolioSlugMaxLength: "لینک (اسلاگ) نباید بیشتر از ۶۰ کاراکتر باشد",
  portfolioShortDescMaxLength: "توضیحات کوتاه نباید بیشتر از ۳۰۰ کاراکتر باشد",
  portfolioCategoryRequired: "انتخاب دسته‌بندی الزامی است",
  portfolioFeaturedImageRequired: "انتخاب تصویر شاخص الزامی است",
  
  // Role
  roleNameRequired: "نام نقش الزامی است",
  roleNameMinLength: "نام نقش باید حداقل ۲ کاراکتر باشد",
  roleNameMaxLength: "نام نقش نباید بیشتر از ۱۰۰ کاراکتر باشد",
  roleDescMaxLength: "توضیحات نقش نباید بیشتر از ۳۰۰ کاراکتر باشد",
  rolePermissionsRequired: "انتخاب حداقل یک دسترسی الزامی است",
  
  // SEO
  metaTitleMaxLength: "عنوان متا نباید بیشتر از ۷۰ کاراکتر باشد",
  metaDescMaxLength: "توضیحات متا نباید بیشتر از ۱۶۰ کاراکتر باشد",
  ogTitleMaxLength: "عنوان Open Graph نباید بیشتر از ۷۰ کاراکتر باشد",
  ogDescMaxLength: "توضیحات Open Graph نباید بیشتر از ۱۶۰ کاراکتر باشد",
  
  // URL
  urlInvalid: "آدرس وارد شده معتبر نیست",
  
  // Profile Update Errors
  userProfileUpdateFailed: "خطا در به‌روزرسانی پروفایل کاربر",
  adminProfileUpdateFailed: "خطا در به‌روزرسانی پروفایل ادمین",
  
  // Field Validation Errors
  auth_mobile_invalid: "شماره موبایل معتبر نیست",
  auth_email_invalid: "ایمیل معتبر نیست",
  national_id_exists: "کد ملی قبلاً توسط کاربر دیگری استفاده شده است",
  first_name_required: "نام الزامی است",
  last_name_required: "نام خانوادگی الزامی است",
  
} as const;

// Common UI Messages (برای loading، confirm، etc.)
const COMMON_UI_MESSAGES = {
  loading: "در حال بارگذاری...",
  success: "موفقیت",
  error: "خطا",
  confirm: "تأیید",
  cancel: "لغو",
  delete: "حذف",
  retry: "تلاش مجدد",
  confirmDelete: "تایید حذف",
  
  // Confirm Messages
  deleteAdmin: "آیا از حذف این ادمین اطمینان دارید؟",
  deleteRole: "آیا از حذف این نقش اطمینان دارید؟",
  deleteUser: "آیا از حذف این کاربر اطمینان دارید؟",
  bulkDeleteAdmins: "آیا از حذف {count} ادمین اطمینان دارید؟",
  bulkDeleteRoles: "آیا از حذف {count} نقش اطمینان دارید؟",
  bulkDeleteUsers: "آیا از حذف {count} کاربر اطمینان دارید؟",

  // Success Messages  
  created: "با موفقیت ایجاد شد",
  updated: "با موفقیت به‌روزرسانی شد",
  deleted: "با موفقیت حذف شد",
  saved: "با موفقیت ذخیره شد",
  
  // Portfolio Success Messages
  portfolioCreated: "نمونه‌کار با موفقیت ایجاد شد",
  portfolioUpdated: "نمونه‌کار با موفقیت به‌روزرسانی شد",
  portfolioDeleted: "نمونه‌کار با موفقیت حذف شد",
  portfolioDraftSaved: "پیش‌نویس با موفقیت ذخیره شد",
  
  // Role Success Messages
  roleCreated: "نقش با موفقیت ایجاد شد",
  roleUpdated: "نقش با موفقیت به‌روزرسانی شد",
  roleDeleted: "نقش با موفقیت حذف شد",
  
  // Profile Success Messages
  userProfileUpdated: "پروفایل کاربر با موفقیت به‌روزرسانی شد",
  adminProfileUpdated: "پروفایل ادمین با موفقیت به‌روزرسانی شد"
} as const;

// Helper function for parameter replacement
const replaceParams = (message: string, params?: Record<string, string | number>): string => {
  if (!params) return message;
  
  return Object.entries(params).reduce((msg, [param, value]) => {
    return msg.replace(`{${param}}`, String(value));
  }, message);
};

// Export functions (فقط برای errorHandler و common usage)
export const getErrorMessage = (key: keyof typeof ERROR_MESSAGES): string => {
  return ERROR_MESSAGES[key] || ERROR_MESSAGES.unknownError;
};

export const getUIMessage = (key: keyof typeof COMMON_UI_MESSAGES): string => {
  return COMMON_UI_MESSAGES[key] || key;
};

export const getValidationMessage = (key: keyof typeof VALIDATION_MESSAGES, params?: Record<string, string | number>): string => {
  const message = VALIDATION_MESSAGES[key] || key;
  return replaceParams(message, params);
};

export const getConfirmMessage = (key: keyof typeof COMMON_UI_MESSAGES, params?: Record<string, string | number>): string => {
  const message = COMMON_UI_MESSAGES[key] || key;
  return replaceParams(message, params);
};

// Main msg object for convenient access
export const msg = {
  auth: (key: keyof typeof AUTH_MESSAGES): string => {
    return AUTH_MESSAGES[key] || key;
  },
  error: (key: keyof typeof ERROR_MESSAGES): string => {
    return ERROR_MESSAGES[key] || ERROR_MESSAGES.unknownError;
  },
  ui: (key: keyof typeof COMMON_UI_MESSAGES): string => {
    return COMMON_UI_MESSAGES[key] || key;
  },
  validation: (key: keyof typeof VALIDATION_MESSAGES, params?: Record<string, string | number>): string => {
    const message = VALIDATION_MESSAGES[key] || key;
    return replaceParams(message, params);
  }
};

// Export constants
export { ERROR_MESSAGES, COMMON_UI_MESSAGES, VALIDATION_MESSAGES, AUTH_MESSAGES }; 



