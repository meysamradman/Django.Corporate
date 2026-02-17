from django.core.exceptions import ValidationError
from rest_framework.exceptions import NotFound
from src.user.models import User, UserProfile
from src.core.models import Province, City
from src.user.messages import AUTH_ERRORS
from src.media.models.media import ImageMedia
from src.user.models import UserProfileSocialMedia

class UserProfileService:
    @staticmethod
    def _sync_user_profile_social_media(profile, social_media_items):
        if social_media_items is None:
            return

        if not isinstance(social_media_items, list):
            raise ValidationError({'social_media': AUTH_ERRORS.get("auth_validation_error")})

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
                social_obj = UserProfileSocialMedia.objects.create(
                    user_profile=profile,
                    name=name,
                    url=url,
                    icon_id=icon_id,
                    order=order,
                )
                kept_ids.append(social_obj.id)

        profile.social_media.exclude(id__in=kept_ids).delete()

    @staticmethod
    def get_user_profile(user):
        try:
            profile_instance = getattr(user, 'user_profile', None)

            if profile_instance is None:
                profile, created = UserProfile.objects.get_or_create(user=user)
                return profile
            return profile_instance
        except User.DoesNotExist:
            raise NotFound(AUTH_ERRORS.get("auth_user_not_found"))
        except ValidationError as e:
            raise NotFound(str(e))

    @staticmethod
    def update_user_profile(user, profile_data):
        if not profile_data:
            return UserProfileService.get_user_profile(user)

        try:
            profile, created = UserProfile.objects.get_or_create(user=user)
            
            profile_picture = profile_data.pop('profile_picture', None)
            social_media_items = profile_data.pop('social_media', None)
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
                new_id = getattr(profile_picture, 'id', None) if profile_picture else None
                
                if current_id != new_id:
                    update_needed = True
                    try:
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
                if 'national_id' in fields_actually_updated:
                    national_id = getattr(profile, 'national_id', None)
                    if national_id:
                        existing_profile = UserProfile.objects.filter(national_id=national_id).exclude(id=profile.id).first()
                        if existing_profile:
                            raise ValueError(AUTH_ERRORS.get("national_id_exists"))
                
                profile.save()
                UserProfileService._sync_user_profile_social_media(profile, social_media_items)
                
                if old_media_to_delete:
                    try:
                        old_media_to_delete.delete()
                    except Exception as e:
                        pass
            else:
                UserProfileService._sync_user_profile_social_media(profile, social_media_items)
            return profile
                    
        except Exception as e:
            raise ValidationError(AUTH_ERRORS.get("auth_profile_failed"))

    @staticmethod
    def update_profile_image(user, media_obj):
        profile = UserProfileService.get_user_profile(user)
        
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
