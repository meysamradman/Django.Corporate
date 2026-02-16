from django.core.exceptions import ValidationError
from src.settings.models import ContactMobile
from src.settings.messages.messages import SETTINGS_ERRORS

def get_contact_mobiles(filters=None, ordering=None):
    queryset = ContactMobile.objects.all()
    
    if filters:
        if 'is_active' in filters:
            queryset = queryset.filter(is_active=filters['is_active'])
    
    if ordering:
        queryset = queryset.order_by(*ordering)
    else:
        queryset = queryset.order_by('order', '-created_at')
    
    return queryset

def create_contact_mobile(validated_data):
    return ContactMobile.objects.create(**validated_data)

def get_contact_mobile_by_id(mobile_id):
    try:
        return ContactMobile.objects.get(id=mobile_id)
    except ContactMobile.DoesNotExist:
        raise ContactMobile.DoesNotExist(SETTINGS_ERRORS['mobile_not_found'])

def update_contact_mobile(instance, validated_data):
    for field, value in validated_data.items():
        setattr(instance, field, value)
    
    instance.save()
    return instance

def delete_contact_mobile(instance):
    instance.delete()
