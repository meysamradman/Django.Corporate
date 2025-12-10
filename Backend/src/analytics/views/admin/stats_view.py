from rest_framework import viewsets
from rest_framework.decorators import action

from src.user.access_control import analytics_any_permission, RequirePermission
from src.user.access_control.definitions import PermissionValidator
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


class AdminStatsViewSet(viewsets.ViewSet):
    permission_classes = [analytics_any_permission]
    
    def get_permissions(self):
        permission_map = {
            'dashboard': [analytics_any_permission()],
            'users_stats': [RequirePermission('analytics.users.read')],
            'admins_stats': [RequirePermission('analytics.admins.read')],
            'content_stats': [RequirePermission('analytics.content.read')],
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
        """
        Get dashboard statistics - returns all stats, frontend filters based on permissions
        Requires: RequireModuleAccess('analytics') (base permission for analytics module)
        """
        clear_cache = request.query_params.get('clear_cache', '').lower() == 'true'
        
        if clear_cache:
            DashboardStatsService.clear_cache()
        
        data = DashboardStatsService.get_stats()
        return APIResponse.success(
            data=data,
            message=ANALYTICS_SUCCESS["dashboard_retrieved"]
        )
    
    @action(detail=False, methods=['get'])
    def users_stats(self, request):
        if not PermissionValidator.has_any_permission(request.user, ['analytics.stats.manage', 'analytics.users.read']):
            return APIResponse.error(
                message=ANALYTICS_ERRORS["not_authorized"],
                status_code=status.HTTP_403_FORBIDDEN
            )
        data = UserStatsService.get_stats()
        return APIResponse.success(
            data=data,
            message=ANALYTICS_SUCCESS["users_stats_retrieved"]
        )
    
    @action(detail=False, methods=['get'])
    def admins_stats(self, request):
        if not PermissionValidator.has_any_permission(request.user, ['analytics.stats.manage', 'analytics.admins.read']):
            return APIResponse.error(
                message=ANALYTICS_ERRORS["not_authorized"],
                status_code=status.HTTP_403_FORBIDDEN
            )
        data = AdminStatsService.get_stats()
        return APIResponse.success(
            data=data,
            message=ANALYTICS_SUCCESS["admins_stats_retrieved"]
        )
    
    @action(detail=False, methods=['get'])
    def content_stats(self, request):
        if not PermissionValidator.has_any_permission(request.user, ['analytics.stats.manage', 'analytics.content.read']):
            return APIResponse.error(
                message=ANALYTICS_ERRORS["not_authorized"],
                status_code=status.HTTP_403_FORBIDDEN
            )
        data = ContentStatsService.get_stats()
        return APIResponse.success(
            data=data,
            message=ANALYTICS_SUCCESS["content_stats_retrieved"]
        )
    
    @action(detail=False, methods=['get'])
    def tickets_stats(self, request):
        if not PermissionValidator.has_any_permission(request.user, ['analytics.stats.manage', 'analytics.tickets.read']):
            return APIResponse.error(
                message=ANALYTICS_ERRORS["not_authorized"],
                status_code=status.HTTP_403_FORBIDDEN
            )
        if request.query_params.get('clear_cache', '').lower() == 'true':
            TicketStatsService.clear_cache()
        
        data = TicketStatsService.get_stats()
        return APIResponse.success(
            data=data,
            message=ANALYTICS_SUCCESS["tickets_stats_retrieved"]
        )
    
    @action(detail=False, methods=['get'])
    def emails_stats(self, request):
        if not PermissionValidator.has_any_permission(request.user, ['analytics.stats.manage', 'analytics.emails.read']):
            return APIResponse.error(
                message=ANALYTICS_ERRORS["not_authorized"],
                status_code=status.HTTP_403_FORBIDDEN
            )
        if request.query_params.get('clear_cache', '').lower() == 'true':
            EmailStatsService.clear_cache()
        
        data = EmailStatsService.get_stats()
        return APIResponse.success(
            data=data,
            message=ANALYTICS_SUCCESS["emails_stats_retrieved"]
        )
    
    @action(detail=False, methods=['get'])
    def system_stats(self, request):
        if not PermissionValidator.has_any_permission(request.user, ['analytics.stats.manage', 'analytics.system.read']):
            return APIResponse.error(
                message=ANALYTICS_ERRORS["not_authorized"],
                status_code=status.HTTP_403_FORBIDDEN
            )
        if request.query_params.get('clear_cache', '').lower() == 'true':
            SystemStatsService.clear_cache()
        
        data = SystemStatsService.get_stats()
        return APIResponse.success(
            data=data,
            message=ANALYTICS_SUCCESS["system_stats_retrieved"]
        )

