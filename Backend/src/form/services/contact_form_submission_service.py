import re

from django.core.exceptions import ValidationError
from django.db import transaction

from src.form.models import ContactFormField
from src.form.messages.messages import FORM_SUBMISSION_ERRORS
from src.email.models.email_message import EmailMessage


def validate_form_submission(form_data, platform):
    if not isinstance(form_data, dict):
        raise ValidationError(FORM_SUBMISSION_ERRORS['validation_error'])
    if platform not in ['website', 'mobile_app']:
        raise ValidationError(FORM_SUBMISSION_ERRORS['invalid_platform'])
    fields = ContactFormField.objects.filter(
        is_active=True,
        platforms__contains=[platform]
    ).order_by('order')
    errors = {}
    for field in fields:
        field_key = field.field_key
        value = form_data.get(field_key)
        if field.required:
            if not value or (isinstance(value, str) and not value.strip()):
                errors[field_key] = FORM_SUBMISSION_ERRORS['validation_error']
        if value:
            if field.field_type == 'email':
                if '@' not in str(value):
                    errors[field_key] = FORM_SUBMISSION_ERRORS['validation_error']
            elif field.field_type == 'phone':
                if not str(value).replace(' ', '').replace('-', '').isdigit():
                    errors[field_key] = FORM_SUBMISSION_ERRORS['validation_error']
            elif field.field_type == 'number':
                try:
                    float(value)
                except (ValueError, TypeError):
                    errors[field_key] = FORM_SUBMISSION_ERRORS['validation_error']
            elif field.field_type in ['select', 'radio']:
                valid_options = [opt['value'] for opt in (field.options or [])]
                if value not in valid_options:
                    errors[field_key] = FORM_SUBMISSION_ERRORS['validation_error']
            if field.validation_rules:
                rules = field.validation_rules
                value_str = str(value)
                if 'min_length' in rules and len(value_str) < rules['min_length']:
                    errors[field_key] = FORM_SUBMISSION_ERRORS['validation_error']
                if 'max_length' in rules and len(value_str) > rules['max_length']:
                    errors[field_key] = FORM_SUBMISSION_ERRORS['validation_error']
                if 'pattern' in rules:
                    if not re.match(rules['pattern'], value_str):
                        errors[field_key] = FORM_SUBMISSION_ERRORS['validation_error']
    return {
        'valid': len(errors) == 0,
        'errors': errors
    }


@transaction.atomic
def create_contact_form_submission(validated_data):
    try:
        validation_result = validate_form_submission(
            validated_data.get('form_data', {}),
            validated_data.get('platform', 'website')
        )
        if not validation_result['valid']:
            raise ValidationError(validation_result['errors'])
        form_data = validated_data.get('form_data', {})
        platform = validated_data.get('platform', 'website')
        default_name = 'Unknown'
        name = default_name
        email = ''
        phone = ''
        fields = ContactFormField.objects.filter(
            is_active=True,
            platforms__contains=[platform]
        )
        for field in fields:
            field_key = field.field_key
            value = form_data.get(field_key, '')
            if field.field_type == 'email' and not email:
                email = str(value) if value else ''
            elif field.field_type == 'phone' and not phone:
                phone = str(value) if value else ''
            elif field.field_key == 'name' and name == default_name:
                name = str(value) if value else default_name
        if name == default_name:
            name = form_data.get('name', default_name)
        if not email:
            email = form_data.get('email', '')
        if not phone:
            phone = form_data.get('phone', '')
        subject_parts = []
        message_lines = []
        for field in fields:
            field_key = field.field_key
            value = form_data.get(field_key, '')
            if value and field_key not in ['name', 'email', 'phone']:
                if len(subject_parts) < 3:
                    subject_parts.append(f"{field.label}: {str(value)[:50]}")
                message_lines.append(f"{field.label}: {str(value)}")
        default_subject = 'New Contact Form'
        subject = ' | '.join(subject_parts) if subject_parts else default_subject
        if len(subject) > 300:
            subject = subject[:297] + '...'
        message = '\n'.join(message_lines) if message_lines else str(form_data)
        default_email = 'no-email@example.com'
        if not email:
            email = default_email
        email_message = EmailMessage.objects.create(
            name=name,
            email=email,
            phone=phone if phone else None,
            subject=subject,
            message=message,
            source=platform,
            status='new',
            ip_address=validated_data.get('ip_address'),
            user_agent=validated_data.get('user_agent'),
        )
        return email_message
    except ValidationError:
        raise
    except Exception as e:
        raise ValidationError(FORM_SUBMISSION_ERRORS['submission_create_failed'])
