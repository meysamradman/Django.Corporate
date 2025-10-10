from rest_framework import serializers
from src.user.serializers import (
    BaseUserListSerializer,
    BaseUserDetailSerializer,
    BaseUserUpdateSerializer,
    BaseUserFilterSerializer
)
from src.user.serializers.base_profile_serializer import UserProfileSerializer, UserProfileUpdateSerializer
from src.user.messages import AUTH_ERRORS

class UserListSerializer(BaseUserListSerializer):
    profile = UserProfileSerializer(source='user_profile', read_only=True)

    class Meta(BaseUserListSerializer.Meta):
        fields = ['id', 'public_id', 'email', 'mobile', 'is_active', 'created_at', 'profile', 'full_name']

class UserDetailSerializer(BaseUserDetailSerializer):
    profile = UserProfileSerializer(source='user_profile', read_only=True)

    class Meta(BaseUserDetailSerializer.Meta):
        fields = ['id', 'public_id', 'email', 'mobile', 'is_active', 'created_at', 'updated_at', 'profile']

class UserUpdateSerializer(BaseUserUpdateSerializer):
    profile = UserProfileUpdateSerializer(required=False)

class UserFilterSerializer(BaseUserFilterSerializer):
    pass

# UserCreateSerializer removed - use UserRegisterByAdminSerializer instead

class BulkDeleteSerializer(serializers.Serializer):
    ids = serializers.ListField(
        child=serializers.IntegerField(),
        allow_empty=False,
        min_length=1,
        help_text="List of numeric User IDs to delete."
    )

    def validate_ids(self, value):
        if not value:
            raise serializers.ValidationError("List of IDs cannot be empty.")
        if not all(isinstance(item, int) for item in value):
            raise serializers.ValidationError("All items in the list must be integers.")
        return value
