from rest_framework import serializers
from django.db.models import Q
from src.user.messages import AUTH_ERRORS
from src.user.utils.email_validator import validate_email_address
from src.user.utils.mobile_validator import validate_mobile_number
from src.user.models import User
from src.user.serializers.base_profile_serializer import UserProfileSerializer, AdminProfileSerializer, UserProfileUpdateSerializer, AdminProfileUpdateSerializer

class BaseUserListSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(source='user_profile', read_only=True)
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'public_id', 'full_name', 'mobile', 'email', 'is_active', 'is_staff', 'is_superuser', 
                 'created_at', 'updated_at', 'profile']

    def get_full_name(self, obj):
        """Generate full name from user profile"""
        if obj.user_type == 'admin' and hasattr(obj, 'admin_profile') and obj.admin_profile:
            profile = obj.admin_profile
            if profile.first_name and profile.last_name:
                return f"{profile.first_name} {profile.last_name}"
        elif obj.user_type == 'user' and hasattr(obj, 'user_profile') and obj.user_profile:
            profile = obj.user_profile
            if profile.first_name and profile.last_name:
                return f"{profile.first_name} {profile.last_name}"
        
        # Fallback to identifier
        return obj.mobile or obj.email or str(obj.id)

class BaseUserDetailSerializer(serializers.ModelSerializer):
    profile = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'public_id', 'email', 'mobile', 'is_active', 'is_staff', 'is_superuser', 
                 'created_at', 'updated_at', 'profile']
        read_only_fields = ['id', 'public_id', 'created_at', 'updated_at']
    
    def get_profile(self, obj):
        """Get profile based on user type"""
        if obj.user_type == 'admin' and hasattr(obj, 'admin_profile') and obj.admin_profile:
            return AdminProfileSerializer(obj.admin_profile, context=self.context).data
        elif obj.user_type == 'user' and hasattr(obj, 'user_profile') and obj.user_profile:
            return UserProfileSerializer(obj.user_profile, context=self.context).data
        return None

class BaseUserUpdateSerializer(serializers.Serializer):
    identifier = serializers.CharField(required=False, allow_blank=True)
    mobile = serializers.CharField(required=False, allow_blank=True)  # ⭐ اضافه کردن mobile field
    email = serializers.EmailField(required=False, allow_blank=True)  # ⭐ اضافه کردن email field
    password = serializers.CharField(required=False, write_only=True)
    is_active = serializers.BooleanField(required=False)
    profile = UserProfileUpdateSerializer(required=False)

    def validate(self, data):
        identifier = data.get('identifier')
        mobile = data.get('mobile')
        email = data.get('email')
        user_id = self.context.get('user_id')

        if identifier and identifier.strip():  # Only validate if identifier is not empty
            try:
                if '@' in identifier:
                    data['email'] = validate_email_address(identifier)
                    data['mobile'] = None

                    if User.objects.filter(~Q(id=user_id), email=data['email']).exists():
                        raise serializers.ValidationError({'identifier': AUTH_ERRORS["auth_email_exists"]})
                else:
                    data['mobile'] = validate_mobile_number(identifier)
                    data['email'] = None

                    if User.objects.filter(~Q(id=user_id), mobile=data['mobile']).exists():
                        raise serializers.ValidationError({'identifier': AUTH_ERRORS["auth_mobile_exists"]})
            except serializers.ValidationError:
                raise serializers.ValidationError({'identifier': AUTH_ERRORS["auth_identifier_error"]})
        
        # ⭐ اضافه کردن validation برای mobile مستقل
        if mobile and mobile.strip():
            try:
                validated_mobile = validate_mobile_number(mobile)
                data['mobile'] = validated_mobile
                
                # چک کردن یکتایی mobile
                if User.objects.filter(~Q(id=user_id), mobile=validated_mobile).exists():
                    raise serializers.ValidationError({'mobile': 'شماره موبایل قبلاً استفاده شده است.'})
            except serializers.ValidationError as e:
                raise serializers.ValidationError({'mobile': str(e)})
        
        # ⭐ اضافه کردن validation برای email مستقل
        if email and email.strip():
            try:
                validated_email = validate_email_address(email)
                data['email'] = validated_email
                
                # چک کردن یکتایی email
                if User.objects.filter(~Q(id=user_id), email=validated_email).exists():
                    raise serializers.ValidationError({'email': 'ایمیل قبلاً استفاده شده است.'})
            except serializers.ValidationError as e:
                raise serializers.ValidationError({'email': str(e)})

        # Validate profile data if present
        profile_data = data.get('profile')
        if profile_data and user_id:
            national_id = profile_data.get('national_id')
            if national_id:
                from src.user.models import UserProfile
                
                # Check if this national_id already exists for another user
                existing_profile = UserProfile.objects.filter(national_id=national_id).exclude(user_id=user_id).first()
                if existing_profile:
                    raise serializers.ValidationError({
                        'profile': {
                            'national_id': ['کد ملی قبلاً توسط کاربر دیگری استفاده شده است.']
                        }
                    })

        return data

class BaseUserFilterSerializer(serializers.Serializer):
    search = serializers.CharField(required=False, allow_blank=True)
    is_active = serializers.BooleanField(required=False, allow_null=True)
