def get_country_from_ip(ip_address):
    if not ip_address or ip_address in ['127.0.0.1', 'localhost', '::1']:
        return ''
    
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
                return response.country.iso_code or ''
    except ImportError:
        pass
    except FileNotFoundError:
        pass
    except Exception as e:
        pass
    
    return ''

def get_country_name(ip_address):
    if not ip_address or ip_address in ['127.0.0.1', 'localhost', '::1']:
        return ''
    
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
        pass
    
    return ''
