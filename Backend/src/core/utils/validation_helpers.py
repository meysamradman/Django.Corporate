from django.core.exceptions import ValidationError


def extract_validation_message(error: ValidationError, fallback: str) -> str:
    if hasattr(error, 'messages') and error.messages:
        return str(error.messages[0])
    return str(error) if str(error) else fallback
