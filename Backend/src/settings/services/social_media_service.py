from django.core.exceptions import ValidationError
from src.settings.models import SocialMedia
from src.settings.messages.messages import SETTINGS_ERRORS


def get_social_medias(filters=None, ordering=None):
    queryset = SocialMedia.objects.all()
    
    if filters:
        if 'is_active' in filters:
            queryset = queryset.filter(is_active=filters['is_active'])
    
    if ordering:
        queryset = queryset.order_by(*ordering)
    else:
        queryset = queryset.order_by('order', '-created_at')
    
    return queryset


def create_social_media(validated_data):
    return SocialMedia.objects.create(**validated_data)


def get_social_media_by_id(social_media_id):
    try:
        return SocialMedia.objects.get(id=social_media_id)
    except SocialMedia.DoesNotExist:
        raise SocialMedia.DoesNotExist(SETTINGS_ERRORS['social_media_not_found'])


def update_social_media(instance, validated_data):
    for field, value in validated_data.items():
        setattr(instance, field, value)
    
    instance.save()
    return instance


def delete_social_media(instance):
    instance.delete()
