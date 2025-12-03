from django.core.exceptions import ValidationError
from django.db import transaction

from src.form.models import ContactFormField


def get_contact_form_fields(is_active=None):
    queryset = ContactFormField.objects.all()
    if is_active is not None:
        queryset = queryset.filter(is_active=is_active)
    return queryset.order_by('order', 'field_key')


def get_contact_form_field(field_id=None, public_id=None, field_key=None):
    try:
        if field_id:
            return ContactFormField.objects.get(id=field_id)
        elif public_id:
            return ContactFormField.objects.get(public_id=public_id)
        elif field_key:
            return ContactFormField.objects.get(field_key=field_key)
        else:
            raise ValidationError("One of field_id, public_id or field_key must be provided")
    except ContactFormField.DoesNotExist:
        raise ContactFormField.DoesNotExist("Form field not found")


def get_active_fields_for_platform(platform):
    if platform not in ['website', 'mobile_app']:
        raise ValidationError("Invalid platform. Must be 'website' or 'mobile_app'")
    return ContactFormField.objects.filter(
        is_active=True,
        platforms__contains=[platform]
    ).order_by('order', 'field_key')


@transaction.atomic
def create_contact_form_field(validated_data):
    try:
        field = ContactFormField.objects.create(**validated_data)
        return field
    except Exception as e:
        raise ValidationError(f"Error creating field: {str(e)}")


@transaction.atomic
def update_contact_form_field(field, validated_data):
    try:
        for key, value in validated_data.items():
            setattr(field, key, value)
        field.save()
        return field
    except Exception as e:
        raise ValidationError(f"Error updating field: {str(e)}")


@transaction.atomic
def delete_contact_form_field(field):
    try:
        field.delete()
    except Exception as e:
        raise ValidationError(f"Error deleting field: {str(e)}")

