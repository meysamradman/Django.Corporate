
from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from django.contrib.postgres.search import SearchVector

from .models.property import Property
from src.user.services.admin_performance_service import AdminPerformanceService
from src.user.models.admin_profile import AdminProfile

@receiver(post_save, sender=Property)
def track_property_creation(sender, instance, created, **kwargs):
    if created and instance.created_by:
        profile = AdminProfile.objects.filter(admin_user=instance.created_by).first()
        if profile:
            AdminPerformanceService.track_content_creation(profile, 'property')

