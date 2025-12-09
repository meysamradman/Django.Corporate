"""
GeoIP Service - تشخیص کشور از IP
"""
import logging

logger = logging.getLogger(__name__)

def get_country_from_ip(ip_address):
    """
    دریافت کشور از IP با استفاده از GeoIP2
    
    Args:
        ip_address: آدرس IP
        
    Returns:
        str: کد کشور 2 حرفی (مثلاً 'IR', 'US')
    """
    if not ip_address or ip_address in ['127.0.0.1', 'localhost', '::1']:
        return ''
    
    try:
        # روش 1: استفاده از Django GeoIP2 (توصیه می‌شود)
        from django.contrib.gis.geoip2 import GeoIP2
        
        try:
            g = GeoIP2()
            country_data = g.country(ip_address)
            return country_data.get('country_code', '')
        except Exception:
            pass
    except ImportError:
        # اگر Django GeoIP نصب نیست
        pass
    
    try:
        # روش 2: استفاده مستقیم از geoip2
        import geoip2.database
        from django.conf import settings
        import os
        
        # مسیر دیتابیس GeoIP
        geoip_path = getattr(settings, 'GEOIP_PATH', None)
        if not geoip_path:
            geoip_path = os.path.join(settings.BASE_DIR, 'geoip')
        
        db_path = os.path.join(geoip_path, 'GeoLite2-Country.mmdb')
        
        if os.path.exists(db_path):
            with geoip2.database.Reader(db_path) as reader:
                response = reader.country(ip_address)
                return response.country.iso_code or ''
    except ImportError:
        logger.warning("geoip2 library not installed. Install with: pip install geoip2")
    except FileNotFoundError:
        logger.warning(
            "GeoIP database not found. Download from: "
            "https://dev.maxmind.com/geoip/geolite2-free-geolocation-data"
        )
    except Exception as e:
        logger.debug(f"GeoIP lookup failed for {ip_address}: {e}")
    
    return ''


def get_country_name(ip_address):
    """
    دریافت نام کشور از IP
    
    Args:
        ip_address: آدرس IP
        
    Returns:
        str: نام کشور (مثلاً 'Iran', 'United States')
    """
    if not ip_address or ip_address in ['127.0.0.1', 'localhost', '::1']:
        return ''
    
    try:
        from django.contrib.gis.geoip2 import GeoIP2
        
        g = GeoIP2()
        country_data = g.country(ip_address)
        return country_data.get('country_name', '')
    except Exception:
        pass
    
    try:
        import geoip2.database
        from django.conf import settings
        import os
        
        geoip_path = getattr(settings, 'GEOIP_PATH', None)
        if not geoip_path:
            geoip_path = os.path.join(settings.BASE_DIR, 'geoip')
        
        db_path = os.path.join(geoip_path, 'GeoLite2-Country.mmdb')
        
        if os.path.exists(db_path):
            with geoip2.database.Reader(db_path) as reader:
                response = reader.country(ip_address)
                return response.country.name or ''
    except Exception as e:
        logger.debug(f"GeoIP name lookup failed for {ip_address}: {e}")
    
    return ''
