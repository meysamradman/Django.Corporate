from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from src.analytics.utils.cache_admin import AnalyticsAdminCacheManager

APP_INVALIDATION_MAP = {
    'user': (
        AnalyticsAdminCacheManager.invalidate_dashboard,
        AnalyticsAdminCacheManager.invalidate_users,
        AnalyticsAdminCacheManager.invalidate_admins,
    ),
    'real_estate': (
        AnalyticsAdminCacheManager.invalidate_dashboard,
        AnalyticsAdminCacheManager.invalidate_content,
        AnalyticsAdminCacheManager.invalidate_content_trend,
    ),
    'blog': (
        AnalyticsAdminCacheManager.invalidate_dashboard,
        AnalyticsAdminCacheManager.invalidate_content,
        AnalyticsAdminCacheManager.invalidate_content_trend,
    ),
    'portfolio': (
        AnalyticsAdminCacheManager.invalidate_dashboard,
        AnalyticsAdminCacheManager.invalidate_content,
    ),
    'media': (
        AnalyticsAdminCacheManager.invalidate_dashboard,
        AnalyticsAdminCacheManager.invalidate_content,
        AnalyticsAdminCacheManager.invalidate_system,
    ),
    'ticket': (
        AnalyticsAdminCacheManager.invalidate_dashboard,
        AnalyticsAdminCacheManager.invalidate_tickets,
    ),
    'email': (
        AnalyticsAdminCacheManager.invalidate_dashboard,
        AnalyticsAdminCacheManager.invalidate_emails,
    ),
    'form': (
        AnalyticsAdminCacheManager.invalidate_dashboard,
        AnalyticsAdminCacheManager.invalidate_forms,
    ),
    'ai': (
        AnalyticsAdminCacheManager.invalidate_dashboard,
        AnalyticsAdminCacheManager.invalidate_ai,
    ),
}

def _invalidate_by_app_label(app_label: str) -> None:
    handlers = APP_INVALIDATION_MAP.get(app_label)
    if not handlers:
        return

    for invalidate in handlers:
        invalidate()

@receiver(post_save, dispatch_uid='analytics_admin_stats_invalidation_on_save')
def invalidate_admin_stats_cache_on_save(sender, **kwargs):
    app_label = sender._meta.app_label
    _invalidate_by_app_label(app_label)

@receiver(post_delete, dispatch_uid='analytics_admin_stats_invalidation_on_delete')
def invalidate_admin_stats_cache_on_delete(sender, **kwargs):
    app_label = sender._meta.app_label
    _invalidate_by_app_label(app_label)
