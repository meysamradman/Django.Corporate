from django.core.exceptions import ValidationError
from src.settings.models import ContactEmail


def get_contact_emails(filters=None, ordering=None):
    """Get list of contact emails"""
    queryset = ContactEmail.objects.all()
    
    if filters:
        if 'is_active' in filters:
            queryset = queryset.filter(is_active=filters['is_active'])
    
    if ordering:
        queryset = queryset.order_by(*ordering)
    else:
        queryset = queryset.order_by('order', '-created_at')
    
    return queryset


def create_contact_email(validated_data):
    """Create new contact email"""
    return ContactEmail.objects.create(**validated_data)


def get_contact_email_by_id(email_id):
    """Get contact email by ID"""
    try:
        return ContactEmail.objects.get(id=email_id)
    except ContactEmail.DoesNotExist:
        raise ContactEmail.DoesNotExist("Contact email not found")


def update_contact_email(instance, validated_data):
    """Update contact email"""
    for field, value in validated_data.items():
        setattr(instance, field, value)
    
    instance.save()
    return instance


def delete_contact_email(instance):
    """Delete contact email"""
    instance.delete()
