import { format } from 'date-fns-jalali'
import { faIR } from 'date-fns-jalali/locale'

/**
 * فرمت کردن اعداد با جداکننده هزارگان فارسی
 */
export const formatNumber = (num: number | undefined | null): string => {
  if (num === undefined || num === null) return '0';
  return num.toLocaleString('fa-IR');
};

/**
 * فرمت کردن حجم فایل
 */
export const formatFileSize = (bytes: number | undefined | null): string => {
  if (!bytes || bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * فرمت کردن درصد
 */
export const formatPercent = (value: number | undefined | null, decimals: number = 1): string => {
  if (value === undefined || value === null) return '0%';
  return `${value.toFixed(decimals)}%`;
};

/**
 * فرمت کردن تاریخ به فارسی
 */
export function formatDate(date: string | Date | undefined | null): string {
  if (!date) {
    return '-'
  }
  
  try {
    const d = new Date(date)
    
    if (isNaN(d.getTime())) {
      return '-'
    }
    
    const day = format(d, 'd', { locale: faIR });
    const month = format(d, 'MMMM', { locale: faIR });
    const year = format(d, 'yyyy', { locale: faIR });
    return `${day} ${month} ${year}`;
  } catch (error) {
    const d = new Date(date)
    const year = d.getFullYear()
    const month = d.getMonth()
    const day = d.getDate()
    const persianYear = year - 621
    const persianMonth = month + 1
    const persianDay = day

    const monthNames = [
      'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
      'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
    ]

    return `${persianDay} ${monthNames[persianMonth - 1]} ${persianYear}`
  }
}

/**
 * فرمت کردن تاریخ برای input
 */
export function formatInputDate(date: string | Date | undefined | null): string {
  if (!date) {
    return ''
  }
  
  try {
    const d = new Date(date)
    if (isNaN(d.getTime())) {
      return ''
    }
    
    return d.toISOString().split('T')[0]
  } catch (error) {
    return ''
  }
}

/**
 * دریافت سال شمسی از تاریخ
 */
export function getPersianYear(date?: Date | string | null): string {
  if (!date) {
    const d = new Date()
    try {
      return format(d, 'yyyy', { locale: faIR })
    } catch {
      return String(d.getFullYear() - 621)
    }
  }
  
  try {
    const d = typeof date === 'string' ? new Date(date) : date
    if (isNaN(d.getTime())) {
      return String(new Date().getFullYear() - 621)
    }
    return format(d, 'yyyy', { locale: faIR })
  } catch (error) {
    const d = typeof date === 'string' ? new Date(date) : date
    return String(d.getFullYear() - 621)
  }
}
