from django.core.exceptions import ValidationError
from rest_framework.exceptions import ValidationError as DRFValidationError

def extract_validation_message(error: ValidationError, fallback: str) -> str:
    if hasattr(error, 'messages') and error.messages:
        return str(error.messages[0])
    if hasattr(error, 'message_dict') and error.message_dict:
        first_key = next(iter(error.message_dict), None)
        if first_key and error.message_dict[first_key]:
            return str(error.message_dict[first_key][0])
    return str(error) if str(error) else fallback

def normalize_validation_error(error) -> dict:
    if isinstance(error, DRFValidationError):
        detail = error.detail
        if isinstance(detail, dict):
            return detail
        if isinstance(detail, list):
            return {'non_field_errors': detail}
        return {'non_field_errors': [str(detail)]}

    if isinstance(error, ValidationError):
        if hasattr(error, 'message_dict') and error.message_dict:
            return error.message_dict
        if hasattr(error, 'messages') and error.messages:
            return {'non_field_errors': error.messages}
        return {'non_field_errors': [str(error)]}

    return {'non_field_errors': [str(error)]}
