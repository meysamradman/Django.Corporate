"""
Statistics Module Permissions
Granular permissions for security and privacy
"""

STATISTICS_PERMISSIONS = {
    # Statistics - Granular permissions for security and privacy
    'statistics.dashboard.read': {
        'module': 'statistics',
        'action': 'read',
        'display_name': 'View Dashboard Overview',
        'description': 'View basic dashboard statistics (safe, general info)',
    },
    'statistics.users.read': {
        'module': 'statistics',
        'action': 'read',
        'display_name': 'View Users Statistics',
        'description': 'View detailed user statistics (sensitive)',
    },
    'statistics.admins.read': {
        'module': 'statistics',
        'action': 'read',
        'display_name': 'View Admins Statistics',
        'description': 'View admin user statistics (highly sensitive)',
    },
    'statistics.content.read': {
        'module': 'statistics',
        'action': 'read',
        'display_name': 'View Content Statistics',
        'description': 'View portfolio, blog, media statistics',
    },
    'statistics.financial.read': {
        'module': 'statistics',
        'action': 'read',
        'display_name': 'View Financial Statistics',
        'description': 'View revenue, sales, financial data (future-proof)',
    },
    'statistics.export': {
        'module': 'statistics',
        'action': 'export',
        'display_name': 'Export Statistics',
        'description': 'Export statistics data to Excel/CSV',
    },
    # Manage - Full access to all statistics operations
    'statistics.manage': {
        'module': 'statistics',
        'action': 'manage',
        'display_name': 'Manage Statistics',
        'description': 'Full access to all statistics features (view, export)',
    },
}

