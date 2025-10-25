from django.core.exceptions import ValidationError
from rest_framework.exceptions import NotFound
from src.user.models import User, UserProfile, AdminProfile # Import AdminProfile
from src.user.messages import AUTH_ERRORS


class BaseProfileService:
    @staticmethod
    def _get_profile_model(user):
        """Helper to get the correct profile model based on user_type."""
        if user.user_type == 'admin':
            return AdminProfile
        elif user.user_type == 'user':
            return UserProfile
        raise ValidationError("Invalid user_type for profile service")

    @staticmethod
    def get_user_profile(user):
        """
        Retrieves or creates the correct profile for the given user.
        Handles both AdminProfile and UserProfile.
        """
        try:
            profile_model = BaseProfileService._get_profile_model(user)
            # Use getattr to dynamically access 'admin_profile' or 'user_profile'
            profile_instance = getattr(user, f"{user.user_type}_profile", None)

            if profile_instance is None:
                # If profile doesn't exist, create it
                profile, created = profile_model.objects.get_or_create(user=user)
                return profile
            return profile_instance
        except User.DoesNotExist:
            raise NotFound("User not found")
        except ValidationError as e:
            raise NotFound(str(e)) # Re-raise as NotFound or appropriate exception

    @staticmethod
    def update_user_profile(user, profile_data):
        """
        Updates user profile with the given data.
        Handles profile picture upload efficiently for both AdminProfile and UserProfile.
        """
        if not profile_data:
            return BaseProfileService.get_user_profile(user) # Return current profile if no data

        try:
            profile_model = BaseProfileService._get_profile_model(user)
            # Use correct field name based on profile model
            user_field_name = 'admin_user' if profile_model.__name__ == 'AdminProfile' else 'user'
            profile, created = profile_model.objects.get_or_create(**{user_field_name: user})
            
            profile_picture = profile_data.pop('profile_picture', None)
            old_media_to_delete = None
            
            update_needed = False
            fields_actually_updated = []
            for field, value in profile_data.items():
                current_value = getattr(profile, field, None)
                
                # Special handling for foreign key fields (province, city)
                if field in ['province', 'city']:
                    # For foreign keys, compare IDs
                    current_id = getattr(current_value, 'id', None) if current_value else None
                    new_id = value if isinstance(value, int) else getattr(value, 'id', None) if value else None
                    if new_id != current_id:
                        # Convert ID to object for Django ForeignKey
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
                    # Regular field comparison
                    if str(value or '') != str(current_value or ''):
                        setattr(profile, field, value)
                        fields_actually_updated.append(field)
                        update_needed = True
            
            
            # Handle profile_picture separately
            if profile_picture is not None:
                # Get current profile picture ID
                current_profile_picture = getattr(profile, 'profile_picture', None)
                current_id = getattr(current_profile_picture, 'id', None) if current_profile_picture else None
                new_id = getattr(profile_picture, 'id', None) if profile_picture else None
                
                # Check if profile picture actually changed
                if current_id != new_id:
                    update_needed = True
                    try:
                        from src.media.models.media import ImageMedia
                        if profile_picture is None:
                            if profile.profile_picture:
                                old_media_to_delete = profile.profile_picture
                            profile.profile_picture = None
                            fields_actually_updated.append('profile_picture')
                        else:
                            if isinstance(profile_picture, ImageMedia):
                                if profile.profile_picture:
                                    old_media_to_delete = profile.profile_picture
                                profile.profile_picture = profile_picture
                                fields_actually_updated.append('profile_picture')
                            else:
                                pass
                    except ImportError:
                        pass
                    except Exception as e:
                        pass
            
            if update_needed:
                # Check for national_id uniqueness before saving
                if 'national_id' in fields_actually_updated:
                    national_id = getattr(profile, 'national_id', None)
                    if national_id:
                        # Check if this national_id already exists for another user
                        from src.user.models import UserProfile
                        existing_profile = UserProfile.objects.filter(national_id=national_id).exclude(id=profile.id).first()
                        if existing_profile:
                            raise ValueError(f"کد ملی {national_id} قبلاً توسط کاربر دیگری استفاده شده است.")
                
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
            raise ValidationError(f"Failed to update profile: {str(e)}")

    @staticmethod
    def update_profile_image(user, media_obj):
        """
        Update profile image with Media object from central media app
        Handles both AdminProfile and UserProfile.
        """
        profile = BaseProfileService.get_user_profile(user) # Use the unified get_user_profile method
        
        if media_obj is None:
            if profile.profile_picture:
                profile.profile_picture = None
                profile.save(update_fields=['profile_picture'])
            return profile
            
        if hasattr(media_obj, 'media_type') and media_obj.media_type != 'image':
            raise ValidationError("Only image media types are allowed for profile pictures")
            
        profile.profile_picture = media_obj
        profile.save(update_fields=['profile_picture'])
                
        return profile