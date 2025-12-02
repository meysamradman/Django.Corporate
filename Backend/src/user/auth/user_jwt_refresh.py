from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.settings import api_settings as simple_jwt_settings
from django.conf import settings
from rest_framework import status
from rest_framework.response import Response
from .user_cookies import UserCookie
from src.user.messages import AUTH_ERRORS, AUTH_SUCCESS
from src.core.responses.response import APIResponse

class UserJWTRefreshView(TokenRefreshView):
    
    def post(self, request, *args, **kwargs):
        refresh_token_cookie_name = getattr(settings, 'REFRESH_COOKIE_NAME', 'refresh_token')
        raw_token = request.COOKIES.get(refresh_token_cookie_name)

        if raw_token is None:
            return APIResponse.error(
                message=AUTH_ERRORS.get("auth_invalid_token"),
                status_code=status.HTTP_401_UNAUTHORIZED
            )

        serializer = self.get_serializer(data={'refresh': raw_token})

        try:
            serializer.is_valid(raise_exception=True)
        except TokenError:
            return APIResponse.error(
                message=AUTH_ERRORS.get("auth_token_expired"),
                status_code=status.HTTP_401_UNAUTHORIZED
            )
        except Exception:
            return APIResponse.error(
                message=AUTH_ERRORS.get("auth_invalid_token"),
                status_code=status.HTTP_401_UNAUTHORIZED
            )

        validated_data = serializer.validated_data
        access_token = validated_data['access']
        
        response_data = {'access': access_token}

        new_refresh_token = validated_data.get('refresh')
        refresh_token_to_set = new_refresh_token if new_refresh_token else raw_token

        response = APIResponse.success(
            message=AUTH_SUCCESS.get("token_refreshed", "Token refreshed successfully"),
            data=response_data,
            status_code=status.HTTP_200_OK
        )

        UserCookie.set_auth_cookies(
            response=response,
            access_token=access_token,
            refresh_token=refresh_token_to_set
        )

        return response