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
    Serializer for Regular User Detail View
    ✅ فقط اطلاعات پایه یوزر + profile
    ❌ بدون permissions (چون یوزر معمولیه، نه ادمین)
    
    ⚠️ WARNING: این serializer فقط برای یوزرهای معمولی هست!
    برای ادمین‌ها از AdminDetailSerializer استفاده کن.
    """
    profile = UserProfileSerializer(source='user_profile', read_only=True)
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'public_id', 'email', 'mobile', 'is_active', 'is_staff', 'is_superuser',
                 'created_at', 'updated_at', 'profile', 'full_name']
    
    def get_full_name(self, obj):
        """
        Generate full name from user profile
        اگه first_name و last_name داشت، ترکیفشون رو برمی‌گردونه
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

class UserUpdateSerializer(serializers.ModelSerializer):
    profile = UserProfileUpdateSerializer(required=False)
    
    class Meta:
        model = User
        fields = ['email', 'mobile', 'is_active', 'profile']
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        print(f"🔍 UserUpdateSerializer initialized with data: {self.initial_data}")
        print(f"🔍 UserUpdateSerializer context: {self.context}")
        print(f"🔍 UserUpdateSerializer instance: {self.instance}")
    
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
                print(f"🔍 Validating email: {value}")
                # Validate email format
                validated_email = validate_email_address(value)
                print(f"✅ Email format valid: {validated_email}")
                
                # Check uniqueness (exclude current user)
                user_id = self.context.get('user_id') or (self.instance.id if self.instance else None)
                print(f"🔍 User ID for uniqueness check: {user_id}")
                
                if user_id and User.objects.filter(email=validated_email).exclude(id=user_id).exists():
                    print(f"❌ Email already exists: {validated_email}")
                    raise serializers.ValidationError("این ایمیل قبلاً استفاده شده است")
                
                print(f"✅ Email uniqueness check passed: {validated_email}")
                return validated_email
            except Exception as e:
                print(f"❌ Email validation error: {str(e)}")
                raise serializers.ValidationError(str(e))
        return value
    
    def validate_mobile(self, value):
        """Validate mobile format and uniqueness"""
        if value:
            try:
                print(f"🔍 Validating mobile: {value}")
                # Validate mobile format
                validated_mobile = validate_mobile_number(value)
                print(f"✅ Mobile format valid: {validated_mobile}")
                
                # Check uniqueness (exclude current user)
                user_id = self.context.get('user_id') or (self.instance.id if self.instance else None)
                print(f"🔍 User ID for mobile uniqueness check: {user_id}")
                
                if user_id and User.objects.filter(mobile=validated_mobile).exclude(id=user_id).exists():
                    print(f"❌ Mobile already exists: {validated_mobile}")
                    raise serializers.ValidationError("این شماره موبایل قبلاً استفاده شده است")
                
                print(f"✅ Mobile uniqueness check passed: {validated_mobile}")
                return validated_mobile
            except Exception as e:
                print(f"❌ Mobile validation error: {str(e)}")
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