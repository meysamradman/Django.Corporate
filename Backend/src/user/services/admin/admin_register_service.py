from django.db.models import Q
from django.core.exceptions import ValidationError
from rest_framework.exceptions import AuthenticationFailed
from src.user.messages import AUTH_ERRORS
from src.user.utils.mobile_validator import validate_mobile_number
from src.user.utils.jwt_tokens import generate_jwt_tokens
from src.user.utils.password_validator import validate_register_password
from src.user.models import User, AdminProfile, UserProfile, AdminUserRole, AdminRole
from src.core.models import Province, City
from src.core.utils.validation_helpers import extract_validation_message
from src.media.models import ImageMedia
from src.media.services.media_services import MediaAdminService as MediaService

class AdminRegisterService:
    @classmethod
    def register_admin(cls, mobile, password, email=None, admin_user=None):
        if not admin_user:
            raise ValidationError({'non_field_errors': AUTH_ERRORS["auth_validation_error"]})
            
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
            raise ValidationError({'mobile': AUTH_ERRORS["auth_invalid_mobile"]})

        if User.objects.filter(mobile=validated_mobile).exists():
            raise ValidationError({'mobile': AUTH_ERRORS["auth_mobile_exists"]})

        if email:
            if User.objects.filter(email=email).exists():
                raise ValidationError({'email': AUTH_ERRORS["auth_email_exists"]})

        admin = User.objects.create(
            mobile=validated_mobile,
            email=email,
            user_type=user_type,
            is_staff=is_staff,
            is_superuser=is_superuser,
            is_admin_active=is_admin_active,
            is_active=True
        )

        try:
            validate_register_password(password)
        except Exception as e:
            raise ValidationError({
                'password': extract_validation_message(e, AUTH_ERRORS.get("auth_invalid_password"))
            })
        admin.set_password(password)
        admin.save()

        return admin

    @classmethod
    def register_admin_from_serializer(cls, validated_data, admin_user=None):
        from django.db import transaction
        
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
            'bio': validated_data.get('bio'),
            'province_id': validated_data.get('province_id'),
            'city_id': validated_data.get('city_id'),
        }
        
        profile_picture_id = validated_data.get('profile_picture_id')
        profile_picture_file = validated_data.get('profile_picture')
        role_id = validated_data.get('role_id')
        
        with transaction.atomic():
            if mobile and user_type == 'admin':
                if not admin_user or not admin_user.is_staff:
                    raise AuthenticationFailed(AUTH_ERRORS["auth_not_authorized"])
                
                try:
                    validated_mobile = validate_mobile_number(mobile)
                except Exception:
                    raise ValidationError({'mobile': AUTH_ERRORS["auth_invalid_mobile"]})
                
                is_superuser = validated_data.get('is_superuser', False)
                
                if User.objects.filter(mobile=validated_mobile).exists():
                    raise ValidationError({'mobile': AUTH_ERRORS["auth_mobile_exists"]})
                
                if email and User.objects.filter(email=email).exists():
                    raise ValidationError({'email': AUTH_ERRORS["auth_email_exists"]})
                
                admin = User.objects.create(
                    mobile=validated_mobile,
                    email=email,
                    user_type='admin',
                    is_staff=True,
                    is_superuser=is_superuser,
                    is_admin_active=True,
                    is_active=validated_data.get('is_active', True)
                )
            elif email and user_type == 'admin':
                if not admin_user or not admin_user.is_staff:
                    raise AuthenticationFailed(AUTH_ERRORS["auth_not_authorized"])
                
                is_superuser = validated_data.get('is_superuser', False)
                
                if User.objects.filter(email=email).exists():
                    raise ValidationError({'email': AUTH_ERRORS["auth_email_exists"]})
                
                admin = User.objects.create(
                    email=email,
                    user_type='admin',
                    is_staff=True,
                    is_superuser=is_superuser,
                    is_admin_active=True,
                    is_active=validated_data.get('is_active', True)
                )
            else:
                raise ValidationError({'non_field_errors': AUTH_ERRORS["auth_email_or_mobile_required"]})

            national_id = profile_fields.get('national_id')
            if national_id and national_id.strip():
                if AdminProfile.objects.filter(national_id=national_id).exists():
                    raise ValidationError({'national_id': AUTH_ERRORS.get("national_id_exists")})
            
            profile_data = {k: v for k, v in profile_fields.items() if v is not None}
            
            if 'province_id' in profile_data:
                try:
                    profile_data['province'] = Province.objects.get(id=profile_data.pop('province_id'))
                except Province.DoesNotExist:
                    pass
            
            if 'city_id' in profile_data:
                try:
                    profile_data['city'] = City.objects.get(id=profile_data.pop('city_id'))
                except City.DoesNotExist:
                    pass
            
            profile_picture_media_id = None
            if profile_picture_file:
                profile_picture_media_id = cls._handle_profile_picture_upload(profile_picture_file, admin.id)
            elif profile_picture_id:
                profile_picture_media_id = profile_picture_id
            
            if profile_picture_media_id:
                profile_data['profile_picture_id'] = profile_picture_media_id
            
            AdminProfile.objects.create(
                admin_user=admin,
                **profile_data
            )

            try:
                validate_register_password(password)
            except Exception as e:
                raise ValidationError({
                    'password': extract_validation_message(e, AUTH_ERRORS.get("auth_invalid_password"))
                })
            admin.set_password(password)
            admin.save()
            
            admin_role_type = validated_data.get('admin_role_type', 'admin')
            if admin_role_type == 'consultant':
                cls._create_property_agent(admin, validated_data)
            
            if role_id:
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
    def _create_property_agent(cls, user, validated_data):
        from src.real_estate.models import PropertyAgent, RealEstateAgency
        from src.media.models import ImageMedia
        from django.utils.text import slugify
        
        first_name = validated_data.get('first_name', '')
        last_name = validated_data.get('last_name', '')
        full_name = f"{first_name} {last_name}".strip()
        
        if not full_name:
            full_name = user.mobile or user.email or f"agent-{user.id}"
        
        base_slug = slugify(full_name, allow_unicode=True)
        slug = base_slug
        counter = 1
        while PropertyAgent.objects.filter(slug=slug).exists():
            slug = f"{base_slug}-{counter}"
            counter += 1
        
        agent_data = {
            'user': user,
            'slug': slug,
            'license_number': validated_data.get('license_number'),
            'license_expire_date': validated_data.get('license_expire_date'),
            'specialization': validated_data.get('specialization', ''),
            'bio': validated_data.get('bio', ''),
            'is_verified': validated_data.get('is_verified', False),
            'meta_title': validated_data.get('meta_title', ''),
            'meta_description': validated_data.get('meta_description', ''),
            'og_title': validated_data.get('og_title', ''),
            'og_description': validated_data.get('og_description', ''),
            'canonical_url': validated_data.get('canonical_url', ''),
            'robots_meta': validated_data.get('robots_meta', ''),
        }
        
        agency_id = validated_data.get('agency_id')
        if agency_id:
            try:
                agent_data['agency'] = RealEstateAgency.objects.get(id=agency_id, is_active=True)
            except RealEstateAgency.DoesNotExist:
                raise ValidationError({'agency_id': AUTH_ERRORS.get("agency_not_found")})
        
        og_image_id = validated_data.get('og_image_id')
        if og_image_id:
            try:
                agent_data['og_image'] = ImageMedia.objects.get(id=og_image_id)
            except ImageMedia.DoesNotExist:
                raise ValidationError({'og_image_id': AUTH_ERRORS.get("image_not_found")})
        
        agent_data = {k: v for k, v in agent_data.items() if v is not None}
        
        try:
            agent = PropertyAgent.objects.create(**agent_data)
            return agent
        except Exception as e:
            user.delete()
            raise ValidationError({
                'non_field_errors': AUTH_ERRORS.get("property_agent_create_failed").format(error=str(e))
            })

    @classmethod
    def _handle_profile_picture_upload(cls, uploaded_file, admin_id):
        try:
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
