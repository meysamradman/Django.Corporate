from django.core.exceptions import ValidationError
from src.settings.models import ContactEmail
from src.settings.messages.messages import SETTINGS_ERRORS

def get_contact_emails(filters=None, ordering=None):
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
    return ContactEmail.objects.create(**validated_data)

def get_contact_email_by_id(email_id):
    try:
        return ContactEmail.objects.get(id=email_id)
    except ContactEmail.DoesNotExist:
        raise ContactEmail.DoesNotExist(SETTINGS_ERRORS['email_not_found'])

def update_contact_email(instance, validated_data):
    for field, value in validated_data.items():
        setattr(instance, field, value)
    
    instance.save()
    return instance

def delete_contact_email(instance):
    instance.delete()
