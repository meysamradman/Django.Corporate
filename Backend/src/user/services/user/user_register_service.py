from src.user.messages import AUTH_ERRORS
from src.user.utils.validate_identifier import validate_identifier
from src.user.utils.jwt_tokens import generate_jwt_tokens
from src.user.utils.password_validator import validate_register_password
from src.user.models import User
from django.core.exceptions import ValidationError
from rest_framework.exceptions import AuthenticationFailed


class UserRegisterService:
    @classmethod
    def register_user(cls, identifier, password, admin_user=None):
        """
        ثبت‌نام کاربر معمولی جدید
        """
        user_type = 'user'
        is_staff = False
        is_superuser = False
        is_admin_active = False

        email, mobile = validate_identifier(identifier)

        if not email and not mobile:
            raise ValidationError(AUTH_ERRORS["auth_email_or_mobile_required"])

        if email and User.objects.filter(email=email).exists():
            raise ValidationError(AUTH_ERRORS["auth_email_exists"])

        if mobile and User.objects.filter(mobile=mobile).exists():
            raise ValidationError(AUTH_ERRORS["auth_mobile_exists"])

        user = User.objects.create(
            email=email,
            mobile=mobile,
            user_type=user_type,
            is_staff=is_staff,
            is_superuser=is_superuser,
            is_admin_active=is_admin_active,
            is_active=True
        )

        validate_register_password(password)
        user.set_password(password)
        user.save()

        return user

    @classmethod
    def register_user_from_serializer(cls, validated_data, admin_user=None):
        """
        ثبت‌نام کاربر معمولی از داده‌های سریالایزر
        """
        identifier = validated_data.get('identifier')
        password = validated_data.get('password')
        
        user_type = 'user'
        
        profile_fields = {
            'first_name': validated_data.get('first_name'),
            'last_name': validated_data.get('last_name'),
            'birth_date': validated_data.get('birth_date'),
            'national_id': validated_data.get('national_id'),
            'address': validated_data.get('address'),
            'phone': validated_data.get('phone'),
            'bio': validated_data.get('bio'),
        }
        
        # Handle province and city separately as they are ForeignKeys
        province_id = validated_data.get('province_id')
        city_id = validated_data.get('city_id')
        
        profile_picture_id = validated_data.get('profile_picture_id')
        profile_picture_file = validated_data.get('profile_picture')
        
        if identifier:
            email_from_identifier, mobile = validate_identifier(identifier)
            # Prefer explicit email from payload when provided
            explicit_email = validated_data.get('email')
            email = explicit_email or email_from_identifier

            if email and User.objects.filter(email=email).exists():
                raise ValidationError(AUTH_ERRORS["auth_email_exists"])
            
            if mobile and User.objects.filter(mobile=mobile).exists():
                raise ValidationError(AUTH_ERRORS["auth_mobile_exists"])
            
            user = User.objects.create(
                email=email,
                mobile=mobile,
                user_type='user',
                is_staff=False,
                is_superuser=False,
                is_admin_active=False,
                is_active=validated_data.get('is_active', True)
            )
            
            from src.user.models import UserProfile
            
            national_id = profile_fields.get('national_id')
            if national_id and national_id.strip():
                from django.db.models import Q
                existing_user_profile = UserProfile.objects.filter(
                    national_id=national_id
                ).first()
                
                if existing_user_profile:
                    profile_fields['national_id'] = None
            
            profile_data = {k: v for k, v in profile_fields.items() if v is not None}
            
            profile_picture_media_id = None
            if profile_picture_file:
                profile_picture_media_id = cls._handle_profile_picture_upload(profile_picture_file, user.id)
            elif profile_picture_id:
                profile_picture_media_id = profile_picture_id
            
            if profile_picture_media_id:
                from src.media.models import ImageMedia
                try:
                    profile_picture = ImageMedia.objects.get(id=profile_picture_media_id)
                    profile_data['profile_picture'] = profile_picture
                except ImageMedia.DoesNotExist:
                    pass
            
            # Add province and city if provided
            if province_id:
                from src.user.models.location import Province
                try:
                    province = Province.objects.get(id=province_id, is_active=True)
                    profile_data['province'] = province
                except Province.DoesNotExist:
                    pass
            if city_id:
                from src.user.models.location import City
                try:
                    city = City.objects.get(id=city_id, is_active=True)
                    profile_data['city'] = city
                except City.DoesNotExist:
                    pass
            
            user_profile, created = UserProfile.objects.get_or_create(
                user=user,
                defaults=profile_data
            )
            
            # اگر UserProfile قبلاً وجود داشت، فیلدها را به‌روزرسانی کن
            if not created:
                for key, value in profile_data.items():
                    setattr(user_profile, key, value)
                user_profile.save()
            
        else:
            raise ValidationError(AUTH_ERRORS.get("auth_identifier_cannot_empty"))

        validate_register_password(password)
        user.set_password(password)
        user.save()
        
        return user

    @classmethod
    def _handle_profile_picture_upload(cls, uploaded_file, user_id):
        """
        مدیریت آپلود تصویر پروفایل با استفاده از سرویس مرکزی مدیا
        """
        try:
            from src.media.services.media_service import MediaService
            
            media = MediaService.upload_file(
                file=uploaded_file,
                title=f"تصویر پروفایل - کاربر {user_id}",
                alt_text=f"تصویر پروفایل برای کاربر {user_id}",
                folder="profile_pictures"
            )
            
            return media.id
            
        except Exception as e:
            return None

    @staticmethod
    def get_tokens(user):
        return generate_jwt_tokens(user)