from src.form.services.admin.contact_form_submission_service import create_contact_form_submission

def create_public_contact_form_submission(validated_data, request=None):
    return create_contact_form_submission(validated_data, request=request)

__all__ = [
    'create_public_contact_form_submission',
]
