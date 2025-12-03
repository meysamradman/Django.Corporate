from django.core.cache import cache


class FormCacheKeys:
    
    @staticmethod
    def fields_for_platform(platform):
        return f"form_fields_platform_{platform}"
    
    @staticmethod
    def all_fields():
        return "form_fields_all"
    
    @staticmethod
    def active_fields():
        return "form_fields_active"
    
    @staticmethod
    def field_by_key(field_key):
        return f"form_field_key_{field_key}"
    
    @staticmethod
    def field_by_id(field_id):
        return f"form_field_id_{field_id}"
    
    @staticmethod
    def all_keys(platform=None):
        keys = [
            FormCacheKeys.all_fields(),
            FormCacheKeys.active_fields(),
        ]
        if platform:
            keys.append(FormCacheKeys.fields_for_platform(platform))
        return keys


class FormCacheManager:
    
    @staticmethod
    def invalidate_fields():
        cache.delete(FormCacheKeys.all_fields())
        cache.delete(FormCacheKeys.active_fields())
        try:
            cache.delete_pattern("form_fields_platform_*")
        except (AttributeError, NotImplementedError):
            pass
    
    @staticmethod
    def invalidate_field(field_id=None, field_key=None):
        if field_id:
            cache.delete(FormCacheKeys.field_by_id(field_id))
        if field_key:
            cache.delete(FormCacheKeys.field_by_key(field_key))
        FormCacheManager.invalidate_fields()
    
    @staticmethod
    def invalidate_platform(platform):
        cache.delete(FormCacheKeys.fields_for_platform(platform))
        FormCacheManager.invalidate_fields()

