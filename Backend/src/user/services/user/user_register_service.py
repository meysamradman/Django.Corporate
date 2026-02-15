from django.db import transaction
from django.db.models import Q
from django.core.exceptions import ValidationError
from rest_framework.exceptions import AuthenticationFailed
from src.user.messages import AUTH_ERRORS
from src.user.utils.validate_identifier import validate_identifier
from src.user.utils.national_id_validator import validate_national_id
from src.user.utils.phone_validator import validate_phone_number_with_uniqueness
from src.user.utils.jwt_tokens import generate_jwt_tokens
from src.user.utils.password_validator import validate_register_password
from src.user.models import User, UserProfile
from src.core.models import Province, City
from src.core.utils.validation_helpers import extract_validation_message
from src.media.models import ImageMedia
from src.media.services.media_services import MediaAdminService as MediaService

class UserRegisterService:
    @classmethod
    def register_user(cls, identifier, password, admin_user=None):
        user_type = 'user'
        is_staff = False
        is_superuser = False
        is_admin_active = False

        email, mobile = validate_identifier(identifier)

        if not email and not mobile:
            raise ValidationError({'identifier': AUTH_ERRORS["auth_email_or_mobile_required"]})

        if email and User.objects.filter(email=email).exists():
            raise ValidationError({'identifier': AUTH_ERRORS["auth_email_exists"]})

        if mobile and User.objects.filter(mobile=mobile).exists():
            raise ValidationError({'identifier': AUTH_ERRORS["auth_mobile_exists"]})

        user = User.objects.create(
            email=email,
            mobile=mobile,
            user_type=user_type,
            is_staff=is_staff,
            is_superuser=is_superuser,
            is_admin_active=is_admin_active,
            is_active=True
        )

        try:
            validate_register_password(password)
        except Exception as e:
            raise ValidationError({'password': str(e)})
        user.set_password(password)
        user.save()

        return user

    @classmethod
    def register_user_from_serializer(cls, validated_data, admin_user=None):
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
        
        province_id = validated_data.get('province_id')
        city_id = validated_data.get('city_id')
        
        profile_picture_id = validated_data.get('profile_picture_id')
        profile_picture_file = validated_data.get('profile_picture')
        
        if identifier:
            email_from_identifier, mobile = validate_identifier(identifier)
            explicit_email = validated_data.get('email')
            email = explicit_email or email_from_identifier

            if email and User.objects.filter(email=email).exists():
                if explicit_email:
                    raise ValidationError({'email': AUTH_ERRORS["auth_email_exists"]})
                raise ValidationError({'identifier': AUTH_ERRORS["auth_email_exists"]})
            
            if mobile and User.objects.filter(mobile=mobile).exists():
                raise ValidationError({'identifier': AUTH_ERRORS["auth_mobile_exists"]})

            national_id = profile_fields.get('national_id')
            if national_id and str(national_id).strip():
                try:
                    profile_fields['national_id'] = validate_national_id(national_id, None, 'user')
                except Exception as e:
                    raise ValidationError({
                        'national_id': extract_validation_message(e, AUTH_ERRORS["national_id_invalid_format"])
                    })

            phone = profile_fields.get('phone')
            if phone and str(phone).strip():
                try:
                    profile_fields['phone'] = validate_phone_number_with_uniqueness(phone, None, 'user')
                except Exception as e:
                    raise ValidationError({
                        'phone': extract_validation_message(e, AUTH_ERRORS["auth_validation_error"])
                    })

            with transaction.atomic():
                user = User.objects.create(
                    email=email,
                    mobile=mobile,
                    user_type='user',
                    is_staff=False,
                    is_superuser=False,
                    is_admin_active=False,
                    is_active=validated_data.get('is_active', True)
                )
            
                profile_data = {k: v for k, v in profile_fields.items() if v is not None}

                profile_picture_media_id = None
                if profile_picture_file:
                    profile_picture_media_id = cls._handle_profile_picture_upload(profile_picture_file, user.id)
                elif profile_picture_id:
                    profile_picture_media_id = profile_picture_id

                if profile_picture_media_id:
                    try:
                        profile_picture = ImageMedia.objects.get(id=profile_picture_media_id)
                        profile_data['profile_picture'] = profile_picture
                    except ImageMedia.DoesNotExist:
                        pass

                if province_id:
                    try:
                        province = Province.objects.get(id=province_id, is_active=True)
                        profile_data['province'] = province
                    except Province.DoesNotExist:
                        pass
                if city_id:
                    try:
                        city = City.objects.get(id=city_id, is_active=True)
                        profile_data['city'] = city
                    except City.DoesNotExist:
                        pass

                user_profile, created = UserProfile.objects.get_or_create(
                    user=user,
                    defaults=profile_data
                )

                if not created:
                    for key, value in profile_data.items():
                        setattr(user_profile, key, value)
                    user_profile.save()
            
        else:
            raise ValidationError({'identifier': AUTH_ERRORS.get("auth_identifier_cannot_empty")})

        try:
            validate_register_password(password)
        except Exception as e:
            raise ValidationError({'password': str(e)})
        user.set_password(password)
        user.save()
        
        return user

    @classmethod
    def _handle_profile_picture_upload(cls, uploaded_file, user_id):
        try:
            media = MediaService.upload_file(
                file=uploaded_file,
                title=f"User profile picture - user {user_id}",
                alt_text=f"Profile picture for user {user_id}",
                folder="profile_pictures"
            )
            
            return media.id
            
        except Exception as e:
            return None

    @staticmethod
    def get_tokens(user):
        return generate_jwt_tokens(user)
