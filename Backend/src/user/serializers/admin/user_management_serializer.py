from rest_framework import serializers
from src.user.models import User
from src.user.serializers.user.user_profile_serializer import UserProfileSerializer, UserProfileUpdateSerializer
from src.user.utils.email_validator import validate_email_address
from src.user.utils.mobile_validator import validate_mobile_number
from src.core.utils.validation_helpers import extract_validation_message
from src.user.messages import AUTH_ERRORS

class UserListSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(source='user_profile', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'public_id', 'mobile', 'email', 'is_active', 'created_at', 'updated_at', 'profile']

class UserDetailSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(source='user_profile', read_only=True)
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'public_id', 'email', 'mobile', 'is_active', 'is_staff', 'is_superuser',
                 'created_at', 'updated_at', 'profile', 'full_name']
    
    def get_full_name(self, obj):
        if obj.user_type == 'user' and hasattr(obj, 'user_profile') and obj.user_profile:
            profile = obj.user_profile
            if profile.first_name and profile.last_name:
                return f"{profile.first_name} {profile.last_name}"
        
        return obj.mobile or obj.email or str(obj.id)
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        
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
        user_id = self.context.get('user_id') or (self.instance.id if self.instance else None)
        
        if 'profile' in data and isinstance(data['profile'], dict):
            profile_context = self.context.copy()
            profile_context['user_id'] = user_id
            
            profile_serializer = UserProfileUpdateSerializer(
                instance=self.instance.user_profile if self.instance and hasattr(self.instance, 'user_profile') else None,
                data=data['profile'],
                context=profile_context
            )
            if not profile_serializer.is_valid():
                raise serializers.ValidationError({'profile': profile_serializer.errors})
        
        return super().to_internal_value(data)
    
    def validate_email(self, value):
        if value:
            try:
                validated_email = validate_email_address(value)
                
                user_id = self.context.get('user_id') or (self.instance.id if self.instance else None)
                
                if user_id and User.objects.filter(email=validated_email).exclude(id=user_id).exists():
                    raise serializers.ValidationError(AUTH_ERRORS["auth_email_exists"])
                
                return validated_email
            except Exception as e:
                raise serializers.ValidationError(
                    extract_validation_message(e, AUTH_ERRORS.get("auth_invalid_email"))
                )
        return value
    
    def validate_mobile(self, value):
        if value:
            try:
                validated_mobile = validate_mobile_number(value)
                
                user_id = self.context.get('user_id') or (self.instance.id if self.instance else None)
                
                if user_id and User.objects.filter(mobile=validated_mobile).exclude(id=user_id).exists():
                    raise serializers.ValidationError(AUTH_ERRORS["auth_mobile_exists"])
                
                return validated_mobile
            except Exception as e:
                raise serializers.ValidationError(
                    extract_validation_message(e, AUTH_ERRORS.get("auth_invalid_mobile"))
                )
        return value

class UserFilterSerializer(serializers.Serializer):
    search = serializers.CharField(required=False, allow_blank=True)
    is_active = serializers.BooleanField(required=False, allow_null=True)
    ordering = serializers.ChoiceField(
        choices=['-created_at', 'created_at', '-updated_at', 'updated_at'],
        required=False
    )

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
