import re
from django.core.exceptions import ValidationError

from src.user.messages import AUTH_ERRORS


def validate_login_password(value):
    if value is None:
        raise ValidationError(AUTH_ERRORS["auth_password_empty"])
    value = value.strip()
    if not value:
        raise ValidationError(AUTH_ERRORS["auth_password_empty"])
    return value

def validate_register_password(value):
    if value is None:
        raise ValidationError(AUTH_ERRORS["auth_password_empty"])
    value = value.strip()

    if not value:
        raise ValidationError(AUTH_ERRORS["auth_password_empty"])

    if len(value) < 6:
        raise ValidationError(AUTH_ERRORS["auth_weak_password"])

    if not re.search(r"\d", value):
        raise ValidationError(AUTH_ERRORS["auth_password_must_contain_number"])

    if not re.search(r"[A-Z]", value):
        raise ValidationError(AUTH_ERRORS["auth_password_must_contain_uppercase"])

    return value
