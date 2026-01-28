from django.core.exceptions import ValidationError
from django.core.validators import validate_email

from src.user.messages import AUTH_ERRORS

def validate_email_address(value):
    try:
        validate_email(value)
        return value
    except ValidationError:
        raise ValidationError(AUTH_ERRORS["auth_identifier_error"])