from django.db.models import Q
from rest_framework.exceptions import NotFound, ValidationError, AuthenticationFailed
from src.user.messages import AUTH_ERRORS
from src.user.utils import validate_identifier, validate_register_password
from src.user.models import User, UserProfile
from src.user.services.user.user_profile_service import UserProfileService


class UserManagementService:
    @staticmethod
    def get_users_list(search=None, is_active=None, request=None):
        """
        دریافت لیست کاربران معمولی با فیلترهای مختلف
        """
        queryset = User.objects.select_related('user_profile').prefetch_related(
            'user_profile__profile_picture'
        ).filter(user_type='user', is_staff=False)
        
        filters = {}
        
        if is_active is not None:
            filters['is_active'] = is_active
            
        queryset = queryset.filter(**filters)
        
        if search:
            queryset = queryset.filter(
                Q(mobile__icontains=search) |
                Q(email__icontains=search) |
                Q(user_profile__first_name__icontains=search) |
                Q(user_profile__last_name__icontains=search)
            ).distinct()

        return queryset.order_by('-created_at')

    @staticmethod
    def get_user_detail(user_id):
        """
        دریافت جزئیات یک کاربر معمولی
        """
        try:
            return User.objects.select_related('user_profile').prefetch_related(
                'user_profile__profile_picture'
            ).get(id=user_id, user_type='user', is_staff=False)
        except User.DoesNotExist:
            raise NotFound(AUTH_ERRORS["not_found"])

    @staticmethod
    def get_user_by_public_id(public_id):
        """
        دریافت کاربر معمولی بر اساس public_id
        """
        try:
            return User.objects.select_related('user_profile').prefetch_related(
                'user_profile__profile_picture'
            ).get(public_id=public_id, user_type='user', is_staff=False)
        except User.DoesNotExist:
            raise NotFound(AUTH_ERRORS["not_found"])

    @staticmethod
    def update_user(user_id, validated_data, admin_user=None):
        """
        به‌روزرسانی کاربر معمولی و پروفایل آن
        """
        try:
            if admin_user is not None:
                if not admin_user.is_staff:
                    raise AuthenticationFailed(AUTH_ERRORS["auth_not_authorized"])
            
            try:
                user_id = int(user_id)
            except (TypeError, ValueError):
                raise ValidationError({"user_id": AUTH_ERRORS.get("invalid_user_id_format")})
            
            user = User.objects.select_related('user_profile').get(id=user_id)
            
            user_fields_to_update = {}
            profile_fields_to_update = {}
            profile_picture = validated_data.pop('profile_picture', None)
            profile_picture_file = validated_data.pop('profile_picture_file', None)

            if 'identifier' in validated_data:
                identifier = validated_data.pop('identifier')
                if identifier:
                    try:
                        email, mobile = validate_identifier(identifier)
                        if email and User.objects.filter(~Q(id=user_id), email=email).exists():
                            raise ValidationError(AUTH_ERRORS["auth_email_exists"])
                        if mobile and User.objects.filter(~Q(id=user_id), mobile=mobile).exists():
                            raise ValidationError(AUTH_ERRORS["auth_mobile_exists"])
                            
                        user_fields_to_update['email'] = email
                        user_fields_to_update['mobile'] = mobile
                    except ValidationError as e:
                        raise ValidationError({"identifier": str(e)})
            
            if 'email' in validated_data:
                email = validated_data.pop('email')
                final_email = None if email == '' else email 
                if final_email and User.objects.filter(~Q(id=user_id), email=final_email).exists():
                    raise ValidationError(AUTH_ERRORS["auth_email_exists"])
                user_fields_to_update['email'] = final_email
                
            if 'mobile' in validated_data:
                mobile = validated_data.pop('mobile')
                final_mobile = None if mobile == '' else mobile
                if final_mobile and User.objects.filter(~Q(id=user_id), mobile=final_mobile).exists():
                    raise ValidationError(AUTH_ERRORS["auth_mobile_exists"])
                user_fields_to_update['mobile'] = final_mobile

            user_model_fields = ['password', 'is_active']
            for field in user_model_fields:
                if field in validated_data:
                    value = validated_data.pop(field)
                    if field == 'password' and not value:
                        continue
                    user_fields_to_update[field] = value

            # include profile_picture so nested profile.profile_picture is handled
            profile_model_fields = ['first_name', 'last_name', 'birth_date', 'national_id', 'address', 'bio', 'province', 'city', 'phone', 'profile_picture']
            for field in profile_model_fields:
                if field in validated_data:
                    profile_fields_to_update[field] = validated_data.pop(field)

            profile_prefix = 'profile_'
            prefix_keys = [k for k in validated_data.keys() if k.startswith(profile_prefix)]
            for key in prefix_keys:
                field = key[len(profile_prefix):]
                if field in profile_model_fields:
                    if field == 'national_id':
                        national_id_value = validated_data[key]
                        if national_id_value:
                            existing_profile = None
                            try:
                                existing_profile = UserProfile.objects.filter(national_id=national_id_value).exclude(user_id=user_id).first()
                            except:
                                pass
                            
                            if existing_profile:
                                raise ValidationError({"national_id": AUTH_ERRORS["national_id_exists"]})
                    
                    profile_fields_to_update[field] = validated_data.pop(key)

            nested_profile = validated_data.pop('profile', {}) or {}
            if isinstance(nested_profile, dict):
                for field in profile_model_fields:
                    if field in nested_profile:
                        if field == 'national_id':
                            national_id_value = nested_profile[field]
                            if national_id_value:
                                existing_profile = None
                                try:
                                    existing_profile = UserProfile.objects.filter(national_id=national_id_value).exclude(user_id=user_id).first()
                                except:
                                    pass
                                
                                if existing_profile:
                                    raise ValidationError({"national_id": AUTH_ERRORS["national_id_exists"]})
                        
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
                    from src.media.services.media_service import MediaService
                    
                    media = MediaService.upload_file(
                        file=profile_picture_file,
                        title=f"تصویر پروفایل - کاربر {user.id}",
                        alt_text=f"تصویر پروفایل برای کاربر {user.id}",
                        folder="profile_pictures"
                    )
                    
                    if media:
                        profile_fields_to_update['profile_picture_id'] = media.id
                except Exception as e:
                    pass
            elif profile_picture:
                profile_fields_to_update['profile_picture'] = profile_picture

            if user_fields_to_update:
                if 'password' in user_fields_to_update:
                    password = user_fields_to_update.pop('password')
                    user.set_password(password)
                    
                for field, value in user_fields_to_update.items():
                    setattr(user, field, value)
                user.save()
            
            if profile_fields_to_update or should_remove_picture:
                if should_remove_picture:
                    UserProfileService.update_profile_image(user, None)
                
                if profile_fields_to_update:
                    UserProfileService.update_user_profile(user, profile_fields_to_update)
            
            # Reload fresh user with related profile and profile picture to avoid stale relations
            user = User.objects.select_related('user_profile').prefetch_related('user_profile__profile_picture').get(id=user_id)
            return user
            
        except User.DoesNotExist:
            raise NotFound(AUTH_ERRORS["not_found"])
        except Exception as e:
            import traceback
            traceback.print_exc()
            raise

    @staticmethod
    def delete_user(user_id, admin_user=None):
        """
        حذف کاربر معمولی
        """
        if admin_user is not None and not admin_user.is_staff:
            raise AuthenticationFailed(AUTH_ERRORS["auth_not_authorized"])
        
        try:
            user = User.objects.get(id=user_id)
            
            if admin_user is not None and user.is_staff:
                raise AuthenticationFailed(AUTH_ERRORS["auth_not_superuser"])
            
            user.delete()
            
            return True
            
        except User.DoesNotExist:
            raise NotFound(AUTH_ERRORS["not_found"])

    @staticmethod
    def bulk_delete_users(user_ids, admin_user=None):
        """
        حذف دسته‌ای کاربران معمولی
        """
        if not isinstance(user_ids, list) or not user_ids:
                raise ValidationError(AUTH_ERRORS.get("auth_validation_error"))

        if admin_user is not None and not admin_user.is_staff:
            raise AuthenticationFailed(AUTH_ERRORS["auth_not_authorized"])

        try:
            user_ids = [int(uid) for uid in user_ids]
        except (ValueError, TypeError):
            raise ValidationError(AUTH_ERRORS.get("auth_validation_error"))

        if admin_user is not None and not (admin_user.is_superuser or admin_user.is_admin_full):
            if User.objects.filter(id__in=user_ids, is_staff=True).exists():
                raise AuthenticationFailed(AUTH_ERRORS["auth_not_superuser"])
        
        user_ids_to_delete = list(User.objects.filter(
            id__in=user_ids, 
            is_staff=False
        ).values_list('id', flat=True))

        deleted_count, _ = User.objects.filter(id__in=user_ids_to_delete).delete()

        if deleted_count == 0 and len(user_ids_to_delete) > 0:
            existing_ids = set(User.objects.filter(id__in=user_ids_to_delete).values_list('id', flat=True))
            if not existing_ids and len(user_ids_to_delete) > 0:
                 raise NotFound(AUTH_ERRORS.get("not_found"))

        return deleted_count