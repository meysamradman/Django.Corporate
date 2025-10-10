from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.settings import api_settings as simple_jwt_settings
from django.conf import settings
from src.core.responses import APIResponse

from rest_framework import status
from .user_cookies import UserCookie
from src.user.messages import AUTH_ERRORS, AUTH_SUCCESS


class UserJWTRefreshView(TokenRefreshView):
    """
    JWT Token refresh for users (website)
    Reads refresh token from HttpOnly cookie and sets new tokens back to cookies
    """
    
    def post(self, request, *args, **kwargs):
        refresh_token_cookie_name = getattr(settings, 'REFRESH_COOKIE_NAME', 'refresh_token')
        raw_token = request.COOKIES.get(refresh_token_cookie_name)

        if raw_token is None:
            return APIResponse.error(
                message=AUTH_ERRORS.get("auth_invalid_token", "Invalid token."),
                status_code=status.HTTP_401_UNAUTHORIZED
            )

        # Manually create the serializer with the token from the cookie
        serializer = self.get_serializer(data={'refresh': raw_token})

        try:
            serializer.is_valid(raise_exception=True)
        except TokenError as e:
            error_detail = AUTH_ERRORS.get("auth_token_expired", str(e))
            return APIResponse.error(
                message=error_detail,
                status_code=status.HTTP_401_UNAUTHORIZED
            )
        except Exception as e:
            error_detail = AUTH_ERRORS.get("auth_invalid_token", "Invalid token provided.")
            # Log the actual exception for debugging
            print(f"!!! UserJWTRefreshView Validation Error: {e}")
            return APIResponse.error(
                message=error_detail,
                status_code=status.HTTP_401_UNAUTHORIZED
            )

        # Success Case
        validated_data = serializer.validated_data
        access_token = validated_data['access']
        
        # Prepare response data
        response_data = {'access': access_token}

        response = APIResponse.success(
            message=AUTH_SUCCESS.get("auth_token_refreshed", "Token refreshed successfully."),
            data=response_data
        )

        # Set cookies for users
        new_refresh_token = validated_data.get('refresh')
        refresh_token_to_set = new_refresh_token if new_refresh_token else raw_token

        UserCookie.set_auth_cookies(
            response=response,
            access_token=access_token,
            refresh_token=refresh_token_to_set
        )

        return response
