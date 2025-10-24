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
        fields = ['id', 'public_id', 'full_name', 'mobile', 'email', 'is_active', 'created_at', 'updated_at', 'profile']

class UserDetailSerializer(BaseUserDetailSerializer):
    """
    Serializer for Regular User Detail View
    ✅ فقط اطلاعات پایه یوزر + profile
    ❌ بدون permissions (چون یوزر معمولیه، نه ادمین)
    
    ⚠️ WARNING: این serializer فقط برای یوزرهای معمولی هست!
    برای ادمین‌ها از AdminDetailSerializer استفاده کن.
    """
    profile = UserProfileSerializer(source='user_profile', read_only=True)
    full_name = serializers.SerializerMethodField()

    class Meta(BaseUserDetailSerializer.Meta):
        fields = ['id', 'public_id', 'email', 'mobile', 'is_active', 'is_staff', 'is_superuser',
                 'created_at', 'updated_at', 'profile', 'full_name']
    
    def get_full_name(self, obj):
        """
        Generate full name from user profile
        اگه first_name و last_name داشت، ترکیبشون رو برمی‌گردونه
        اگه نداشت، mobile یا email رو به عنوان fallback برمی‌گردونه
        """
        if obj.user_type == 'user' and hasattr(obj, 'user_profile') and obj.user_profile:
            profile = obj.user_profile
            if profile.first_name and profile.last_name:
                return f"{profile.first_name} {profile.last_name}"
        
        # Fallback to identifier (برای یوزرهای بدون پروفایل کامل)
        return obj.mobile or obj.email or str(obj.id)
    
    def to_representation(self, instance):
        """
        Override to_representation to prevent AdminDetailSerializer from adding permissions
        این method برای جلوگیری از اضافه شدن فیلد permissions از AdminDetailSerializer
        """
        data = super().to_representation(instance)
        
        # ✅ اطمینان از اینکه فیلد permissions اضافه نشه
        data.pop('permissions', None)
        
        return data

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
