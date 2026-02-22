
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.core.cache import cache

from .models.property import Property
from .models.type import PropertyType
from .models.listing_type import ListingType
from .models.tag import PropertyTag
from .models.feature import PropertyFeature
from .models.label import PropertyLabel
from .models.agent import PropertyAgent
from .models.agency import RealEstateAgency
from src.real_estate.utils.cache_admin import PropertyCacheManager, TypeCacheManager
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

@receiver([post_save, post_delete], sender=ListingType)
@receiver([post_save, post_delete], sender=PropertyTag)
@receiver([post_save, post_delete], sender=PropertyFeature)
@receiver([post_save, post_delete], sender=PropertyLabel)
@receiver([post_save, post_delete], sender=PropertyAgent)
@receiver([post_save, post_delete], sender=RealEstateAgency)
def invalidate_public_real_estate_taxonomy_cache(sender, **kwargs):
    model_patterns = {
        ListingType: "public:real_estate:state:*",
        PropertyTag: "public:real_estate:tag:*",
        PropertyFeature: "public:real_estate:feature:*",
        PropertyLabel: "public:real_estate:label:*",
        PropertyAgent: "public:real_estate:agent:*",
        RealEstateAgency: "public:real_estate:agency:*",
    }
    pattern = model_patterns.get(sender)
    if pattern:
        cache.delete_pattern(pattern)

@receiver(post_save, sender=Property)
def track_property_creation(sender, instance, created, **kwargs):
    if created and instance.created_by:
        profile = AdminProfile.objects.filter(admin_user=instance.created_by).first()
        if profile:
            AdminPerformanceService.track_content_creation(profile, 'property')

