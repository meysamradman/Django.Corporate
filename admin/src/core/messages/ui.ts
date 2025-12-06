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

export const getCrud = createMessageGetter(CRUD_MESSAGES);
export const getAction = createMessageGetter(ACTION_MESSAGES);
export const getConfirm = createMessageGetter(CONFIRM_MESSAGES);
export const getExport = createMessageGetter(EXPORT_MESSAGES);
export const getStatus = createMessageGetter(STATUS_MESSAGES);
