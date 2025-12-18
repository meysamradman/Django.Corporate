import { toast } from '@/components/elements/Sonner';

/**
 * نمایش پیام خطا
 */
export const showError = (message: string) => {
  toast.error(message);
};

/**
 * نمایش پیام موفقیت
 */
export const showSuccess = (message: string) => {
  toast.success(message);
};

/**
 * نمایش پیام اطلاعاتی
 */
export const showInfo = (message: string) => {
  toast.info(message);
};

/**
 * نمایش پیام هشدار
 */
export const showWarning = (message: string) => {
  toast.warning(message);
};
