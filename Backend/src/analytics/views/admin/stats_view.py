from rest_framework import viewsets
from rest_framework.decorators import action

from src.user.access_control import analytics_any_permission, RequirePermission
from rest_framework import status
from src.analytics.messages.messages import ANALYTICS_ERRORS
from src.core.responses.response import APIResponse
from src.analytics.messages.messages import ANALYTICS_SUCCESS
from src.analytics.services.stats import (
    DashboardStatsService,
    UserStatsService,
    AdminStatsService,
    ContentStatsService,
    TicketStatsService,
    EmailStatsService,
    SystemStatsService
)
from src.analytics.utils.cache_shared import should_bypass_cache

class AdminStatsViewSet(viewsets.ViewSet):
    permission_classes = [analytics_any_permission]
    
    def get_permissions(self):
        permission_map = {
            'users_stats': [RequirePermission('analytics.users.read')],
            'admins_stats': [RequirePermission('analytics.admins.read')],
            'content_stats': [RequirePermission('analytics.content.read')],
            'content_trend': [RequirePermission('analytics.content.read')],
            'tickets_stats': [RequirePermission('analytics.tickets.read')],
            'emails_stats': [RequirePermission('analytics.emails.read')],
            'system_stats': [RequirePermission('analytics.system.read')],
        }
        
        action = getattr(self, 'action', None)
        if action and action in permission_map:
            permissions = permission_map[action]
        else:
            permissions = [analytics_any_permission()]
        return permissions
    
    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        
        clear_cache = request.query_params.get('clear_cache', '').lower() == 'true'
        use_cache = not should_bypass_cache(request)
        
        if clear_cache:
            DashboardStatsService.clear_cache()
        
        data = DashboardStatsService.get_stats(use_cache=use_cache)
        return APIResponse.success(
            data=data,
            message=ANALYTICS_SUCCESS["dashboard_retrieved"]
        )
    
    @action(detail=False, methods=['get'])
    def users_stats(self, request):
        use_cache = not should_bypass_cache(request)
        data = UserStatsService.get_stats(use_cache=use_cache)
        return APIResponse.success(
            data=data,
            message=ANALYTICS_SUCCESS["users_stats_retrieved"]
        )
    
    @action(detail=False, methods=['get'])
    def admins_stats(self, request):
        use_cache = not should_bypass_cache(request)
        data = AdminStatsService.get_stats(use_cache=use_cache)
        return APIResponse.success(
            data=data,
            message=ANALYTICS_SUCCESS["admins_stats_retrieved"]
        )
    
    @action(detail=False, methods=['get'])
    def content_stats(self, request):
        use_cache = not should_bypass_cache(request)
        data = ContentStatsService.get_stats(use_cache=use_cache)
        return APIResponse.success(
            data=data,
            message=ANALYTICS_SUCCESS["content_stats_retrieved"]
        )
    
    @action(detail=False, methods=['get'])
    def content_trend(self, request):
        use_cache = not should_bypass_cache(request)
        data = ContentStatsService.get_monthly_trend(use_cache=use_cache)
        return APIResponse.success(
            data=data,
            message=ANALYTICS_SUCCESS["content_stats_retrieved"]
        )
    
    @action(detail=False, methods=['get'])
    def tickets_stats(self, request):
        if request.query_params.get('clear_cache', '').lower() == 'true':
            TicketStatsService.clear_cache()
        use_cache = not should_bypass_cache(request)
        
        data = TicketStatsService.get_stats(use_cache=use_cache)
        return APIResponse.success(
            data=data,
            message=ANALYTICS_SUCCESS["tickets_stats_retrieved"]
        )
    
    @action(detail=False, methods=['get'])
    def emails_stats(self, request):
        if request.query_params.get('clear_cache', '').lower() == 'true':
            EmailStatsService.clear_cache()
        use_cache = not should_bypass_cache(request)
        
        data = EmailStatsService.get_stats(use_cache=use_cache)
        return APIResponse.success(
            data=data,
            message=ANALYTICS_SUCCESS["emails_stats_retrieved"]
        )
    
    @action(detail=False, methods=['get'])
    def system_stats(self, request):
        if request.query_params.get('clear_cache', '').lower() == 'true':
            SystemStatsService.clear_cache()
        use_cache = not should_bypass_cache(request)
        
        data = SystemStatsService.get_stats(use_cache=use_cache)
        return APIResponse.success(
            data=data,
            message=ANALYTICS_SUCCESS["system_stats_retrieved"]
        )

