from rest_framework import status

from src.ai.messages.messages import AI_ERRORS


_DIRECT_STATUS_MAP = {
    AI_ERRORS["generic_api_key_invalid"]: status.HTTP_401_UNAUTHORIZED,
    AI_ERRORS["api_key_invalid"]: status.HTTP_401_UNAUTHORIZED,
    AI_ERRORS["generic_rate_limit"]: status.HTTP_429_TOO_MANY_REQUESTS,
    AI_ERRORS["generic_quota_exceeded"]: status.HTTP_429_TOO_MANY_REQUESTS,
    AI_ERRORS["provider_limit_exceeded"]: status.HTTP_429_TOO_MANY_REQUESTS,
    AI_ERRORS["image_rate_limit"]: status.HTTP_429_TOO_MANY_REQUESTS,
    AI_ERRORS["image_quota_exceeded"]: status.HTTP_429_TOO_MANY_REQUESTS,
    AI_ERRORS["generic_timeout"]: status.HTTP_504_GATEWAY_TIMEOUT,
    AI_ERRORS["image_timeout"]: status.HTTP_504_GATEWAY_TIMEOUT,
    AI_ERRORS["provider_access_blocked"]: status.HTTP_403_FORBIDDEN,
    AI_ERRORS["provider_api_inactive"]: status.HTTP_400_BAD_REQUEST,
    AI_ERRORS["provider_server_unreachable"]: status.HTTP_503_SERVICE_UNAVAILABLE,
    AI_ERRORS["provider_model_paid_required"]: status.HTTP_402_PAYMENT_REQUIRED,
    AI_ERRORS["generic_model_not_found"]: status.HTTP_404_NOT_FOUND,
    AI_ERRORS["model_not_found"]: status.HTTP_404_NOT_FOUND,
    AI_ERRORS["provider_not_available"]: status.HTTP_404_NOT_FOUND,
    AI_ERRORS["invalid_json"]: status.HTTP_400_BAD_REQUEST,
    AI_ERRORS["json_parse_error"]: status.HTTP_400_BAD_REQUEST,
}


def map_ai_exception(exception: Exception, fallback_message: str, domain: str = "generic") -> tuple[str, int]:
    raw_message = str(exception).strip()
    error_message = raw_message.lower()

    if raw_message in _DIRECT_STATUS_MAP:
        return raw_message, _DIRECT_STATUS_MAP[raw_message]

    if 'quota' in error_message or 'billing' in error_message or 'credit' in error_message or '429' in error_message:
        if domain == "image":
            return AI_ERRORS["image_quota_exceeded"], status.HTTP_429_TOO_MANY_REQUESTS
        return AI_ERRORS["generic_quota_exceeded"], status.HTTP_429_TOO_MANY_REQUESTS

    if 'api key' in error_message or 'unauthorized' in error_message or 'authentication' in error_message or '401' in error_message:
        if domain == "image":
            return AI_ERRORS["api_key_invalid"], status.HTTP_401_UNAUTHORIZED
        return AI_ERRORS["generic_api_key_invalid"], status.HTTP_401_UNAUTHORIZED

    if 'rate limit' in error_message or 'too many requests' in error_message:
        if domain == "image":
            return AI_ERRORS["image_rate_limit"], status.HTTP_429_TOO_MANY_REQUESTS
        return AI_ERRORS["generic_rate_limit"], status.HTTP_429_TOO_MANY_REQUESTS

    if 'timeout' in error_message:
        if domain == "image":
            return AI_ERRORS["image_timeout"], status.HTTP_504_GATEWAY_TIMEOUT
        return AI_ERRORS["generic_timeout"], status.HTTP_504_GATEWAY_TIMEOUT

    if (
        ('model' in error_message and 'not found' in error_message)
        or ('not a valid model id' in error_message)
        or ('valid model id' in error_message)
        or ('model' in error_message and 'invalid' in error_message)
    ):
        if domain == "image":
            return AI_ERRORS["model_not_found"], status.HTTP_404_NOT_FOUND
        return AI_ERRORS["generic_model_not_found"], status.HTTP_404_NOT_FOUND

    if 'not found' in error_message and 'provider' in error_message:
        return AI_ERRORS["provider_not_available"], status.HTTP_404_NOT_FOUND

    return fallback_message, status.HTTP_500_INTERNAL_SERVER_ERROR
