from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings
from src.user.models import UserProfile


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_user_profile(sender, instance, created, **kwargs):
    if created and instance.user_type == 'user' and not instance.is_staff:
        try:
            UserProfile.objects.get_or_create(user=instance)
        except Exception:
            pass

@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def save_user_profile(sender, instance, **kwargs):
    if instance.user_type == 'user' and not instance.is_staff:
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

@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def invalidate_user_cache_on_status_change(sender, instance, **kwargs):
    """Invalidate permission cache if admin-related status changes"""
    if instance.user_type == 'admin' or instance.is_staff:
        # Clear cache for any status change that might affect permissions
        from src.user.access_control import AdminPermissionCache, PermissionValidator, PermissionHelper
        from src.user.utils.cache import UserCacheManager
        
        user_id = instance.id
        AdminPermissionCache.clear_user_cache(user_id)
        PermissionValidator.clear_user_cache(user_id)
        PermissionHelper.clear_user_cache(user_id)
        UserCacheManager.invalidate_profile(user_id)