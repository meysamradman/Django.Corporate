from django.core.exceptions import ValidationError
from rest_framework.exceptions import NotFound
from src.user.models import User
from src.user.messages import AUTH_ERRORS
from src.media.models import ImageMedia


class AdminProfileService:
    @staticmethod
    def get_admin_profile(admin):
        """
        Retrieve or create the profile associated with an admin user.
        """
        try:
            profile_instance = getattr(admin, 'admin_profile', None)

            if profile_instance is None:
                from src.user.models import AdminProfile
                profile, created = AdminProfile.objects.get_or_create(admin_user=admin)
                return profile
            return profile_instance
        except User.DoesNotExist:
            raise NotFound(AUTH_ERRORS.get("not_found"))
        except ValidationError as e:
            raise NotFound(str(e))

    @staticmethod
    def update_admin_profile(admin, profile_data, admin_user=None, profile_picture=None):
        """
        Update an admin profile using the provided payload and picture.
        """
        if not profile_data and profile_picture is None:
            return AdminProfileService.get_admin_profile(admin)

        try:
            from src.user.models import AdminProfile
            profile, created = AdminProfile.objects.get_or_create(admin_user=admin)
            
            # If profile_picture is provided separately, prefer that value
            if profile_picture is None:
                profile_picture = profile_data.pop('profile_picture', None)
            
            old_media_to_delete = None
            
            update_needed = False
            fields_actually_updated = []
            for field, value in profile_data.items():
                current_value = getattr(profile, field, None)
                
                # Handle foreign key fields (province, city)
                if field in ['province', 'city']:
                    current_id = getattr(current_value, 'id', None) if current_value else None
                    new_id = value if isinstance(value, int) else getattr(value, 'id', None) if value else None
                    if new_id != current_id:
                        if isinstance(value, int):
                            try:
                                if field == 'province':
                                    from src.user.models.location import Province
                                    fk_object = Province.objects.get(id=value)
                                elif field == 'city':
                                    from src.user.models.location import City
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
                    # Handle primitive fields
                    if str(value or '') != str(current_value or ''):
                        setattr(profile, field, value)
                        fields_actually_updated.append(field)
                        update_needed = True
            
            
            # Process profile picture separately
            if profile_picture is not None:
                current_profile_picture = getattr(profile, 'profile_picture', None)
                current_id = getattr(current_profile_picture, 'id', None) if current_profile_picture else None
                
                # Convert integer profile_picture IDs into ImageMedia objects
                if isinstance(profile_picture, int):
                    try:
                        from src.media.models import ImageMedia
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
                # Guard against duplicate national_id values before saving
                if 'national_id' in fields_actually_updated:
                    national_id = getattr(profile, 'national_id', None)
                    if national_id:
                        from src.user.models import AdminProfile
                        existing_profile = AdminProfile.objects.filter(national_id=national_id).exclude(id=profile.id).first()
                        if existing_profile:
                            raise ValueError(AUTH_ERRORS.get("national_id_exists"))
                
                profile.save()
                
                if old_media_to_delete:
                    try:
                        old_media_to_delete.delete()
                    except Exception as e:
                        pass
            else:
                pass
            return profile
                    
        except Exception as e:
            import traceback
            traceback.print_exc()
            raise ValidationError(AUTH_ERRORS.get("auth_profile_failed"))

    @staticmethod
    def update_profile_image(admin, media_obj):
        """
        Update the admin profile picture using a media object provided by the media app.
        """
        profile = AdminProfileService.get_admin_profile(admin)
        
        if media_obj is None:
            if profile.profile_picture:
                profile.profile_picture = None
                profile.save(update_fields=['profile_picture'])
            return profile
            
        if hasattr(media_obj, 'media_type') and media_obj.media_type != 'image':
            raise ValidationError(AUTH_ERRORS.get("auth_file_must_be_image"))
            
        profile.profile_picture = media_obj
        profile.save(update_fields=['profile_picture'])
                
        return profile