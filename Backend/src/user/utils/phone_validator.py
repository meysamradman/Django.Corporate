from django.core.exceptions import ValidationError
from src.user.messages import AUTH_ERRORS
from src.user.models import UserProfile, AdminProfile


def validate_phone_number(value):
    """
    Validate phone number format - more flexible than mobile validation
    Supports regular phone numbers (not just mobile)
    
    Args:
        value (str): Phone number to validate
        
    Returns:
        str: Cleaned phone number
        
    Raises:
        ValidationError: If phone number is invalid
    """
    if not value:
        return value
    
    # Clean the phone number - remove common separators
    cleaned_phone = value.strip().replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
    
    # Check if it's all digits
    if not cleaned_phone.isdigit():
        raise ValidationError("شماره تلفن باید فقط شامل اعداد باشد")
    
    # Check reasonable length (3-15 digits)
    if len(cleaned_phone) < 3:
        raise ValidationError("شماره تلفن باید حداقل 3 رقم باشد")
    
    if len(cleaned_phone) > 15:
        raise ValidationError("شماره تلفن نمی‌تواند بیش از 15 رقم باشد")
    
    return cleaned_phone


def validate_phone_number_optional(value):
    """
    Validate phone number format - optional version
    Returns None if empty, otherwise validates
    
    Args:
        value (str): Phone number to validate (can be empty)
        
    Returns:
        str or None: Cleaned phone number or None if empty
        
    Raises:
        ValidationError: If phone number is invalid
    """
    if not value or value.strip() == "":
        return None
    
    return validate_phone_number(value)


def validate_phone_uniqueness(phone, user_id=None, profile_type='user'):
    """
    Validate phone number uniqueness across profiles
    
    Args:
        phone (str): Phone number to check
        user_id (int): Current user ID (to exclude from check)
        profile_type (str): 'user' or 'admin'
        
    Returns:
        str: Cleaned phone number if unique
        
    Raises:
        ValidationError: If phone number already exists
    """
    if not phone:
        return phone
    
    # Check in UserProfile
    user_query = UserProfile.objects.filter(phone=phone)
    if user_id and profile_type == 'user':
        user_query = user_query.exclude(user_id=user_id)
    elif user_id and profile_type == 'admin':
        # For admin, check if any user has this phone
        pass
    
    if user_query.exists():
        raise ValidationError("این شماره تلفن قبلاً توسط کاربر دیگری استفاده شده است")
    
    # Check in AdminProfile
    admin_query = AdminProfile.objects.filter(phone=phone)
    if user_id and profile_type == 'admin':
        admin_query = admin_query.exclude(admin_user_id=user_id)
    elif user_id and profile_type == 'user':
        # For user, check if any admin has this phone
        pass
    
    if admin_query.exists():
        raise ValidationError("این شماره تلفن قبلاً توسط ادمین دیگری استفاده شده است")
    
    return phone


def validate_phone_number_with_uniqueness(value, user_id=None, profile_type='user'):
    """
    Validate phone number format and uniqueness in one function
    
    Args:
        value (str): Phone number to validate
        user_id (int): Current user ID
        profile_type (str): 'user' or 'admin'
        
    Returns:
        str or None: Cleaned phone number or None if empty
        
    Raises:
        ValidationError: If phone number is invalid or not unique
    """
    # First validate format
    validated_phone = validate_phone_number_optional(value)
    
    # Then check uniqueness if phone is provided
    if validated_phone:
        validate_phone_uniqueness(validated_phone, user_id, profile_type)
    
    return validated_phone
