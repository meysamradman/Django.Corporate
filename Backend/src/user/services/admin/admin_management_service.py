from django.db.models import Q
from django.core.cache import cache
from rest_framework.exceptions import NotFound, ValidationError, AuthenticationFailed
from src.user.messages import AUTH_ERRORS
from src.user.utils import validate_identifier, validate_register_password
from src.user.models import User, AdminProfile, AdminUserRole, AdminRole
from src.media.models import ImageMedia
from src.media.services.media_services import MediaAdminService
from src.user.services.admin.admin_profile_service import AdminProfileService
from src.user.authorization.admin_permission import AdminPermissionCache
from src.user.permissions.validator import PermissionValidator
from src.user.permissions.helpers import PermissionHelper


class AdminManagementService:
    @staticmethod
    def get_admins_list(search=None, is_active=None, is_superuser=None, request=None):
        queryset = User.objects.select_related('admin_profile').prefetch_related(
            'admin_profile__profile_picture'
        ).filter(user_type='admin', is_staff=True, is_admin_active=True)
        
        filters = {}
        
        if is_active is not None:
            filters['is_active'] = is_active
            
        if is_superuser is not None:
            filters['is_superuser'] = is_superuser
            
        queryset = queryset.filter(**filters)
        
        if search:
            queryset = queryset.filter(
                Q(mobile__icontains=search) |
                Q(email__icontains=search) |
                Q(admin_profile__first_name__icontains=search) |
                Q(admin_profile__last_name__icontains=search)
            ).distinct()

        return queryset.order_by('-created_at')

    @staticmethod
    def get_admin_detail(admin_id):
        try:
            return User.objects.select_related('admin_profile').prefetch_related(
                'admin_profile__profile_picture'
            ).get(id=admin_id, user_type='admin', is_staff=True, is_admin_active=True)
        except User.DoesNotExist:
            raise NotFound(AUTH_ERRORS["not_found"])

    @staticmethod
    def update_admin(admin_id, validated_data, admin_user=None):
        try:
            if admin_user is not None:
                if not admin_user.is_staff:
                    raise AuthenticationFailed(AUTH_ERRORS["auth_not_authorized"])
                modifying_sensitive = any(key in validated_data for key in ['is_staff', 'is_superuser'])
                if modifying_sensitive and not admin_user.is_superuser:
                    user_to_update = User.objects.get(id=admin_id)
                    if user_to_update.id != admin_user.id or validated_data.get('is_staff', user_to_update.is_staff) or validated_data.get('is_superuser', user_to_update.is_superuser):
                        raise AuthenticationFailed(AUTH_ERRORS["auth_not_superuser"])
            
            try:
                admin_id = int(admin_id)
            except (TypeError, ValueError):
                raise ValidationError({"admin_id": AUTH_ERRORS["invalid_user_id_format"]})
            
            admin = User.objects.select_related('admin_profile').get(id=admin_id)
            
            admin_fields_to_update = {}
            profile_fields_to_update = {}
            profile_picture = validated_data.pop('profile_picture', None)
            profile_picture_file = validated_data.pop('profile_picture_file', None)

            if 'identifier' in validated_data:
                identifier = validated_data.pop('identifier')
                if identifier:
                    try:
                        email, mobile = validate_identifier(identifier)
                        if email and User.objects.filter(~Q(id=admin_id), email=email).exists():
                            raise ValidationError(AUTH_ERRORS["auth_email_exists"])
                        if mobile and User.objects.filter(~Q(id=admin_id), mobile=mobile).exists():
                            raise ValidationError(AUTH_ERRORS["auth_mobile_exists"])
                            
                        admin_fields_to_update['email'] = email
                        admin_fields_to_update['mobile'] = mobile
                    except ValidationError as e:
                        raise ValidationError({"identifier": str(e)})
            
            if 'email' in validated_data:
                email = validated_data.pop('email')
                final_email = None if email == '' else email 
                if final_email and User.objects.filter(~Q(id=admin_id), email=final_email).exists():
                    raise ValidationError({"email": AUTH_ERRORS["auth_email_exists"]})
                admin_fields_to_update['email'] = final_email
                
            if 'mobile' in validated_data:
                mobile = validated_data.pop('mobile')
                final_mobile = None if mobile == '' else mobile
                if final_mobile and User.objects.filter(~Q(id=admin_id), mobile=final_mobile).exists():
                    raise ValidationError({"mobile": AUTH_ERRORS["auth_mobile_exists"]})
                admin_fields_to_update['mobile'] = final_mobile

            admin_model_fields = ['password', 'is_active', 'is_staff', 'is_superuser']
            for field in admin_model_fields:
                if field in validated_data:
                    value = validated_data.pop(field)
                    if field == 'password' and not value:
                        continue
                    admin_fields_to_update[field] = value

            profile_model_fields = ['first_name', 'last_name', 'birth_date', 'national_id', 'address', 'bio', 'province', 'city', 'phone']
            for field in profile_model_fields:
                if field in validated_data:
                    profile_fields_to_update[field] = validated_data.pop(field)

            profile_prefix = 'profile_'
            prefix_keys = [k for k in validated_data.keys() if k.startswith(profile_prefix)]
            for key in prefix_keys:
                field = key[len(profile_prefix):]
                if field in profile_model_fields:
                    profile_fields_to_update[field] = validated_data.pop(key)

            nested_profile = validated_data.pop('profile', {}) or {}
            if isinstance(nested_profile, dict):
                for field in profile_model_fields:
                    if field in nested_profile:
                        profile_fields_to_update[field] = nested_profile[field]
            
            should_remove_picture = validated_data.pop('remove_profile_picture', 'false').lower() == 'true'
            
            if not should_remove_picture:
                should_remove_picture = validated_data.pop('delete_profile_picture', 'false').lower() == 'true'
                
            if not should_remove_picture:
                should_remove_picture = validated_data.pop('clear_profile_picture', 'false')
                if isinstance(should_remove_picture, bool):
                    should_remove_picture = should_remove_picture
                else:
                    should_remove_picture = should_remove_picture.lower() == 'true'

            if profile_picture_file:
                try:
                    media = MediaService.upload_file(
                        file=profile_picture_file,
                        title=f"Admin profile picture - admin {admin.id}",
                        alt_text=f"Profile picture for admin {admin.id}",
                        folder="profile_pictures"
                    )
                    
                    if media:
                        profile_fields_to_update['profile_picture_id'] = media.id
                except Exception as e:
                    pass
            elif profile_picture:
                profile_fields_to_update['profile_picture'] = profile_picture

            if admin_fields_to_update:
                if 'password' in admin_fields_to_update:
                    password = admin_fields_to_update.pop('password')
                    admin.set_password(password)
                    
                for field, value in admin_fields_to_update.items():
                    setattr(admin, field, value)
                admin.save()
            
            role_id_str = validated_data.pop('role_id', None)
            if role_id_str is not None:
                try:
                    if role_id_str == '' or role_id_str.lower() == 'none':
                        AdminUserRole.objects.filter(user=admin, is_active=True).update(is_active=False)
                    else:
                        role_id = int(role_id_str)
                        
                        try:
                            role = AdminRole.objects.get(id=role_id, is_active=True)
                            
                            if role.name == 'super_admin' and not admin.is_superuser:
                                return admin
                            
                            AdminUserRole.objects.filter(user=admin, is_active=True).update(is_active=False)
                            
                            user_role, created = AdminUserRole.objects.get_or_create(
                                user=admin,
                                role=role,
                                defaults={
                                    'assigned_by': admin_user,
                                    'is_active': True
                                }
                            )
                            
                            if not created:
                                user_role.is_active = True
                                user_role.save()
                            
                            user_role.update_permissions_cache()
                            
                            PermissionHelper.clear_user_cache(admin.id)
                            AdminPermissionCache.clear_user_cache(admin.id)
                            PermissionValidator.clear_user_cache(admin.id)
                            
                        except AdminRole.DoesNotExist:
                            pass
                except ValueError:
                    pass
                except Exception as e:
                    pass

            if profile_fields_to_update or should_remove_picture:
                if should_remove_picture:
                    AdminProfileService.update_profile_image(admin, None)
                
                if profile_fields_to_update:
                    AdminProfileService.update_admin_profile(admin, profile_fields_to_update)
            
            AdminPermissionCache.clear_user_cache(admin.id)
            PermissionValidator.clear_user_cache(admin.id)
            PermissionHelper.clear_user_cache(admin.id)
           
            return admin
            
        except User.DoesNotExist:
            raise NotFound(AUTH_ERRORS["not_found"])
        except Exception as e:
            raise

    @staticmethod
    def delete_admin(admin_id, admin_user=None):
        if admin_user is not None and not admin_user.is_staff:
            raise AuthenticationFailed(AUTH_ERRORS["auth_not_authorized"])
        
        try:
            admin = User.objects.get(id=admin_id)
            
            if admin_user is not None and admin.is_staff and not (admin_user.is_superuser or admin_user.is_admin_full):
                raise AuthenticationFailed(AUTH_ERRORS["auth_not_superuser"])
            
            if admin.is_admin_full and admin_user and not admin_user.is_admin_full:
                raise AuthenticationFailed(AUTH_ERRORS["auth_not_authorized"])
                
            admin.delete()
            
            return True
            
        except User.DoesNotExist:
            raise NotFound(AUTH_ERRORS["not_found"])

    @staticmethod
    def bulk_delete_admins(admin_ids, admin_user=None):
        if not isinstance(admin_ids, list) or not admin_ids:
            raise ValidationError(AUTH_ERRORS["auth_validation_error"])

        if admin_user is not None and not admin_user.is_staff:
            raise AuthenticationFailed(AUTH_ERRORS["auth_not_authorized"])

        try:
            admin_ids = [int(uid) for uid in admin_ids]
        except (ValueError, TypeError):
            raise ValidationError(AUTH_ERRORS["auth_validation_error"])

        if admin_user is not None and not (admin_user.is_superuser or admin_user.is_admin_full):
            if User.objects.filter(id__in=admin_ids, is_staff=True).exists():
                raise AuthenticationFailed(AUTH_ERRORS["auth_not_superuser"])
        
        if admin_user is not None and not (admin_user.is_superuser or admin_user.is_admin_full):
            admin_ids_to_delete = list(User.objects.filter(
                id__in=admin_ids, 
                is_staff=False
            ).values_list('id', flat=True))
        else:
            admin_ids_to_delete = list(User.objects.filter(
                id__in=admin_ids
            ).exclude(
                is_admin_full=True
            ).values_list('id', flat=True))

        deleted_count, _ = User.objects.filter(id__in=admin_ids_to_delete).delete()

        if deleted_count == 0 and len(admin_ids_to_delete) > 0:
            existing_ids = set(User.objects.filter(id__in=admin_ids_to_delete).values_list('id', flat=True))
            if not existing_ids and len(admin_ids_to_delete) > 0:
                 raise NotFound(AUTH_ERRORS["not_found"])
            
        return deleted_count
