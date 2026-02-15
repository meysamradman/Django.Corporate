from datetime import datetime
from rest_framework.views import exception_handler
from rest_framework import status
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from rest_framework.response import Response

from src.user.messages import AUTH_ERRORS
from src.core.utils.validation_helpers import extract_validation_message

def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is None:
        return None

    status_code = getattr(response, 'status_code', status.HTTP_400_BAD_REQUEST)

    error_message = extract_validation_message(exc, "")
    error_data = getattr(response, 'data', {'detail': error_message})

    if isinstance(exc, (TokenError, InvalidToken)):
        if 'token_not_valid' in str(error_data) or 'token is expired' in error_message.lower():
            error_message = AUTH_ERRORS["auth_token_expired"]
        else:
            error_message = AUTH_ERRORS["auth_invalid_token"]
    
    elif status_code == status.HTTP_401_UNAUTHORIZED:
        error_message = AUTH_ERRORS["auth_invalid_credentials"]
    
    elif status_code == status.HTTP_403_FORBIDDEN:
        error_message = AUTH_ERRORS["auth_not_authorized"]
    
    elif status_code == status.HTTP_404_NOT_FOUND:
        if context and 'request' in context:
            request = context['request']
            if '/export' in request.path:
                pass
        error_message = AUTH_ERRORS["not_found"]
    
    elif status_code == status.HTTP_400_BAD_REQUEST and hasattr(response, 'data'):
        error_message = AUTH_ERRORS["auth_validation_error"]

    response.data = {
        "detail": error_message,
        **error_data
    }
    
    return response