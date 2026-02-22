import { createMessageGetter } from './utils';

export const CRUD_MESSAGES = {
  created: '{item} با موفقیت ایجاد شد',
  updated: '{item} با موفقیت به‌روزرسانی شد',
  deleted: '{item} با موفقیت حذف شد',
  saved: '{item} با موفقیت ذخیره شد',
  activated: '{item} با موفقیت فعال شد',
  deactivated: '{item} با موفقیت غیرفعال شد',
} as const;

export const ACTION_MESSAGES = {
  loading: 'در حال بارگذاری...',
  success: 'موفقیت',
  error: 'خطا',
  noChanges: 'تغییری یافت نشد.',
  noSelection: 'آیتمی انتخاب نشده',
  uploadPermissionDenied: 'اجازه آپلود رسانه را ندارید',
  waitForSettingsLoad: 'لطفا صبر کنید تا تنظیمات بارگذاری شود',
  coverMustBeImage: 'کاور باید یک تصویر باشد',
  fileRemoved: 'فایل حذف شد',
  fileReadyToSend: 'فایل {name} آماده ارسال است',
  confirm: 'تأیید',
  cancel: 'لغو',
  delete: 'حذف',
  retry: 'تلاش مجدد',
  edit: 'ویرایش',
  save: 'ذخیره',
} as const;

export const CONFIRM_MESSAGES = {
  delete: 'آیا از حذف {item} اطمینان دارید؟',
  bulkDelete: 'آیا از حذف {count} {item} اطمینان دارید؟',
} as const;

export const EXPORT_MESSAGES = {
  excelSuccess: 'فایل اکسل با موفقیت دانلود شد',
  pdfSuccess: 'فایل PDF با موفقیت دانلود شد',
  excelError: 'خطا در دانلود فایل اکسل',
  pdfError: 'خطا در دانلود فایل PDF',
  excelPreparing: 'در حال آماده‌سازی فایل Excel ({item})...',
  excelReadyWithCount: 'فایل Excel با {count} رکورد آماده شد',
  serverFetchingCount: 'تعداد {count} رکورد از سرور دریافت می‌شود...',
  fileReceived: 'فایل {item} با موفقیت دریافت شد',
  exportErrorForItem: 'خطا در Export {item}',
  printError: 'خطا در دریافت داده‌ها برای پرینت',
  popupBlocker: 'لطفاً popup blocker را غیرفعال کنید',
  printLimit: 'فقط {max} آیتم اول از {total} آیتم پرینت شد',
} as const;

export const STATUS_MESSAGES = {
  active: 'فعال',
  inactive: 'غیرفعال',
  published: 'منتشر شده',
  draft: 'پیش‌نویس',
  archived: 'بایگانی شده',
  statusChangeError: 'خطا در تغییر وضعیت',
} as const;

export const AUTH_MESSAGES = {
  loginSuccess: 'ورود موفقیت‌آمیز',
  logoutSuccess: 'خروج موفقیت‌آمیز',
  loginFailed: 'ورود ناموفق',
  invalidCredentials: 'ورود اعتبارنامه‌های ارائه شده نادرست است',
  invalidPassword: 'رمز عبور اشتباه است',
  invalidOTP: 'کد تأیید نامعتبر است',
  resetOtpSent: 'کد بازیابی رمز عبور ارسال شد',
  passwordResetSuccess: 'رمز عبور با موفقیت تغییر کرد',
  sessionExpired: 'جلسه کاری منقضی شده است',
  accessDenied: 'دسترسی غیر مجاز',
  otpSent: 'کد یکبار مصرف ارسال شد',
  otpSendFailed: 'خطا در ارسال کد یکبار مصرف',
} as const;

export const SECURITY_MESSAGES = {
  ipUnbanned: 'IP با موفقیت از ban خارج شد',
  ipBanned: 'IP با موفقیت ban شد',
  ipWhitelisted: 'IP با موفقیت به whitelist اضافه شد',
  ipWhitelistRemoved: 'IP با موفقیت از whitelist حذف شد',
  currentIpWhitelisted: 'IP فعلی شما به whitelist اضافه شد',
  ipRequired: 'لطفاً IP را وارد کنید',
  ipUnbanError: 'خطا در رفع ban IP',
  ipBanError: 'خطا در ban کردن IP',
  ipWhitelistAddError: 'خطا در اضافه کردن IP به whitelist',
  ipWhitelistRemoveError: 'خطا در حذف IP از whitelist',
  currentIpWhitelistAddError: 'خطا در اضافه کردن IP فعلی به whitelist',
} as const;

export const EMAIL_ACTION_MESSAGES = {
  selectEmailsFirst: 'لطفا ابتدا ایمیل‌هایی را انتخاب کنید',
  markedAsRead: 'ایمیل‌ها به عنوان خوانده شده علامت‌گذاری شدند',
  markedAsUnread: 'ایمیل‌ها به عنوان نخوانده علامت‌گذاری شدند',
  replySent: 'پاسخ با موفقیت ارسال شد',
  emailSent: 'ایمیل با موفقیت ارسال شد',
  draftSaved: 'پیش‌نویس با موفقیت ذخیره شد',
  draftPublished: 'پیش‌نویس با موفقیت منتشر شد',
  starAdded: 'ستاره اضافه شد',
  starRemoved: 'ستاره حذف شد',
} as const;

export const getCrud = createMessageGetter(CRUD_MESSAGES);
export const getAction = createMessageGetter(ACTION_MESSAGES);
export const getConfirm = createMessageGetter(CONFIRM_MESSAGES);
export const getExport = createMessageGetter(EXPORT_MESSAGES);
export const getStatus = createMessageGetter(STATUS_MESSAGES);
export const getAuth = createMessageGetter(AUTH_MESSAGES);
export const getSecurity = createMessageGetter(SECURITY_MESSAGES);
export const getEmailAction = createMessageGetter(EMAIL_ACTION_MESSAGES);
