

import jdatetime
from datetime import datetime
from functools import lru_cache
from django.utils import timezone

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
    
    if not dt:
        return "-"
    
    try:
        if not isinstance(dt, datetime):
            return str(dt)
        
        if use_timezone and timezone.is_aware(dt):
            dt = timezone.localtime(dt)
        
        j_date = jdatetime.datetime.fromgregorian(datetime=dt)
        
        if '%B' in format_str or '%A' in format_str:
            result = format_str
            
            if '%A' in result:
                weekday_name = PERSIAN_WEEKDAY_NAMES.get(j_date.weekday(), '')
                result = result.replace('%A', weekday_name)
            
            if '%B' in result:
                month_name = PERSIAN_MONTH_NAMES.get(j_date.month, '')
                result = result.replace('%B', month_name)
            
            if '%Y' in result:
                result = result.replace('%Y', str(j_date.year))
            if '%m' in result:
                result = result.replace('%m', f'{j_date.month:02d}')
            if '%d' in result:
                result = result.replace('%d', f'{j_date.day:02d}')
            
            return result
        
        return j_date.strftime(format_str)
        
    except Exception:
        return "-"

@lru_cache(maxsize=1024)
def format_jalali_datetime(dt, format_str='%Y/%m/%d %H:%M', use_timezone=True):
    
    if not dt:
        return "-"
    
    try:
        if not isinstance(dt, datetime):
            return str(dt)
        
        if use_timezone and timezone.is_aware(dt):
            dt = timezone.localtime(dt)
        
        j_date = jdatetime.datetime.fromgregorian(datetime=dt)
        
        if '%B' in format_str or '%A' in format_str:
            result = format_str
            
            if '%A' in result:
                weekday_name = PERSIAN_WEEKDAY_NAMES.get(j_date.weekday(), '')
                result = result.replace('%A', weekday_name)
            
            if '%B' in result:
                month_name = PERSIAN_MONTH_NAMES.get(j_date.month, '')
                result = result.replace('%B', month_name)
            
            result = result.replace('%Y', str(j_date.year))
            result = result.replace('%m', f'{j_date.month:02d}')
            result = result.replace('%d', f'{j_date.day:02d}')
            
            result = result.replace('%H', f'{j_date.hour:02d}')
            result = result.replace('%M', f'{j_date.minute:02d}')
            result = result.replace('%S', f'{j_date.second:02d}')
            
            return result
        
        return j_date.strftime(format_str)
        
    except Exception:
        return "-"

def format_jalali_short(dt):
    
    return format_jalali_date(dt, '%Y/%m/%d')

def format_jalali_medium(dt):
    
    return format_jalali_date(dt, '%d %B %Y')

def format_jalali_long(dt):
    
    return format_jalali_datetime(dt, '%A، %d %B %Y، ساعت %H:%M')

def format_jalali_time(dt):
    
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
