const ERROR_MESSAGES = {
  network: "خطا در اتصال به شبکه",
  unauthorized: "دسترسی غیر مجاز",
  forbidden: "دسترسی ممنوع",
  notFound: "یافت نشد",
  serverError: "خطای سرور",
  validation: "خطا در اعتبارسنجی اطلاعات",
  timeout: "زمان اتصال به پایان رسید",
  database: "خطای پایگاه داده",
  unknownError: "خطای نامشخص. لطفاً دوباره تلاش کنید"
} as const;

// Auth Messages
const AUTH_MESSAGES = {
  loginSuccess: "ورود موفقیت‌آمیز",
  logoutSuccess: "خروج موفقیت‌آمیز",
  loginFailed: "ورود ناموفق",
  invalidCredentials: "نام کاربری یا رمز عبور اشتباه است",
  sessionExpired: "جلسه کاری منقضی شده است",
  accessDenied: "دسترسی غیر مجاز"
} as const;

// Validation Messages
const VALIDATION_MESSAGES = {
  // General
  required: "{field} الزامی است",
  
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
  
  // National ID
  nationalIdRequired: "کد ملی الزامی است",
  nationalIdLength: "کد ملی باید ۱۰ رقم باشد",
  nationalIdInvalid: "کد ملی معتبر نیست"
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
  saved: "با موفقیت ذخیره شد"
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