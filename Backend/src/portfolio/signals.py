from django.db.models.signals import post_save
from django.dispatch import receiver
from src.portfolio.models.portfolio import Portfolio
from src.user.services.admin_performance_service import AdminPerformanceService
from src.user.models.admin_profile import AdminProfile

@receiver(post_save, sender=Portfolio)
def track_portfolio_creation(sender, instance, created, **kwargs):
    if created and instance.created_by:
        profile = AdminProfile.objects.filter(admin_user=instance.created_by).first()
        if profile:
            AdminPerformanceService.track_content_creation(profile, 'portfolio')
