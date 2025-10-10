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
  
  const d = new Date(date)
  
  // Check if date is valid
  if (isNaN(d.getTime())) {
    return '-'
  }
  
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
