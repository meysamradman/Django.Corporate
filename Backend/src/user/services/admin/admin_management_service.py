from datetime import datetime
from django.db.models import Q
from django.core.cache import cache
from rest_framework.exceptions import NotFound, ValidationError, AuthenticationFailed
from src.user.messages import AUTH_ERRORS, PROTECTED_ADMIN_ID
from src.user.utils import validate_identifier, validate_register_password
from src.user.models import User, AdminProfile, AdminUserRole, AdminRole
from src.user.models import AdminProfileSocialMedia
from src.media.models import ImageMedia
from src.media.services.media_services import MediaAdminService as MediaService
from src.user.services.admin.admin_profile_service import AdminProfileService
from src.core.utils.validation_helpers import extract_validation_message
from src.real_estate.models.agent_social_media import PropertyAgentSocialMedia

def _clear_permission_cache(user_id):
    try:
        from src.user.access_control import AdminPermissionCache, PermissionValidator, PermissionHelper
        AdminPermissionCache.clear_user_cache(user_id)
        PermissionValidator.clear_user_cache(user_id)
        PermissionHelper.clear_user_cache(user_id)
    except ImportError:
        pass

class AdminManagementService:
    @staticmethod
    def _sync_admin_profile_social_media(profile, social_media_items):
        if social_media_items is None:
            return

        if not isinstance(social_media_items, list):
            raise ValidationError({'profile.social_media': AUTH_ERRORS.get("auth_validation_error")})

        existing_items = {item.id: item for item in profile.social_media.all()}
        kept_ids = []

        for index, item in enumerate(social_media_items):
            if not isinstance(item, dict):
                continue

            name = (item.get('name') or '').strip()
            url = (item.get('url') or '').strip()
            if not name or not url:
                continue

            order = item.get('order')
            if order is None:
                order = index

            icon_id = item.get('icon', item.get('icon_id'))
            icon_id = icon_id or None

            social_id = item.get('id')
            if social_id in existing_items:
                social_obj = existing_items[social_id]
                social_obj.name = name
                social_obj.url = url
                social_obj.icon_id = icon_id
                social_obj.order = order
                social_obj.is_active = True
                social_obj.save(update_fields=['name', 'url', 'icon', 'order', 'is_active', 'updated_at'])
                kept_ids.append(social_obj.id)
            else:
                social_obj = AdminProfileSocialMedia.objects.create(
                    admin_profile=profile,
                    name=name,
                    url=url,
                    icon_id=icon_id,
                    order=order,
                )
                kept_ids.append(social_obj.id)

        profile.social_media.exclude(id__in=kept_ids).delete()

    @staticmethod
    def _sync_agent_profile_social_media(agent_profile, social_media_items):
        if social_media_items is None:
            return

        if not isinstance(social_media_items, list):
            raise ValidationError({'agent_profile.social_media': AUTH_ERRORS.get("auth_validation_error")})

        existing_items = {item.id: item for item in agent_profile.social_media.all()}
        kept_ids = []

        for index, item in enumerate(social_media_items):
            if not isinstance(item, dict):
                continue

            name = (item.get('name') or '').strip()
            url = (item.get('url') or '').strip()
            if not name or not url:
                continue

            order = item.get('order')
            if order is None:
                order = index

            icon_id = item.get('icon', item.get('icon_id'))
            icon_id = icon_id or None

            social_id = item.get('id')
            if social_id in existing_items:
                social_obj = existing_items[social_id]
                social_obj.name = name
                social_obj.url = url
                social_obj.icon_id = icon_id
                social_obj.order = order
                social_obj.is_active = True
                social_obj.save(update_fields=['name', 'url', 'icon', 'order', 'is_active', 'updated_at'])
                kept_ids.append(social_obj.id)
            else:
                social_obj = PropertyAgentSocialMedia.objects.create(
                    agent=agent_profile,
                    name=name,
                    url=url,
                    icon_id=icon_id,
                    order=order,
                )
                kept_ids.append(social_obj.id)

        agent_profile.social_media.exclude(id__in=kept_ids).delete()
    @staticmethod
    def get_admins_list(search=None, is_active=None, is_superuser=None, user_role_type=None, date_from=None, date_to=None, request=None):
        queryset = User.objects.select_related(
            'admin_profile',
            'admin_profile__province',
            'admin_profile__city',
            'admin_profile__profile_picture',
            'real_estate_agent_profile',
            'real_estate_agent_profile__agency',
            'real_estate_agent_profile__profile_picture'
        ).prefetch_related(
            'admin_user_roles__role'
        ).filter(user_type='admin', is_staff=True, is_admin_active=True)
        
        filters = {}
        if is_active is not None:
            filters['is_active'] = is_active
        if is_superuser is not None:
            filters['is_superuser'] = is_superuser
        
        if filters:
            queryset = queryset.filter(**filters)
        
        if user_role_type and user_role_type != 'all':
            if user_role_type == 'consultant':
                queryset = queryset.filter(
                    real_estate_agent_profile__isnull=False,
                    is_superuser=False
                )
            elif user_role_type == 'admin':
                queryset = queryset.filter(
                    Q(real_estate_agent_profile__isnull=True) | Q(is_superuser=True)
                )
        
        if search:
            queryset = queryset.filter(
                Q(mobile__icontains=search) |
                Q(email__icontains=search) |
                Q(admin_profile__first_name__icontains=search) |
                Q(admin_profile__last_name__icontains=search)
            ).distinct()
        
        if date_from:
            try:
                date_from_obj = datetime.strptime(date_from, '%Y-%m-%d').date()
                queryset = queryset.filter(created_at__date__gte=date_from_obj)
            except ValueError:
                pass
        
        if date_to:
            try:
                date_to_obj = datetime.strptime(date_to, '%Y-%m-%d').date()
                queryset = queryset.filter(created_at__date__lte=date_to_obj)
            except ValueError:
                pass
        
        return queryset.order_by('-created_at')

    @staticmethod
    def get_admin_detail(admin_id):
        try:
            return User.objects.select_related(
                'admin_profile',
                'admin_profile__province',
                'admin_profile__city',
                'admin_profile__profile_picture',
                'real_estate_agent_profile',
                'real_estate_agent_profile__agency',
                'real_estate_agent_profile__profile_picture'
            ).prefetch_related(
                'admin_user_roles__role'
            ).get(id=admin_id, user_type='admin', is_staff=True, is_admin_active=True)
        except User.DoesNotExist:
            raise NotFound(AUTH_ERRORS["not_found"])

    @staticmethod
    def update_admin(admin_id, validated_data, admin_user=None):
        from django.db import transaction
        try:
            with transaction.atomic():
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
                                raise ValidationError({
                                    "identifier": extract_validation_message(e, AUTH_ERRORS["auth_identifier_error"])
                                })
                
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

                profile_model_fields = [
                    'first_name', 'last_name', 'birth_date', 'national_id', 
                    'address', 'bio', 'province', 'city', 'phone', 
                    'profile_picture'
                ]
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
                profile_social_media = None
                if isinstance(nested_profile, dict):
                    profile_social_media = nested_profile.get('social_media')
                    for field in profile_model_fields:
                        if field in nested_profile:
                            profile_fields_to_update[field] = nested_profile[field]

                nested_agent_profile = validated_data.pop('agent_profile', {}) or {}
                agent_social_media = None
                if isinstance(nested_agent_profile, dict):
                    agent_social_media = nested_agent_profile.get('social_media')
                
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
                            profile_fields_to_update['profile_picture'] = media.id
                    except Exception:
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
                                
                            except AdminRole.DoesNotExist:
                                pass
                    except ValueError:
                        pass
                    except Exception:
                        pass

                if profile_fields_to_update or should_remove_picture:
                    if should_remove_picture:
                        AdminProfileService.update_profile_image(admin, None)
                    
                    if profile_fields_to_update:
                        AdminProfileService.update_admin_profile(admin, profile_fields_to_update)

                if hasattr(admin, 'admin_profile') and admin.admin_profile is not None:
                    AdminManagementService._sync_admin_profile_social_media(
                        admin.admin_profile,
                        profile_social_media
                    )

                if isinstance(nested_agent_profile, dict) and nested_agent_profile:
                    if not hasattr(admin, 'real_estate_agent_profile') or admin.real_estate_agent_profile is None:
                        raise ValidationError({'agent_profile': AUTH_ERRORS.get("auth_validation_error")})

                    agent_profile = admin.real_estate_agent_profile

                    if 'license_number' in nested_agent_profile:
                        license_number = nested_agent_profile.get('license_number')
                        if isinstance(license_number, str):
                            license_number = license_number.strip()
                        if not license_number:
                            raise ValidationError({'agent_profile.license_number': AUTH_ERRORS.get("consultant_license_required")})

                        from src.real_estate.models import PropertyAgent
                        if PropertyAgent.objects.exclude(id=agent_profile.id).filter(license_number=license_number).exists():
                            raise ValidationError({'agent_profile.license_number': AUTH_ERRORS.get("license_number_exists")})
                        agent_profile.license_number = license_number

                    if 'license_expire_date' in nested_agent_profile:
                        agent_profile.license_expire_date = nested_agent_profile.get('license_expire_date') or None

                    if 'specialization' in nested_agent_profile:
                        agent_profile.specialization = (nested_agent_profile.get('specialization') or '')

                    if 'bio' in nested_agent_profile:
                        agent_profile.bio = (nested_agent_profile.get('bio') or '')

                    if 'is_verified' in nested_agent_profile:
                        agent_profile.is_verified = bool(nested_agent_profile.get('is_verified'))

                    if 'meta_title' in nested_agent_profile:
                        agent_profile.meta_title = (nested_agent_profile.get('meta_title') or '')

                    if 'meta_description' in nested_agent_profile:
                        agent_profile.meta_description = (nested_agent_profile.get('meta_description') or '')

                    if 'meta_keywords' in nested_agent_profile:
                        agent_profile.meta_keywords = (nested_agent_profile.get('meta_keywords') or '')

                    if 'og_title' in nested_agent_profile:
                        agent_profile.og_title = (nested_agent_profile.get('og_title') or '')

                    if 'og_description' in nested_agent_profile:
                        agent_profile.og_description = (nested_agent_profile.get('og_description') or '')

                    if 'canonical_url' in nested_agent_profile:
                        agent_profile.canonical_url = (nested_agent_profile.get('canonical_url') or '')

                    if 'robots_meta' in nested_agent_profile:
                        agent_profile.robots_meta = (nested_agent_profile.get('robots_meta') or '')

                    if 'agency_id' in nested_agent_profile:
                        agency_id = nested_agent_profile.get('agency_id')
                        if agency_id:
                            from src.real_estate.models import RealEstateAgency
                            try:
                                agent_profile.agency = RealEstateAgency.objects.get(id=agency_id, is_active=True)
                            except RealEstateAgency.DoesNotExist:
                                raise ValidationError({'agent_profile.agency_id': AUTH_ERRORS.get("agency_not_found")})
                        else:
                            agent_profile.agency = None

                    if 'og_image_id' in nested_agent_profile:
                        og_image_id = nested_agent_profile.get('og_image_id')
                        if og_image_id:
                            try:
                                og_image = ImageMedia.objects.get(id=og_image_id, is_active=True)
                                agent_profile.og_image = og_image
                            except ImageMedia.DoesNotExist:
                                raise ValidationError({'agent_profile.og_image_id': AUTH_ERRORS.get("image_not_found")})
                        else:
                            agent_profile.og_image = None

                    agent_profile.save()
                    AdminManagementService._sync_agent_profile_social_media(
                        agent_profile,
                        agent_social_media
                    )
                
                _clear_permission_cache(admin.id)
            
                return admin
            
        except User.DoesNotExist:
            raise NotFound(AUTH_ERRORS["not_found"])
        except Exception:
            raise

    @staticmethod
    def delete_admin(admin_id, admin_user=None):
        from django.db import transaction
        if admin_user is not None and not admin_user.is_staff:
            raise AuthenticationFailed(AUTH_ERRORS["auth_not_authorized"])
        
        try:
            with transaction.atomic():
                admin = User.objects.get(id=admin_id)
                
                if PROTECTED_ADMIN_ID is not None and admin.id == PROTECTED_ADMIN_ID:
                    raise ValidationError(AUTH_ERRORS["admin_protected_delete_forbidden"])
                
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
        from django.db import transaction
        if not isinstance(admin_ids, list) or not admin_ids:
            raise ValidationError(AUTH_ERRORS["auth_validation_error"])

        if admin_user is not None and not admin_user.is_staff:
            raise AuthenticationFailed(AUTH_ERRORS["auth_not_authorized"])

        try:
            admin_ids = [int(uid) for uid in admin_ids]
        except (ValueError, TypeError):
            raise ValidationError(AUTH_ERRORS["auth_validation_error"])

        with transaction.atomic():
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
            
            if PROTECTED_ADMIN_ID is not None:
                if PROTECTED_ADMIN_ID in admin_ids_to_delete:
                    raise ValidationError(AUTH_ERRORS["admin_protected_delete_forbidden"])
                admin_ids_to_delete = [aid for aid in admin_ids_to_delete if aid != PROTECTED_ADMIN_ID]

            deleted_count, _ = User.objects.filter(id__in=admin_ids_to_delete).delete()

            if deleted_count == 0 and len(admin_ids_to_delete) > 0:
                existing_ids = set(User.objects.filter(id__in=admin_ids_to_delete).values_list('id', flat=True))
                if not existing_ids and len(admin_ids_to_delete) > 0:
                     raise NotFound(AUTH_ERRORS["not_found"])
                
            return deleted_count
