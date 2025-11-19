from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings
from src.user.models import UserProfile
import logging

logger = logging.getLogger(__name__)


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_user_profile(sender, instance, created, **kwargs):
    """Create UserProfile only for regular users (user_type='regular')"""
    if created and instance.user_type == 'regular' and not instance.is_staff:
        # Only create UserProfile for regular users
        try:
            UserProfile.objects.get_or_create(user=instance)
        except Exception as e:
            # Log error but don't fail user creation
            logger.error(f"Profile creation failed in signal: {e}")
            pass

@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def save_user_profile(sender, instance, **kwargs):
    """Save UserProfile for regular users only"""
    if instance.user_type == 'regular' and not instance.is_staff:
        if not hasattr(instance, 'user_profile'):
            try:
                UserProfile.objects.get_or_create(user=instance)
            except Exception as e:
                logger.error(f"Profile creation failed in save signal: {e}")
                pass
        else:
            try:
                instance.user_profile.save()
            except Exception as e:
                logger.error(f"Profile save failed in signal: {e}")
                pass 