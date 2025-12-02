from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings
from src.user.models import UserProfile


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_user_profile(sender, instance, created, **kwargs):
    if created and instance.user_type == 'regular' and not instance.is_staff:
        try:
            UserProfile.objects.get_or_create(user=instance)
        except Exception:
            pass

@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def save_user_profile(sender, instance, **kwargs):
    if instance.user_type == 'regular' and not instance.is_staff:
        if not hasattr(instance, 'user_profile'):
            try:
                UserProfile.objects.get_or_create(user=instance)
            except Exception:
                pass
        else:
            try:
                instance.user_profile.save()
            except Exception:
                pass 