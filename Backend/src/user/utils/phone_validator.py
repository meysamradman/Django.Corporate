from django.core.exceptions import ValidationError
from src.user.messages import AUTH_ERRORS
from src.user.models import UserProfile, AdminProfile


def validate_phone_number(value):
    if not value:
        return value
    
    cleaned_phone = value.strip().replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
    
    if not cleaned_phone.isdigit():
        raise ValidationError("Phone number must contain digits only.")
    
    if len(cleaned_phone) < 3:
        raise ValidationError("Phone number must contain at least 3 digits.")
    
    if len(cleaned_phone) > 15:
        raise ValidationError("Phone number must not exceed 15 digits.")
    
    return cleaned_phone


def validate_phone_number_optional(value):
    if not value or value.strip() == "":
        return None
    
    return validate_phone_number(value)


def validate_phone_uniqueness(phone, user_id=None, profile_type='user'):
    if not phone:
        return phone
    
    user_query = UserProfile.objects.filter(phone=phone)
    if user_id and profile_type == 'user':
        user_query = user_query.exclude(user_id=user_id)
    elif user_id and profile_type == 'admin':
        pass
    
    if user_query.exists():
        raise ValidationError("This phone number is already used by another user.")
    
    admin_query = AdminProfile.objects.filter(phone=phone)
    if user_id and profile_type == 'admin':
        admin_query = admin_query.exclude(admin_user_id=user_id)
    elif user_id and profile_type == 'user':
        pass
    
    if admin_query.exists():
        raise ValidationError("This phone number is already used by another admin.")
    
    return phone


def validate_phone_number_with_uniqueness(value, user_id=None, profile_type='user'):
    validated_phone = validate_phone_number_optional(value)
    
    if validated_phone:
        validate_phone_uniqueness(validated_phone, user_id, profile_type)
    
    return validated_phone
