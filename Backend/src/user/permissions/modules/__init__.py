from .base import BASE_PERMISSIONS
from .panel import PANEL_PERMISSIONS
from .media import MEDIA_PERMISSIONS
from .users import USERS_PERMISSIONS
# NOTE: CONTENT_PERMISSIONS (blog/portfolio) moved to app-specific locations
# These permissions should be defined in blog/portfolio apps or corporate module
# from .content import CONTENT_PERMISSIONS
from .communication import COMMUNICATION_PERMISSIONS
from .ai import AI_PERMISSIONS
from .statistics import STATISTICS_PERMISSIONS
from .management import MANAGEMENT_PERMISSIONS

__all__ = [
    'BASE_PERMISSIONS',
    'PANEL_PERMISSIONS',
    'MEDIA_PERMISSIONS',
    'USERS_PERMISSIONS',
    # 'CONTENT_PERMISSIONS',  # Moved to app-specific locations
    'COMMUNICATION_PERMISSIONS',
    'AI_PERMISSIONS',
    'STATISTICS_PERMISSIONS',
    'MANAGEMENT_PERMISSIONS',
]
