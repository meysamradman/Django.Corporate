from .mobile_validator import validate_mobile_number
from .email_validator import validate_email_address
from src.user.messages import AUTH_ERRORS

def validate_identifier(identifier):

    identifier = identifier.strip()

    if not identifier:
        raise ValueError(AUTH_ERRORS["auth_identifier_empty"])

    if "@" in identifier:
        email = validate_email_address(identifier)
        return email, None

    mobile = validate_mobile_number(identifier)
    return None, mobile