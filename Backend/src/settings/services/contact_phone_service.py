from django.core.exceptions import ValidationError
from src.settings.models import ContactPhone


def get_contact_phones(filters=None, ordering=None):
    queryset = ContactPhone.objects.all()
    
    if filters:
        if 'is_active' in filters:
            queryset = queryset.filter(is_active=filters['is_active'])
    
    if ordering:
        queryset = queryset.order_by(*ordering)
    else:
        queryset = queryset.order_by('order', '-created_at')
    
    return queryset


def create_contact_phone(validated_data):
    return ContactPhone.objects.create(**validated_data)


def get_contact_phone_by_id(phone_id):
    try:
        return ContactPhone.objects.get(id=phone_id)
    except ContactPhone.DoesNotExist:
        raise ContactPhone.DoesNotExist("Contact phone not found")


def update_contact_phone(instance, validated_data):
    for field, value in validated_data.items():
        setattr(instance, field, value)
    
    instance.save()
    return instance


def delete_contact_phone(instance):
    instance.delete()
