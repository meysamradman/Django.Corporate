from django.core.exceptions import ValidationError
from src.user.models import UserProfile, AdminProfile, User
from src.user.messages import AUTH_ERRORS


def validate_national_id_format(value):
    """
    Validate the format of a national ID.
    National ID must be exactly 10 digits.
    """
    if not value:
        return None
        
    if not isinstance(value, str):
        value = str(value)
        
    if not value.isdigit():
        raise ValidationError(AUTH_ERRORS.get("national_id_not_numeric"))
        
    if len(value) != 10:
        raise ValidationError(AUTH_ERRORS.get("national_id_invalid_length"))
        
    return value


def validate_national_id_uniqueness(value, user_id=None, profile_type='user'):
    """
    Validate that the national ID is unique across all users (both regular users and admins).
    
    Args:
        value: The national ID to validate
        user_id: The ID of the current user (to exclude from uniqueness check)
        profile_type: 'user' for regular user or 'admin' for admin user
    
    Returns:
        The validated national ID value
        
    Raises:
        ValidationError: If the national ID is not unique
    """
    if not value or value == '':
        return value
        
    # Check if this national ID already exists for any user profile
    user_profile_exists = UserProfile.objects.filter(national_id=value)
    admin_profile_exists = AdminProfile.objects.filter(national_id=value)
    
    # If checking for a specific user, exclude their own profile
    if user_id:
        try:
            user = User.objects.get(id=user_id)
            
            if profile_type == 'user':
                if hasattr(user, 'user_profile') and user.user_profile and user.user_profile.id:
                    user_profile_exists = user_profile_exists.exclude(id=user.user_profile.id)
            elif profile_type == 'admin':
                if hasattr(user, 'admin_profile') and user.admin_profile and user.admin_profile.id:
                    admin_profile_exists = admin_profile_exists.exclude(id=user.admin_profile.id)
        except User.DoesNotExist:
            pass
    
    # Check if any profile with this national ID exists
    if user_profile_exists.exists() or admin_profile_exists.exists():
        raise ValidationError(AUTH_ERRORS.get("national_id_exists"))
        
    return value


def validate_national_id(value, user_id=None, profile_type='user'):
    """
    Comprehensive validation for national ID including format and uniqueness.
    
    Args:
        value: The national ID to validate
        user_id: The ID of the current user (to exclude from uniqueness check)
        profile_type: 'user' for regular user or 'admin' for admin user
    
    Returns:
        The validated national ID value
        
    Raises:
        ValidationError: If the national ID is invalid or not unique
    """
    if not value or value == '':
        return value
        
    # Validate format
    value = validate_national_id_format(value)
    
    # Validate uniqueness across all users
    value = validate_national_id_uniqueness(value, user_id, profile_type)
    
    return value