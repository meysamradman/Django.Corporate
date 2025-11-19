from django.core.cache import cache
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone

from src.user.authorization import StatisticsManagerAccess
from src.user.permissions.validator import PermissionValidator
from src.core.responses import APIResponse
from src.portfolio.models.portfolio import Portfolio
from src.portfolio.models.category import PortfolioCategory
from src.media.models.media import ImageMedia, VideoMedia, AudioMedia, DocumentMedia
from django.contrib.auth import get_user_model

User = get_user_model()


class AdminStatisticsViewSet(viewsets.ViewSet):
    permission_classes = [StatisticsManagerAccess]

    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        # Base permission: همه ادمین‌ها می‌تونن statistics رو ببینن (read-only)
        # پس چک نمی‌کنیم statistics.read رو چون base permission هست
        cache_key = 'admin_stats_dashboard'
        data = cache.get(cache_key)
        if not data:
            # Count all media types
            total_media = (
                ImageMedia.objects.count() +
                VideoMedia.objects.count() +
                AudioMedia.objects.count() +
                DocumentMedia.objects.count()
            )
            
            data = {
                'total_users': User.objects.filter(user_type='user').count(),
                'total_admins': User.objects.filter(is_staff=True, user_type='admin').count(),
                'total_portfolios': Portfolio.objects.count(),
                'total_media': total_media,
                'total_posts': 0,  # Placeholder for blog posts
                'generated_at': timezone.now().isoformat(),
            }
            cache.set(cache_key, data, 300)
        return Response(data, status=status.HTTP_200_OK)