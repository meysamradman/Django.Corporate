
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

from .models.property import Property
from .models.type import PropertyType
from src.real_estate.utils.cache import PropertyCacheManager, TypeCacheManager
from src.user.services.admin_performance_service import AdminPerformanceService
from src.user.models.admin_profile import AdminProfile


@receiver(post_save, sender=Property)
def invalidate_property_cache_on_save(sender, instance, **kwargs):
    if instance.pk:
        PropertyCacheManager.invalidate_property(instance.pk)
        PropertyCacheManager.invalidate_list()


@receiver(post_delete, sender=Property)
def invalidate_property_cache_on_delete(sender, instance, **kwargs):
    if instance.pk:
        PropertyCacheManager.invalidate_property(instance.pk)
        PropertyCacheManager.invalidate_list()


@receiver(post_save, sender=PropertyType)
def invalidate_type_cache_on_save(sender, **kwargs):
    TypeCacheManager.invalidate_all()


@receiver(post_delete, sender=PropertyType)
def invalidate_type_cache_on_delete(sender, **kwargs):
    TypeCacheManager.invalidate_all()

@receiver(post_save, sender=Property)
def track_property_creation(sender, instance, created, **kwargs):
    if created and instance.created_by:
        profile = AdminProfile.objects.filter(admin_user=instance.created_by).first()
        if profile:
            AdminPerformanceService.track_content_creation(profile, 'property')

