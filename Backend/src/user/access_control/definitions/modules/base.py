BASE_PERMISSIONS = {
    'dashboard.read': {
        'module': 'dashboard',
        'action': 'read',
        'display_name': 'View Dashboard',
        'description': 'Access the admin dashboard overview (safe, general info)',
        'is_base': True,
    },
    'profile.read': {
        'module': 'admin',
        'action': 'read',
        'display_name': 'View Personal Profile',
        'description': 'View own admin profile information',
        'is_base': True,
    },
    'profile.update': {
        'module': 'admin',
        'action': 'update',
        'display_name': 'Update Personal Profile',
        'description': 'Update own admin profile information',
        'is_base': True,
    },
}

