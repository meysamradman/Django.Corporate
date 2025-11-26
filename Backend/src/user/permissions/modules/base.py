"""
Base Module Permissions
Dashboard and Profile permissions (also in BASE_ADMIN_PERMISSIONS)
"""

BASE_PERMISSIONS = {
    # Dashboard - در BASE هم هست ولی برای نمایش در all_permissions باید اینجا هم باشه
    'dashboard.read': {
        'module': 'statistics',
        'action': 'read',
        'display_name': 'View Dashboard',
        'description': 'Access the admin dashboard (also in base permissions)',
    },
    # Profile - در BASE هم هست ولی برای نمایش در all_permissions باید اینجا هم باشه
    'profile.read': {
        'module': 'admin',
        'action': 'read',
        'display_name': 'View Personal Profile',
        'description': 'View own admin profile (also in base permissions)',
    },
    'profile.update': {
        'module': 'admin',
        'action': 'update',
        'display_name': 'Update Personal Profile',
        'description': 'Update own admin profile (also in base permissions)',
    },
}

