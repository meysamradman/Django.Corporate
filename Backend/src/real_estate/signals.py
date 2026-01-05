"""  
Signals for Real Estate app
"""
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


# ❌ این signal غیرفعال شد چون با insert کار نمی‌کند
# search_vector اکنون در save() method مدیریت می‌شود

# @receiver(pre_save, sender=Property)
# def update_property_search_vector(sender, instance, **kwargs):
#     """
#     Update search_vector for PostgreSQL full-text search
#     This runs before save() to ensure the vector is calculated correctly
#     """
#     if instance.title and instance.description:
#         try:
#             # Build search vector with weights
#             # Weight 'A' for title (most important)
#             # Weight 'B' for description (important)
#             # Weight 'C' for address (less important)
#             instance.search_vector = (
#                 SearchVector('title', weight='A') +
#                 SearchVector('description', weight='B') +
#                 SearchVector('address', weight='C')
#             )
#         except (AttributeError, TypeError, ValueError):
#             # Skip if SearchVectorField is not properly initialized
#             # This can happen during migrations or if PostgreSQL extensions are not installed
#             pass

