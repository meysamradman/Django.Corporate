from django.core.cache import cache
from src.core.responses import APIResponse
from datetime import timedelta
from src.user.messages import AUTH_SUCCESS, AUTH_ERRORS
from src.user.utils.jwt_tokens import blacklist_jwt_token

class BaseLogoutService:
    @staticmethod
    def logout(user, refresh_token):
        try:
            if blacklist_jwt_token(refresh_token):
                cache.set(
                    f"old_token_{refresh_token}",
                    True,
                    timeout=timedelta(days=7).total_seconds()
                )
                
                response = APIResponse.success(
                    message=AUTH_SUCCESS["auth_logged_out"]
                )
                response.delete_cookie('auth_token')
                response.delete_cookie('refresh_token')
                return response
            else:
                return APIResponse.error(
                    message=AUTH_ERRORS["auth_logout_error"]
                )
        except Exception as e:
            return APIResponse.error(
                message=AUTH_ERRORS["auth_logout_error"]
            ) 