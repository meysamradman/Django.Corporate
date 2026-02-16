from src.settings.models import (
    ContactPhone,
    ContactMobile,
    ContactEmail,
    SocialMedia,
    MapSettings,
)


def get_public_contact_payload():
    phones = ContactPhone.objects.filter(is_active=True).order_by('order', '-created_at')
    mobiles = ContactMobile.objects.filter(is_active=True).order_by('order', '-created_at')
    emails = ContactEmail.objects.filter(is_active=True).order_by('order', '-created_at')
    social_media = SocialMedia.objects.select_related('icon').filter(is_active=True).order_by('order', '-created_at')
    map_settings = MapSettings.objects.filter(is_active=True).order_by('-updated_at').first()

    return {
        'phones': phones,
        'mobiles': mobiles,
        'emails': emails,
        'social_media': social_media,
        'map_settings': map_settings,
    }
