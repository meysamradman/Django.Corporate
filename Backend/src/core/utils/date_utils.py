import jdatetime
from datetime import datetime

def format_jalali_date(dt):
    """
    Formats a datetime object to YYYY/MM/DD in Jalali calendar using jdatetime.
    """
    if not dt:
        return "-"
    try:
        if isinstance(dt, datetime):
            return jdatetime.datetime.fromgregorian(datetime=dt).strftime("%Y/%m/%d")
        return str(dt)
    except Exception:
        return "-"

def format_jalali_datetime(dt):
    """
    Formats a datetime object to YYYY/MM/DD HH:MM in Jalali calendar using jdatetime.
    """
    if not dt:
        return "-"
    try:
        if isinstance(dt, datetime):
            return jdatetime.datetime.fromgregorian(datetime=dt).strftime("%Y/%m/%d %H:%M")
        return str(dt)
    except Exception:
        return "-"
