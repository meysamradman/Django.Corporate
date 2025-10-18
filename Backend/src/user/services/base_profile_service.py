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
        print(f"--- BaseProfileService.update_user_profile --- User: {user.id}, UserType: {user.user_type}, Received Profile Data:", profile_data)
        
        if not profile_data:
            print("--- BaseProfileService.update_user_profile --- No profile data received, returning.")
            return BaseProfileService.get_user_profile(user) # Return current profile if no data

        try:
            profile_model = BaseProfileService._get_profile_model(user)
            # Use correct field name based on profile model
            user_field_name = 'admin_user' if profile_model.__name__ == 'AdminProfile' else 'user'
            profile, created = profile_model.objects.get_or_create(**{user_field_name: user})
            print(f"--- BaseProfileService.update_user_profile --- Profile instance {'created' if created else 'retrieved'}: {profile.id} (Type: {profile_model.__name__})")
            
            profile_picture = profile_data.pop('profile_picture', None)
            old_media_to_delete = None
            
            update_needed = False
            fields_actually_updated = []
            for field, value in profile_data.items():
                current_value = getattr(profile, field, None)
                # Regular field comparison
                if str(value or '') != str(current_value or ''):
                    setattr(profile, field, value)
                    fields_actually_updated.append(field)
                    update_needed = True
            
            print(f"--- BaseProfileService.update_user_profile --- Fields marked for update: {fields_actually_updated}")
            
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
                                print(f">>> Error: profile_picture should be ImageMedia object, got {type(profile_picture)}")
                                
                    except ImportError:
                        print(">>> Error: Could not import ImageMedia model.")
                    except Exception as e:
                        print(f">>> Error processing profile picture: {str(e)}")
            
            if update_needed:
                print(f"--- BaseProfileService.update_user_profile --- Saving profile with updated fields: {fields_actually_updated}")
                profile.save()
                print("--- BaseProfileService.update_user_profile --- Profile saved successfully.")
                
                if old_media_to_delete:
                    try:
                        old_media_to_delete.delete()
                    except Exception as e:
                        print(f">>> Warning: Failed to delete old media {old_media_to_delete.id}: {str(e)}")
            else:
                print("--- BaseProfileService.update_user_profile --- No update needed based on field comparison.")
                
            return profile
                    
        except Exception as e:
            print(f">>> ERROR updating profile in BaseProfileService for user {user.id}: {str(e)}")
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