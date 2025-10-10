from rest_framework import serializers
from src.user.messages import AUTH_ERRORS
from src.user.utils.jwt_tokens import is_jwt_token_blacklisted

class BaseLogoutSerializer(serializers.Serializer):
    refresh_token = serializers.CharField(required=False, allow_blank=True)

    def validate_refresh_token(self, value):
        if not value and not self.context.get('request').COOKIES.get('refresh_token'):
            raise serializers.ValidationError(AUTH_ERRORS["auth_invalid_token"])
        
        if value and is_jwt_token_blacklisted(value):
            raise serializers.ValidationError(AUTH_ERRORS["auth_invalid_token"])
            
        return value 