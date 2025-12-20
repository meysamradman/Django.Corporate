from .admin_permission import RequireModuleAccess, SuperAdminOnly, AdminRolePermission
from src.user.access_control.definitions import PermissionValidator

class BlogPermission(RequireModuleAccess):
    def __init__(self):
        super().__init__('blog')

class PortfolioPermission(RequireModuleAccess):
    def __init__(self):
        super().__init__('portfolio')

class AnalyticsPermission(RequireModuleAccess):
    def __init__(self):
        super().__init__('analytics')


class AnalyticsAnyPermission(AdminRolePermission):
    def has_permission(self, request, view):
        if getattr(request.user, 'is_superuser', False) or getattr(request.user, 'is_admin_full', False):
            return True
        
        analytics_permissions = [
            'analytics.manage',
            'analytics.stats.manage',
            'analytics.dashboard.read',
            'analytics.users.read',
            'analytics.admins.read',
            'analytics.content.read',
            'analytics.tickets.read',
            'analytics.emails.read',
            'analytics.system.read',
        ]
        
        return PermissionValidator.has_any_permission(request.user, analytics_permissions)

class MediaPermission(RequireModuleAccess):
    def __init__(self):
        super().__init__('media')

class UserPermission(RequireModuleAccess):
    def __init__(self):
        super().__init__('users')

class AdminPermission(RequireModuleAccess):
    def __init__(self):
        super().__init__('admin')

class AIPermission(RequireModuleAccess):
    def __init__(self):
        super().__init__('ai')


class AIAnyPermission(AdminRolePermission):
    def has_permission(self, request, view):
        if getattr(request.user, 'is_superuser', False) or getattr(request.user, 'is_admin_full', False):
            return True
        
        ai_permissions = [
            'ai.manage',
            'ai.chat.manage',
            'ai.content.manage',
            'ai.image.manage',
            'ai.audio.manage',
            'ai.settings.personal.manage',
        ]
        
        return PermissionValidator.has_any_permission(request.user, ai_permissions)

class PanelPermission(RequireModuleAccess):
    def __init__(self):
        super().__init__('panel')

class EmailPermission(RequireModuleAccess):
    def __init__(self):
        super().__init__('email')

class TicketPermission(RequireModuleAccess):
    def __init__(self):
        super().__init__('ticket')

class ChatbotPermission(RequireModuleAccess):
    def __init__(self):
        super().__init__('chatbot')

class FormPermission(RequireModuleAccess):
    def __init__(self):
        super().__init__('form')

class PagePermission(RequireModuleAccess):
    def __init__(self):
        super().__init__('page')


blog_permission = BlogPermission
portfolio_permission = PortfolioPermission
analytics_permission = AnalyticsPermission
analytics_any_permission = AnalyticsAnyPermission
media_permission = MediaPermission
user_permission = UserPermission
admin_permission = AdminPermission
ai_permission = AIPermission
ai_any_permission = AIAnyPermission
panel_permission = PanelPermission
email_permission = EmailPermission
ticket_permission = TicketPermission
chatbot_permission = ChatbotPermission
form_permission = FormPermission
page_permission = PagePermission
super_admin_permission = SuperAdminOnly

__all__ = [
    'BlogPermission',
    'PortfolioPermission',
    'AnalyticsPermission',
    'AnalyticsAnyPermission',
    'MediaPermission',
    'UserPermission',
    'AdminPermission',
    'AIPermission',
    'AIAnyPermission',
    'PanelPermission',
    'EmailPermission',
    'TicketPermission',
    'ChatbotPermission',
    'FormPermission',
    'PagePermission',
    'blog_permission',
    'portfolio_permission',
    'analytics_permission',
    'analytics_any_permission',
    'media_permission',
    'user_permission',
    'admin_permission',
    'ai_permission',
    'ai_any_permission',
    'panel_permission',
    'email_permission',
    'ticket_permission',
    'chatbot_permission',
    'form_permission',
    'page_permission',
    'super_admin_permission',
]
