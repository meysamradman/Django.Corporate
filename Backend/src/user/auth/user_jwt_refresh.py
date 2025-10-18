from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.settings import api_settings as simple_jwt_settings
from django.conf import settings
# Remove APIResponse import since we're using standard DRF Response

from rest_framework import status
from rest_framework.response import Response
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
            # Use standard DRF Response - renderer will format it
            response = Response({
                "detail": AUTH_ERRORS.get("auth_invalid_token", "Invalid token.")
            }, status=status.HTTP_401_UNAUTHORIZED)
            return response

        # Manually create the serializer with the token from the cookie
        serializer = self.get_serializer(data={'refresh': raw_token})

        try:
            serializer.is_valid(raise_exception=True)
        except TokenError as e:
            error_detail = AUTH_ERRORS.get("auth_token_expired", str(e))
            # Use standard DRF Response - renderer will format it
            response = Response({
                "detail": error_detail
            }, status=status.HTTP_401_UNAUTHORIZED)
            return response
        except Exception as e:
            error_detail = AUTH_ERRORS.get("auth_invalid_token", "Invalid token provided.")
            # Log the actual exception for debugging
            print(f"!!! UserJWTRefreshView Validation Error: {e}")
            # Use standard DRF Response - renderer will format it
            response = Response({
                "detail": error_detail
            }, status=status.HTTP_401_UNAUTHORIZED)
            return response

        # Success Case
        validated_data = serializer.validated_data
        access_token = validated_data['access']
        
        # Prepare response data
        response_data = {'access': access_token}

        # Use standard DRF Response - renderer will format it
        response = Response(response_data, status=status.HTTP_200_OK)

        # Set cookies for users
        new_refresh_token = validated_data.get('refresh')
        refresh_token_to_set = new_refresh_token if new_refresh_token else raw_token

        UserCookie.set_auth_cookies(
            response=response,
            access_token=access_token,
            refresh_token=refresh_token_to_set
        )

        return response