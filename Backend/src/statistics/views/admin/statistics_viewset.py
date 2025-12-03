from rest_framework import viewsets
from rest_framework.decorators import action

from src.user.authorization.admin_permission import AdminRolePermission, RequirePermission
from src.core.responses.response import APIResponse
from src.statistics.messages.messages import STATISTICS_SUCCESS
from src.statistics.services.admin import (
    DashboardStatsService,
    UserStatsService,
    AdminStatsService,
    ContentStatsService,
    TicketStatsService,
    EmailStatsService,
    SystemStatsService
)


class AdminStatisticsViewSet(viewsets.ViewSet):
    permission_classes = [AdminRolePermission]
    
    def get_permissions(self):
        permission_map = {
            'dashboard': [AdminRolePermission()],
            'users_stats': [RequirePermission('statistics.users.read')],
            'admins_stats': [RequirePermission('statistics.admins.read')],
            'content_stats': [RequirePermission('statistics.content.read')],
            'tickets_stats': [RequirePermission('statistics.tickets.read')],
            'emails_stats': [RequirePermission('statistics.emails.read')],
            'system_stats': [RequirePermission('statistics.system.read')],
        }
        
        action = getattr(self, 'action', None)
        permissions = permission_map.get(action, [AdminRolePermission()])
        return permissions
    
    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        if request.query_params.get('clear_cache', '').lower() == 'true':
            DashboardStatsService.clear_cache()
        
        data = DashboardStatsService.get_stats()
        return APIResponse.success(
            data=data,
            message=STATISTICS_SUCCESS["dashboard_retrieved"]
        )
    
    @action(detail=False, methods=['get'])
    def users_stats(self, request):
        data = UserStatsService.get_stats()
        return APIResponse.success(
            data=data,
            message=STATISTICS_SUCCESS["users_stats_retrieved"]
        )
    
    @action(detail=False, methods=['get'])
    def admins_stats(self, request):
        data = AdminStatsService.get_stats()
        return APIResponse.success(
            data=data,
            message=STATISTICS_SUCCESS["admins_stats_retrieved"]
        )
    
    @action(detail=False, methods=['get'])
    def content_stats(self, request):
        data = ContentStatsService.get_stats()
        return APIResponse.success(
            data=data,
            message=STATISTICS_SUCCESS["content_stats_retrieved"]
        )
    
    @action(detail=False, methods=['get'])
    def tickets_stats(self, request):
        if request.query_params.get('clear_cache', '').lower() == 'true':
            TicketStatsService.clear_cache()
        
        data = TicketStatsService.get_stats()
        return APIResponse.success(
            data=data,
            message=STATISTICS_SUCCESS["tickets_stats_retrieved"]
        )
    
    @action(detail=False, methods=['get'])
    def emails_stats(self, request):
        if request.query_params.get('clear_cache', '').lower() == 'true':
            EmailStatsService.clear_cache()
        
        data = EmailStatsService.get_stats()
        return APIResponse.success(
            data=data,
            message=STATISTICS_SUCCESS["emails_stats_retrieved"]
        )
    
    @action(detail=False, methods=['get'])
    def system_stats(self, request):
        if request.query_params.get('clear_cache', '').lower() == 'true':
            SystemStatsService.clear_cache()
        
        data = SystemStatsService.get_stats()
        return APIResponse.success(
            data=data,
            message=STATISTICS_SUCCESS["system_stats_retrieved"]
        )

