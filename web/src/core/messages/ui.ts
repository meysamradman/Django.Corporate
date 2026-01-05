import { createMessageGetter } from './utils';

export const ACTION_MESSAGES = {
  loading: 'در حال بارگذاری...',
  success: 'موفقیت',
  error: 'خطا',
  retry: 'تلاش مجدد',
} as const;

export const STATUS_MESSAGES = {
  active: 'فعال',
  inactive: 'غیرفعال',
  published: 'منتشر شده',
  draft: 'پیش‌نویس',
  archived: 'بایگانی شده',
} as const;

export const getAction = createMessageGetter(ACTION_MESSAGES);
export const getStatus = createMessageGetter(STATUS_MESSAGES);
