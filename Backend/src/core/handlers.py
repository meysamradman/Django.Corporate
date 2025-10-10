from datetime import datetime
from rest_framework.views import exception_handler
from rest_framework import status
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from django.http import JsonResponse

def custom_exception_handler(exc, context):
    """Optimized exception handler for React admin panel"""
    from src.user.messages import AUTH_ERRORS
    
    response = exception_handler(exc, context)

    if response is None:
        return None

    status_code = getattr(response, 'status_code', status.HTTP_400_BAD_REQUEST)

    error_message = str(exc)
    error_data = getattr(response, 'data', {'detail': error_message})

    if isinstance(exc, (TokenError, InvalidToken)):

        if 'token_not_valid' in str(error_data) or 'token is expired' in error_message.lower():
            token_expired_msg = AUTH_ERRORS.get("auth_token_expired")
            if token_expired_msg:
                error_message = str(token_expired_msg)
            else:
                error_message = "Token has expired or is no longer valid"
        else:
            auth_invalid_token = AUTH_ERRORS.get("auth_invalid_token")
            if auth_invalid_token:
                error_message = str(auth_invalid_token)
            else:
                error_message = "Invalid token"
    
    elif status_code == status.HTTP_401_UNAUTHORIZED:
        auth_invalid_credentials = AUTH_ERRORS.get("auth_invalid_credentials")
        if auth_invalid_credentials:
            error_message = str(auth_invalid_credentials)
        else:
            error_message = "Invalid credentials"
    
    elif status_code == status.HTTP_403_FORBIDDEN:
        auth_not_authorized = AUTH_ERRORS.get("auth_not_authorized")
        if auth_not_authorized:
            error_message = str(auth_not_authorized)
        else:
            error_message = "You are not authorized to perform this action"
    
    elif status_code == status.HTTP_404_NOT_FOUND:
        not_found = AUTH_ERRORS.get("not_found")
        if not_found:
            error_message = str(not_found)
        else:
            error_message = "Resource not found"
    
    elif status_code == status.HTTP_400_BAD_REQUEST and hasattr(response, 'data'):
        auth_validation_error = AUTH_ERRORS.get("auth_validation_error")
        if auth_validation_error:
            error_message = str(auth_validation_error)
        else:
            error_message = "Validation error"

    # Optimized response structure for React admin panel
    standardized_response = {
        "metaData": {
            "status": "error",
            "message": error_message,
            "AppStatusCode": status_code,
            "timestamp": datetime.utcnow().isoformat()
        },
        "data": error_data
    }
    
    return JsonResponse(standardized_response, status=status_code) 