from django.core.exceptions import ValidationError
from src.settings.models import ContactPhone


def get_contact_phones(filters=None, ordering=None):
    """Get list of contact phones"""
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
    """Create new contact phone"""
    return ContactPhone.objects.create(**validated_data)


def get_contact_phone_by_id(phone_id):
    """Get contact phone by ID"""
    try:
        return ContactPhone.objects.get(id=phone_id)
    except ContactPhone.DoesNotExist:
        raise ContactPhone.DoesNotExist("Contact phone not found")


def update_contact_phone(instance, validated_data):
    """Update contact phone"""
    for field, value in validated_data.items():
        setattr(instance, field, value)
    
    instance.save()
    return instance


def delete_contact_phone(instance):
    """Delete contact phone"""
    instance.delete()
