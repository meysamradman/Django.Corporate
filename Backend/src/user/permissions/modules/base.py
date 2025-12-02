BASE_PERMISSIONS = {
    'dashboard.read': {
        'module': 'statistics',
        'action': 'read',
        'display_name': 'View Dashboard',
        'description': 'Access the admin dashboard (also in base permissions)',
    },
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

