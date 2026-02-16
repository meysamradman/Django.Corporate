from src.form.services.admin.contact_form_field_service import get_active_fields_for_platform


def get_public_contact_form_fields(platform):
    return get_active_fields_for_platform(platform)


__all__ = [
    'get_public_contact_form_fields',
]
