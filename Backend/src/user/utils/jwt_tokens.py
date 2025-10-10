from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.cache import cache
from datetime import timedelta

from src.user.messages import AUTH_ERRORS


def generate_jwt_tokens(user):
    """
    Generate JWT access and refresh tokens for users
    """
    if not user:
        raise AuthenticationFailed(AUTH_ERRORS["auth_invalid_token"])
    
    # Ensure this is for users only
    if user.user_type != 'user':
        raise AuthenticationFailed("JWT tokens are only for users")

    refresh = RefreshToken.for_user(user)
    return {
        "access_token": str(refresh.access_token),
        "refresh_token": str(refresh),
    }


def blacklist_jwt_token(token):
    """
    Blacklist JWT refresh token and cache the result
    """
    try:
        refresh_token = RefreshToken(token)
        refresh_token.blacklist()
        
        # Cache the blacklisted tokens
        access_token = refresh_token.access_token
        expiration_time = access_token.lifetime.total_seconds()
        cache.set(f"blacklisted_access_{token}", True, timeout=expiration_time)
        cache.set(f"blacklisted_{token}", True, timeout=timedelta(days=7).total_seconds())
        
        return True
    except Exception:
        return False


def is_jwt_token_blacklisted(token):
    """
    Check if JWT token is blacklisted
    """
    return (
        cache.get(f"blacklisted_{token}") or 
        cache.get(f"blacklisted_access_{token}")
    )
