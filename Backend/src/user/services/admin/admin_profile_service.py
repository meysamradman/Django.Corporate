from django.core.exceptions import ValidationError
from django.core.cache import cache
from django.core.exceptions import ValidationError
from rest_framework.exceptions import NotFound
from src.user.models import User, AdminProfile
from src.core.models import Province, City
from src.user.messages import AUTH_ERRORS
from src.media.models import ImageMedia

def _clear_permission_cache(user_id):
    
    try:
        from src.user.access_control import AdminPermissionCache, PermissionValidator, PermissionHelper
        AdminPermissionCache.clear_user_cache(user_id)
        PermissionValidator.clear_user_cache(user_id)
        PermissionHelper.clear_user_cache(user_id)
    except ImportError:
        pass

class AdminProfileService:
    @staticmethod
    def get_admin_profile(admin):
        try:
            profile_instance = getattr(admin, 'admin_profile', None)

            if profile_instance is None:
                profile, created = AdminProfile.objects.get_or_create(admin_user=admin)
                return profile
            return profile_instance
        except User.DoesNotExist:
            raise NotFound(AUTH_ERRORS.get("not_found"))
        except ValidationError as e:
            raise NotFound(str(e))

    @staticmethod
    def update_admin_profile(admin, profile_data, admin_user=None, profile_picture=None):
        if not profile_data and profile_picture is None:
            return AdminProfileService.get_admin_profile(admin)

        try:
            profile, created = AdminProfile.objects.get_or_create(admin_user=admin)
            
            if profile_picture is None:
                profile_picture = profile_data.pop('profile_picture', None)
            
            old_media_to_delete = None
            
            update_needed = False
            fields_actually_updated = []
            for field, value in profile_data.items():
                current_value = getattr(profile, field, None)
                
                if field in ['province', 'city']:
                    current_id = getattr(current_value, 'id', None) if current_value else None
                    new_id = value if isinstance(value, int) else getattr(value, 'id', None) if value else None
                    if new_id != current_id:
                        if isinstance(value, int):
                            try:
                                if field == 'province':
                                    fk_object = Province.objects.get(id=value)
                                elif field == 'city':
                                    fk_object = City.objects.get(id=value)
                                else:
                                    fk_object = value
                                setattr(profile, field, fk_object)
                                fields_actually_updated.append(field)
                                update_needed = True
                            except Exception as e:
                                pass
                        else:
                            setattr(profile, field, value)
                            fields_actually_updated.append(field)
                            update_needed = True
                else:
                    if str(value or '') != str(current_value or ''):
                        setattr(profile, field, value)
                        fields_actually_updated.append(field)
                        update_needed = True

            if profile_picture is not None:
                current_profile_picture = getattr(profile, 'profile_picture', None)
                current_id = getattr(current_profile_picture, 'id', None) if current_profile_picture else None
                
                if isinstance(profile_picture, int):
                    try:
                        profile_picture_obj = ImageMedia.objects.get(id=profile_picture, is_active=True)
                        new_id = profile_picture_obj.id
                    except ImageMedia.DoesNotExist:
                        profile_picture_obj = None
                        new_id = None
                else:
                    profile_picture_obj = profile_picture
                    new_id = getattr(profile_picture, 'id', None) if profile_picture else None
                
                if current_id != new_id:
                    update_needed = True
                    try:
                        if profile_picture is None or profile_picture_obj is None:
                            if profile.profile_picture:
                                old_media_to_delete = profile.profile_picture
                            profile.profile_picture = None
                            fields_actually_updated.append('profile_picture')
                        else:
                            if isinstance(profile_picture_obj, ImageMedia):
                                if profile.profile_picture:
                                    old_media_to_delete = profile.profile_picture
                                profile.profile_picture = profile_picture_obj
                                fields_actually_updated.append('profile_picture')
                    except ImportError:
                        pass
                    except Exception as e:
                        pass
            
            if update_needed:
                if 'national_id' in fields_actually_updated:
                    national_id = getattr(profile, 'national_id', None)
                    if national_id:
                        existing_profile = AdminProfile.objects.filter(national_id=national_id).exclude(id=profile.id).first()
                        if existing_profile:
                            raise ValueError(AUTH_ERRORS.get("national_id_exists"))
                
                profile.save()
                
                _clear_permission_cache(admin.id)
                
                if old_media_to_delete:
                    try:
                        old_media_to_delete.delete()
                    except Exception as e:
                        pass
            else:
                pass
            return profile
                    
        except Exception as e:
            raise ValidationError(AUTH_ERRORS.get("auth_profile_failed"))

    @staticmethod
    def update_profile_image(admin, media_obj):
        profile = AdminProfileService.get_admin_profile(admin)
        
        if media_obj is None:
            if profile.profile_picture:
                profile.profile_picture = None
                profile.save(update_fields=['profile_picture'])
            
            _clear_permission_cache(admin.id)
            
            return profile
            
        if hasattr(media_obj, 'media_type') and media_obj.media_type != 'image':
            raise ValidationError(AUTH_ERRORS.get("auth_file_must_be_image"))
            
        profile.profile_picture = media_obj
        profile.save(update_fields=['profile_picture'])
        
        _clear_permission_cache(admin.id)
                
        return profile