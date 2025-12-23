"""
Signals for Real Estate app
"""
from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from django.contrib.postgres.search import SearchVector

from .models.property import Property


@receiver(pre_save, sender=Property)
def update_property_search_vector(sender, instance, **kwargs):
    """
    Update search_vector for PostgreSQL full-text search
    This runs before save() to ensure the vector is calculated correctly
    """
    if instance.title and instance.description:
        try:
            # Build search vector with weights
            # Weight 'A' for title (most important)
            # Weight 'B' for description (important)
            # Weight 'C' for address (less important)
            instance.search_vector = (
                SearchVector('title', weight='A') +
                SearchVector('description', weight='B') +
                SearchVector('address', weight='C')
            )
        except (AttributeError, TypeError, ValueError):
            # Skip if SearchVectorField is not properly initialized
            # This can happen during migrations or if PostgreSQL extensions are not installed
            pass

