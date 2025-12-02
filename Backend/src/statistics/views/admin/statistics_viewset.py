"""
Statistics ViewSet - Unified ViewSet for all statistics endpoints
Each action has its own permission requirement
"""
from rest_framework import viewsets
from rest_framework.decorators import action
from src.user.authorization.admin_permission import AdminRolePermission, RequirePermission
from src.core.responses import APIResponse
from ...services.admin import (
    DashboardStatsService,
    UserStatsService,
    AdminStatsService,
    ContentStatsService,
    TicketStatsService,
    EmailStatsService,
    SystemStatsService
)


class AdminStatisticsViewSet(viewsets.ViewSet):
    """
    Statistics ViewSet - Organized and scalable
    Each endpoint uses dedicated service class and permission
    """
    permission_classes = [AdminRolePermission]  # Base permission for all actions
    
    def get_permissions(self):
        """Dynamic permission assignment based on action"""
        permission_map = {
            'dashboard': [AdminRolePermission()],  # Base admin permission
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
        """
        GET /api/admin/statistics/dashboard/
        General dashboard - All admins (in BASE_ADMIN_PERMISSIONS)
        Returns: Non-sensitive overview stats
        """
        # Clear cache if requested (for debugging/force refresh)
        if request.query_params.get('clear_cache', '').lower() == 'true':
            DashboardStatsService.clear_cache()
        
        data = DashboardStatsService.get_stats()
        return APIResponse.success(
            data=data,
            message="Dashboard overview retrieved successfully"
        )
    
    @action(detail=False, methods=['get'])
    def users_stats(self, request):
        """
        GET /api/admin/statistics/users_stats/
        User statistics - Requires statistics.users.read
        Returns: User counts, active users, etc.
        """
        data = UserStatsService.get_stats()
        return APIResponse.success(
            data=data,
            message="User statistics retrieved successfully"
        )
    
    @action(detail=False, methods=['get'])
    def admins_stats(self, request):
        """
        GET /api/admin/statistics/admins_stats/
        Admin statistics - Requires statistics.admins.read
        Returns: Admin counts, active admins, etc.
        """
        data = AdminStatsService.get_stats()
        return APIResponse.success(
            data=data,
            message="Admin statistics retrieved successfully"
        )
    
    @action(detail=False, methods=['get'])
    def content_stats(self, request):
        """
        GET /api/admin/statistics/content_stats/
        Content statistics - Requires statistics.content.read
        Returns: Portfolio, blog, media, categories stats
        """
        data = ContentStatsService.get_stats()
        return APIResponse.success(
            data=data,
            message="Content statistics retrieved successfully"
        )
    
    @action(detail=False, methods=['get'])
    def tickets_stats(self, request):
        """
        GET /api/admin/statistics/tickets_stats/
        Ticket statistics - Requires statistics.tickets.read
        Returns: Ticket status counts, priority distribution, unanswered tickets
        """
        # Clear cache if requested (for debugging/force refresh)
        if request.query_params.get('clear_cache', '').lower() == 'true':
            TicketStatsService.clear_cache()
        
        data = TicketStatsService.get_stats()
        return APIResponse.success(
            data=data,
            message="Ticket statistics retrieved successfully"
        )
    
    @action(detail=False, methods=['get'])
    def emails_stats(self, request):
        """
        GET /api/admin/statistics/emails_stats/
        Email statistics - Requires statistics.emails.read
        Returns: Email status counts, source distribution, average response time, unanswered emails
        """
        # Clear cache if requested (for debugging/force refresh)
        if request.query_params.get('clear_cache', '').lower() == 'true':
            EmailStatsService.clear_cache()
        
        data = EmailStatsService.get_stats()
        return APIResponse.success(
            data=data,
            message="Email statistics retrieved successfully"
        )
    
    @action(detail=False, methods=['get'])
    def system_stats(self, request):
        """
        GET /api/admin/statistics/system_stats/
        System statistics - Requires statistics.system.read
        Returns: Database size, Cache status, Storage usage by type, Recent uploads
        """
        # Clear cache if requested (for debugging/force refresh)
        if request.query_params.get('clear_cache', '').lower() == 'true':
            SystemStatsService.clear_cache()
        
        data = SystemStatsService.get_stats()
        return APIResponse.success(
            data=data,
            message="System statistics retrieved successfully"
        )

