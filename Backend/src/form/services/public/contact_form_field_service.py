from src.core.cache import CacheService
from src.form.serializers.public import PublicContactFormFieldSerializer
from src.form.services.admin.contact_form_field_service import get_active_fields_for_platform
from src.form.utils.cache_public import FormPublicCacheKeys
from src.form.utils.cache_ttl import FormCacheTTL


def get_public_contact_form_fields(platform):
    return get_active_fields_for_platform(platform)


def get_public_contact_form_fields_data(platform):
    cache_key = FormPublicCacheKeys.fields_for_platform(platform)
    cached_data = CacheService.get(cache_key)
    if cached_data is not None:
        return cached_data

    fields = get_active_fields_for_platform(platform)
    serialized_data = PublicContactFormFieldSerializer(fields, many=True).data
    CacheService.set(cache_key, serialized_data, FormCacheTTL.PUBLIC_FIELDS_LIST)
    return serialized_data


__all__ = [
    'get_public_contact_form_fields',
    'get_public_contact_form_fields_data',
]
