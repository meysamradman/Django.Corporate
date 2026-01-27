"""
Enhanced Persian (Jalali) date utilities with comprehensive formatting support.

Features:
- Persian month and weekday names
- Timezone support
- Multiple format options (short, medium, long)
- Performance optimization with lru_cache
- Robust error handling

Based on best practices for Django projects with Persian date support (2025).
"""

import jdatetime
from datetime import datetime
from functools import lru_cache
from django.utils import timezone


# Persian month names (Jalali calendar)
PERSIAN_MONTH_NAMES = {
    1: 'فروردین',
    2: 'اردیبهشت',
    3: 'خرداد',
    4: 'تیر',
    5: 'مرداد',
    6: 'شهریور',
    7: 'مهر',
    8: 'آبان',
    9: 'آذر',
    10: 'دی',
    11: 'بهمن',
    12: 'اسفند'
}

# Persian weekday names
PERSIAN_WEEKDAY_NAMES = {
    0: 'شنبه',
    1: 'یکشنبه',
    2: 'دوشنبه',
    3: 'سه‌شنبه',
    4: 'چهارشنبه',
    5: 'پنجشنبه',
    6: 'جمعه'
}


@lru_cache(maxsize=1024)
def format_jalali_date(dt, format_str='%Y/%m/%d', use_timezone=True):
    """
    Convert datetime to Jalali (Persian) date with various format options.
    
    Args:
        dt: datetime object or None
        format_str: Output format string. Supports:
            - %Y/%m/%d → 1403/10/07
            - %d %B %Y → 07 دی 1403
            - %A %d %B %Y → دوشنبه 07 دی 1403
            - Standard strftime codes: %Y, %m, %d, %A (weekday), %B (month name)
        use_timezone: Apply Django timezone conversion if datetime is aware
    
    Returns:
        Formatted Persian date string or "-" if input is invalid
    
    Examples:
        >>> format_jalali_date(datetime.now())
        '1403/10/07'
        >>> format_jalali_date(datetime.now(), '%d %B %Y')
        '07 دی 1403'
        >>> format_jalali_date(datetime.now(), '%A، %d %B %Y')
        'دوشنبه، 07 دی 1403'
    """
    if not dt:
        return "-"
    
    try:
        if not isinstance(dt, datetime):
            return str(dt)
        
        # Apply timezone conversion if needed
        if use_timezone and timezone.is_aware(dt):
            dt = timezone.localtime(dt)
        
        # Convert to Jalali
        j_date = jdatetime.datetime.fromgregorian(datetime=dt)
        
        # Handle Persian month and weekday names
        if '%B' in format_str or '%A' in format_str:
            result = format_str
            
            # Replace weekday name
            if '%A' in result:
                weekday_name = PERSIAN_WEEKDAY_NAMES.get(j_date.weekday(), '')
                result = result.replace('%A', weekday_name)
            
            # Replace month name
            if '%B' in result:
                month_name = PERSIAN_MONTH_NAMES.get(j_date.month, '')
                result = result.replace('%B', month_name)
            
            # Replace numeric values
            if '%Y' in result:
                result = result.replace('%Y', str(j_date.year))
            if '%m' in result:
                result = result.replace('%m', f'{j_date.month:02d}')
            if '%d' in result:
                result = result.replace('%d', f'{j_date.day:02d}')
            
            return result
        
        # Use standard strftime for numeric formats
        return j_date.strftime(format_str)
        
    except Exception:
        return "-"


@lru_cache(maxsize=1024)
def format_jalali_datetime(dt, format_str='%Y/%m/%d %H:%M', use_timezone=True):
    """
    Convert datetime to Jalali (Persian) date and time with various format options.
    
    Args:
        dt: datetime object or None
        format_str: Output format string. Supports all date codes plus:
            - %H: Hour (24-hour)
            - %M: Minute
            - %S: Second
        use_timezone: Apply Django timezone conversion if datetime is aware
    
    Returns:
        Formatted Persian datetime string or "-" if input is invalid
    
    Examples:
        >>> format_jalali_datetime(datetime.now())
        '1403/10/07 14:30'
        >>> format_jalali_datetime(datetime.now(), '%d %B %Y، ساعت %H:%M')
        '07 دی 1403، ساعت 14:30'
    """
    if not dt:
        return "-"
    
    try:
        if not isinstance(dt, datetime):
            return str(dt)
        
        # Apply timezone conversion if needed
        if use_timezone and timezone.is_aware(dt):
            dt = timezone.localtime(dt)
        
        # Convert to Jalali
        j_date = jdatetime.datetime.fromgregorian(datetime=dt)
        
        # Handle Persian month and weekday names
        if '%B' in format_str or '%A' in format_str:
            result = format_str
            
            # Replace weekday name
            if '%A' in result:
                weekday_name = PERSIAN_WEEKDAY_NAMES.get(j_date.weekday(), '')
                result = result.replace('%A', weekday_name)
            
            # Replace month name
            if '%B' in result:
                month_name = PERSIAN_MONTH_NAMES.get(j_date.month, '')
                result = result.replace('%B', month_name)
            
            # Replace date values
            result = result.replace('%Y', str(j_date.year))
            result = result.replace('%m', f'{j_date.month:02d}')
            result = result.replace('%d', f'{j_date.day:02d}')
            
            # Replace time values
            result = result.replace('%H', f'{j_date.hour:02d}')
            result = result.replace('%M', f'{j_date.minute:02d}')
            result = result.replace('%S', f'{j_date.second:02d}')
            
            return result
        
        # Use standard strftime for numeric formats
        return j_date.strftime(format_str)
        
    except Exception:
        return "-"


def format_jalali_short(dt):
    """
    Format datetime as short Persian date: 1403/10/07
    
    Args:
        dt: datetime object or None
    
    Returns:
        Short format Persian date string
    """
    return format_jalali_date(dt, '%Y/%m/%d')


def format_jalali_medium(dt):
    """
    Format datetime as medium Persian date: 07 دی 1403
    
    Args:
        dt: datetime object or None
    
    Returns:
        Medium format Persian date string with month name
    """
    return format_jalali_date(dt, '%d %B %Y')


def format_jalali_long(dt):
    """
    Format datetime as long Persian datetime: دوشنبه، 07 دی 1403، ساعت 14:30
    
    Args:
        dt: datetime object or None
    
    Returns:
        Long format Persian datetime string with weekday and month names
    """
    return format_jalali_datetime(dt, '%A، %d %B %Y، ساعت %H:%M')


def format_jalali_time(dt):
    """
    Format datetime as time only: 14:30
    
    Args:
        dt: datetime object or None
    
    Returns:
        Time string in HH:MM format
    """
    if not dt:
        return "-"
    
    try:
        if not isinstance(dt, datetime):
            return str(dt)
        
        if timezone.is_aware(dt):
            dt = timezone.localtime(dt)
        
        return dt.strftime('%H:%M')
        
    except Exception:
        return "-"
