from src.user.messages import AUTH_ERRORS
from src.user.utils.mobile_validator import validate_mobile_number
from src.user.utils.jwt_tokens import generate_jwt_tokens
from src.user.utils.password_validator import validate_register_password
from src.user.models import User, AdminProfile
from django.core.exceptions import ValidationError
from rest_framework.exceptions import AuthenticationFailed


class AdminRegisterService:
    @classmethod
    def register_admin(cls, mobile, password, email=None, admin_user=None):
        if not admin_user:
            raise ValidationError(AUTH_ERRORS.get("auth_validation_error"))
            
        if not admin_user.is_staff:
            raise AuthenticationFailed(AUTH_ERRORS["auth_not_authorized"])
            
        if not admin_user.is_superuser:
            raise AuthenticationFailed(AUTH_ERRORS["auth_not_superuser"])
        
        user_type = 'admin'
        is_staff = True
        is_superuser = False
        is_admin_active = True

        try:
            validated_mobile = validate_mobile_number(mobile)
        except Exception as e:
            raise ValidationError(AUTH_ERRORS["auth_invalid_mobile"])

        if User.objects.filter(mobile=validated_mobile).exists():
            raise ValidationError(AUTH_ERRORS["auth_mobile_exists"])

        if email:
            if User.objects.filter(email=email).exists():
                raise ValidationError(AUTH_ERRORS["auth_email_exists"])

        admin = User.objects.create(
            mobile=validated_mobile,
            email=email,
            user_type=user_type,
            is_staff=is_staff,
            is_superuser=is_superuser,
            is_admin_active=is_admin_active,
            is_active=True
        )

        validate_register_password(password)
        admin.set_password(password)
        admin.save()

        return admin

    @classmethod
    def register_admin_from_serializer(cls, validated_data, admin_user=None):
        mobile = validated_data.get('mobile')
        email = validated_data.get('email')
        password = validated_data.get('password')
        
        user_type = validated_data.get('user_type', 'admin')
        
        profile_fields = {
            'first_name': validated_data.get('first_name'),
            'last_name': validated_data.get('last_name'),
            'birth_date': validated_data.get('birth_date'),
            'national_id': validated_data.get('national_id'),
            'address': validated_data.get('address'),
            'phone': validated_data.get('phone'),
            'department': validated_data.get('department'),
            'position': validated_data.get('position'),
            'bio': validated_data.get('bio'),
            'notes': validated_data.get('notes'),
            'province_id': validated_data.get('province_id'),
            'city_id': validated_data.get('city_id'),
        }
        
        profile_picture_id = validated_data.get('profile_picture_id')
        profile_picture_file = validated_data.get('profile_picture')
        role_id = validated_data.get('role_id')
        
        if mobile and user_type == 'admin':
            if not admin_user or not admin_user.is_staff:
                raise AuthenticationFailed(AUTH_ERRORS["auth_not_authorized"])
            
            try:
                validated_mobile = validate_mobile_number(mobile)
            except Exception as e:
                raise ValidationError(AUTH_ERRORS["auth_invalid_mobile"])
            
            is_superuser = validated_data.get('is_superuser', False)
            
            if User.objects.filter(mobile=validated_mobile).exists():
                raise ValidationError(AUTH_ERRORS["auth_mobile_exists"])
            
            if email and User.objects.filter(email=email).exists():
                raise ValidationError(AUTH_ERRORS["auth_email_exists"])
            
            admin = User.objects.create(
                mobile=validated_mobile,
                email=email,
                user_type='admin',
                is_staff=True,
                is_superuser=is_superuser,
                is_admin_active=True,
                is_active=validated_data.get('is_active', True)
            )
            
            national_id = profile_fields.get('national_id')
            if national_id and national_id.strip():
                from src.user.models import UserProfile
                from django.db.models import Q
                existing_admin_profile = AdminProfile.objects.filter(
                    national_id=national_id
                ).first()
                
                if not existing_admin_profile:
                    existing_user_profile = UserProfile.objects.filter(
                        national_id=national_id
                    ).first()
                    
                    if existing_user_profile:
                        profile_fields['national_id'] = None
                else:
                    profile_fields['national_id'] = None
            
            profile_data = {k: v for k, v in profile_fields.items() if v is not None}
            
            if 'province_id' in profile_data:
                from src.user.models.location import Province
                try:
                    province = Province.objects.get(id=profile_data['province_id'])
                    profile_data['province'] = province
                    del profile_data['province_id']
                except Province.DoesNotExist:
                    del profile_data['province_id']
            
            if 'city_id' in profile_data:
                from src.user.models.location import City
                try:
                    city = City.objects.get(id=profile_data['city_id'])
                    profile_data['city'] = city
                    del profile_data['city_id']
                except City.DoesNotExist:
                    del profile_data['city_id']
            
            profile_picture_media_id = None
            if profile_picture_file:
                profile_picture_media_id = cls._handle_profile_picture_upload(profile_picture_file, admin.id)
            elif profile_picture_id:
                profile_picture_media_id = profile_picture_id
            
            if profile_picture_media_id:
                profile_data['profile_picture_id'] = profile_picture_media_id
            
            admin_profile = AdminProfile.objects.create(
                admin_user=admin,
                **profile_data
            )
            
        elif email and user_type == 'admin':
            if not admin_user or not admin_user.is_staff:
                raise AuthenticationFailed(AUTH_ERRORS["auth_not_authorized"])
            
            is_superuser = validated_data.get('is_superuser', False)
            
            if User.objects.filter(email=email).exists():
                raise ValidationError(AUTH_ERRORS["auth_email_exists"])
            
            admin = User.objects.create(
                email=email,
                user_type='admin',
                is_staff=True,
                is_superuser=is_superuser,
                is_admin_active=True,
                is_active=validated_data.get('is_active', True)
            )
            
            national_id = profile_fields.get('national_id')
            if national_id and national_id.strip():
                from src.user.models import UserProfile
                from django.db.models import Q
                existing_admin_profile = AdminProfile.objects.filter(
                    national_id=national_id
                ).first()
                
                if not existing_admin_profile:
                    existing_user_profile = UserProfile.objects.filter(
                        national_id=national_id
                    ).first()
                    
                    if existing_user_profile:
                        profile_fields['national_id'] = None
                else:
                    profile_fields['national_id'] = None
            
            profile_data = {k: v for k, v in profile_fields.items() if v is not None}
            
            if 'province_id' in profile_data:
                from src.user.models.location import Province
                try:
                    province = Province.objects.get(id=profile_data['province_id'])
                    profile_data['province'] = province
                    del profile_data['province_id']
                except Province.DoesNotExist:
                    del profile_data['province_id']
            
            if 'city_id' in profile_data:
                from src.user.models.location import City
                try:
                    city = City.objects.get(id=profile_data['city_id'])
                    profile_data['city'] = city
                    del profile_data['city_id']
                except City.DoesNotExist:
                    del profile_data['city_id']
            
            profile_picture_media_id = None
            if profile_picture_file:
                profile_picture_media_id = cls._handle_profile_picture_upload(profile_picture_file, admin.id)
            elif profile_picture_id:
                profile_picture_media_id = profile_picture_id
            
            if profile_picture_media_id:
                profile_data['profile_picture_id'] = profile_picture_media_id
            
            admin_profile = AdminProfile.objects.create(
                admin_user=admin,
                **profile_data
            )
            
        else:
            raise ValidationError(AUTH_ERRORS.get("auth_email_or_mobile_required"))

        validate_register_password(password)
        admin.set_password(password)
        admin.save()
        
        if role_id and admin.user_type == 'admin':
            from src.user.models import AdminRole, AdminUserRole
            try:
                role = AdminRole.objects.get(id=role_id, is_active=True)
                AdminUserRole.objects.create(
                    user=admin, 
                    role=role, 
                    assigned_by=admin_user,
                    is_active=True
                )
            except AdminRole.DoesNotExist:
                pass

        return admin

    @classmethod
    def _handle_profile_picture_upload(cls, uploaded_file, admin_id):
        try:
            from src.media.services.media_service import MediaService
            
            media = MediaService.upload_file(
                file=uploaded_file,
                title=f"Admin profile picture - admin {admin_id}",
                alt_text=f"Profile picture for admin {admin_id}",
                folder="profile_pictures"
            )
            
            return media.id
            
        except Exception:
            return None

    @staticmethod
    def get_tokens(admin):
        return generate_jwt_tokens(admin)
