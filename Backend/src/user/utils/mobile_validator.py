from django.core.exceptions import ValidationError
from src.user.messages import AUTH_ERRORS


def validate_mobile_number(value):

    value = value.strip().replace(" ", "")

    if value.isdigit() and len(value) == 11:
        if not value.startswith("09"):
            raise ValidationError(AUTH_ERRORS["auth_invalid_mobile"])
        return value

    raise ValidationError(AUTH_ERRORS["auth_identifier_error"])

