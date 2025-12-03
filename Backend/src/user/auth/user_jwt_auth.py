from rest_framework_simplejwt.authentication import JWTAuthentication
from django.conf import settings

class UserJWTAuthentication(JWTAuthentication):

    def authenticate(self, request):
        header_auth = super().authenticate(request)
        if header_auth:
            return header_auth

        raw_token = request.COOKIES.get(settings.SIMPLE_JWT.get('AUTH_COOKIE', 'auth_token'))
        if raw_token:
            try:
                validated_token = self.get_validated_token(raw_token)
                user = self.get_user(validated_token)
                
                if user and user.user_type == 'user':
                    return (user, validated_token)
            except Exception:
                pass
        return None
