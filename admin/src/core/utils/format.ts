import { format } from 'date-fns-jalali'
import { faIR } from 'date-fns-jalali/locale'

export function formatNumber(num: number | undefined | null): string {
  if (num === undefined || num === null) {
    return '0'
  }
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

export function formatDate(date: string | Date | undefined | null): string {
  if (!date) {
    return '-'
  }
  
  try {
    // Parse the date
    const d = new Date(date)
    
    // Check if date is valid
    if (isNaN(d.getTime())) {
      return '-'
    }
    
    // Format using date-fns-jalali for Persian calendar without "ام"
    const day = format(d, 'd', { locale: faIR });
    const month = format(d, 'MMMM', { locale: faIR });
    const year = format(d, 'yyyy', { locale: faIR });
    return `${day} ${month} ${year}`;
  } catch (error) {
    // Fallback to simple formatting if there's an error
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

// Function to format date for input fields (Gregorian format for HTML5 date inputs)
export function formatInputDate(date: string | Date | undefined | null): string {
  if (!date) {
    return ''
  }
  
  try {
    const d = new Date(date)
    if (isNaN(d.getTime())) {
      return ''
    }
    
    // Return in YYYY-MM-DD format for HTML5 date inputs (Gregorian)
    return d.toISOString().split('T')[0]
  } catch (error) {
    return ''
  }
}