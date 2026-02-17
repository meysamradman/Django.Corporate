from django.core.exceptions import ValidationError
from django.db import transaction
from src.core.cache import CacheService

from src.form.models import ContactFormField
from src.form.messages.messages import FORM_FIELD_ERRORS
from src.form.utils.cache import FormCacheKeys, FormCacheManager
from src.form.utils.cache_admin import FormAdminCacheKeys
from src.form.utils.cache_ttl import FormCacheTTL

def get_contact_form_fields(is_active=None):
    queryset = ContactFormField.objects.all()
    if is_active is not None:
        queryset = queryset.filter(is_active=is_active)
    return queryset.order_by('order', 'field_key')

def get_contact_form_field(field_id=None, public_id=None, field_key=None):
    if field_id:
        cache_key = FormAdminCacheKeys.field_by_id(field_id)
    elif field_key:
        cache_key = FormAdminCacheKeys.field_by_key(field_key)
    else:
        cache_key = None
    
    if cache_key:
        cached_field_id = CacheService.get(cache_key)
        if cached_field_id is not None:
            field = ContactFormField.objects.filter(id=cached_field_id).first()
            if field is not None:
                return field
            CacheService.delete(cache_key)
    
    try:
        if field_id:
            field = ContactFormField.objects.get(id=field_id)
        elif public_id:
            field = ContactFormField.objects.get(public_id=public_id)
        elif field_key:
            field = ContactFormField.objects.get(field_key=field_key)
        else:
            raise ValidationError(FORM_FIELD_ERRORS['field_id_required'])
        
        if cache_key:
            CacheService.set(cache_key, field.id, FormCacheTTL.FIELD_LOOKUP)
        
        return field
    except ContactFormField.DoesNotExist:
        raise ContactFormField.DoesNotExist(FORM_FIELD_ERRORS['field_not_found'])

def get_active_fields_for_platform(platform):
    if platform not in ['website', 'mobile_app']:
        raise ValidationError(FORM_FIELD_ERRORS['invalid_platform'])
    
    return ContactFormField.objects.filter(
        is_active=True,
        platforms__contains=[platform]
    ).order_by('order', 'field_key')

def get_active_fields_for_platform_data(platform, serializer_class):
    cache_key = FormAdminCacheKeys.fields_for_platform(platform)
    cached_data = CacheService.get(cache_key)
    if cached_data is not None:
        return cached_data

    fields = get_active_fields_for_platform(platform)
    serialized_data = serializer_class(fields, many=True).data
    CacheService.set(cache_key, serialized_data, FormCacheTTL.ADMIN_PLATFORM_FIELDS)
    return serialized_data

@transaction.atomic
def create_contact_form_field(validated_data):
    try:
        field = ContactFormField.objects.create(**validated_data)
        FormCacheManager.invalidate_fields()
        return field
    except Exception as e:
        raise ValidationError(FORM_FIELD_ERRORS['field_create_error'].format(error=str(e)))

@transaction.atomic
def update_contact_form_field(field, validated_data):
    try:
        for key, value in validated_data.items():
            setattr(field, key, value)
        field.save()
        FormCacheManager.invalidate_field(field_id=field.id, field_key=field.field_key)
        return field
    except Exception as e:
        raise ValidationError(FORM_FIELD_ERRORS['field_update_error'].format(error=str(e)))

@transaction.atomic
def delete_contact_form_field(field):
    try:
        field_id = field.id
        field_key = field.field_key
        field.delete()
        FormCacheManager.invalidate_field(field_id=field_id, field_key=field_key)
    except Exception as e:
        raise ValidationError(FORM_FIELD_ERRORS['field_delete_error'].format(error=str(e)))

