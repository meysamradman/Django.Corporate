from rest_framework import serializers
from src.user.models import User
from src.user.serializers.user.user_profile_serializer import UserProfileSerializer, UserProfileUpdateSerializer
from src.user.utils.email_validator import validate_email_address
from src.user.utils.mobile_validator import validate_mobile_number
from src.user.messages import AUTH_ERRORS

class UserListSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(source='user_profile', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'public_id', 'mobile', 'email', 'is_active', 'created_at', 'updated_at', 'profile']

class UserDetailSerializer(serializers.ModelSerializer):
    """
    Serializer for regular user detail responses.
    Provides only basic user data plus profile information.
    Admin-specific permission data must be handled by AdminDetailSerializer.
    """
    profile = UserProfileSerializer(source='user_profile', read_only=True)
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'public_id', 'email', 'mobile', 'is_active', 'is_staff', 'is_superuser',
                 'created_at', 'updated_at', 'profile', 'full_name']
    
    def get_full_name(self, obj):
        """
        Generate a human-readable full name using profile data,
        falling back to identifier fields when necessary.
        """
        if obj.user_type == 'user' and hasattr(obj, 'user_profile') and obj.user_profile:
            profile = obj.user_profile
            if profile.first_name and profile.last_name:
                return f"{profile.first_name} {profile.last_name}"
        
        # Fallback to identifier for users without a completed profile
        return obj.mobile or obj.email or str(obj.id)
    
    def to_representation(self, instance):
        """Ensure permission fields are not injected by shared mixins."""
        data = super().to_representation(instance)
        
        # Guard against injected permission field
        data.pop('permissions', None)
        
        return data

class UserUpdateSerializer(serializers.ModelSerializer):
    profile = UserProfileUpdateSerializer(required=False)
    
    class Meta:
        model = User
        fields = ['email', 'mobile', 'is_active', 'profile']
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
    
    def to_internal_value(self, data):
        """Override to pass user_id to profile serializer"""
        # Get user_id for profile validation
        user_id = self.context.get('user_id') or (self.instance.id if self.instance else None)
        
        # Update profile data context if it exists
        if 'profile' in data and isinstance(data['profile'], dict):
            # Create a temporary context for profile validation
            profile_context = self.context.copy()
            profile_context['user_id'] = user_id
            
            # Validate profile data separately
            profile_serializer = UserProfileUpdateSerializer(
                instance=self.instance.user_profile if self.instance and hasattr(self.instance, 'user_profile') else None,
                data=data['profile'],
                context=profile_context
            )
            if not profile_serializer.is_valid():
                raise serializers.ValidationError({'profile': profile_serializer.errors})
        
        return super().to_internal_value(data)
    
    def validate_email(self, value):
        """Validate email format and uniqueness"""
        if value:
            try:
                # Validate email format
                validated_email = validate_email_address(value)
                
                # Check uniqueness (exclude current user)
                user_id = self.context.get('user_id') or (self.instance.id if self.instance else None)
                
                if user_id and User.objects.filter(email=validated_email).exclude(id=user_id).exists():
                    raise serializers.ValidationError(AUTH_ERRORS["auth_email_exists"])
                
                return validated_email
            except Exception as e:
                raise serializers.ValidationError(str(e))
        return value
    
    def validate_mobile(self, value):
        """Validate mobile format and uniqueness"""
        if value:
            try:
                # Validate mobile format
                validated_mobile = validate_mobile_number(value)
                
                # Check uniqueness (exclude current user)
                user_id = self.context.get('user_id') or (self.instance.id if self.instance else None)
                
                if user_id and User.objects.filter(mobile=validated_mobile).exclude(id=user_id).exists():
                    raise serializers.ValidationError(AUTH_ERRORS["auth_mobile_exists"])
                
                return validated_mobile
            except Exception as e:
                raise serializers.ValidationError(str(e))
        return value

class UserFilterSerializer(serializers.Serializer):
    search = serializers.CharField(required=False, allow_blank=True)
    is_active = serializers.BooleanField(required=False, allow_null=True)
    ordering = serializers.ChoiceField(
        choices=['-created_at', 'created_at', '-updated_at', 'updated_at'],
        required=False
    )

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
            raise serializers.ValidationError(AUTH_ERRORS["auth_validation_error"])
        if not all(isinstance(item, int) for item in value):
            raise serializers.ValidationError(AUTH_ERRORS["auth_validation_error"])
        return value