from django.core.exceptions import ValidationError
from src.settings.models import SocialMedia


def get_social_medias(filters=None, ordering=None):
    """Get list of social medias"""
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
    """Create new social media"""
    return SocialMedia.objects.create(**validated_data)


def get_social_media_by_id(social_media_id):
    """Get social media by ID"""
    try:
        return SocialMedia.objects.get(id=social_media_id)
    except SocialMedia.DoesNotExist:
        raise SocialMedia.DoesNotExist("Social media not found")


def update_social_media(instance, validated_data):
    """Update social media"""
    for field, value in validated_data.items():
        setattr(instance, field, value)
    
    instance.save()
    return instance


def delete_social_media(instance):
    """Delete social media"""
    instance.delete()
