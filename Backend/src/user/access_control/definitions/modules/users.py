USERS_PERMISSIONS = {
    'admin.read': {
        'module': 'admin',
        'action': 'read',
        'display_name': 'View Admins',
        'description': 'Allow viewing admin users list and details',
        'requires_superadmin': True,
    },
    'admin.create': {
        'module': 'admin',
        'action': 'create',
        'display_name': 'Create Admin',
        'description': 'Allow creating new admin users',
        'requires_superadmin': True,
    },
    'admin.update': {
        'module': 'admin',
        'action': 'update',
        'display_name': 'Update Admin',
        'description': 'Allow updating admin user information and profiles',
        'requires_superadmin': True,
    },
    'admin.delete': {
        'module': 'admin',
        'action': 'delete',
        'display_name': 'Delete Admin',
        'description': 'Allow deleting admin users',
        'requires_superadmin': True,
    },
    'users.read': {
        'module': 'users',
        'action': 'read',
        'display_name': 'View Users',
        'description': 'Allow viewing regular users list and details',
    },
    'users.create': {
        'module': 'users',
        'action': 'create',
        'display_name': 'Create User',
        'description': 'Allow creating new regular users',
    },
    'users.update': {
        'module': 'users',
        'action': 'update',
        'display_name': 'Update User',
        'description': 'Allow updating regular user information and profiles',
    },
    'users.delete': {
        'module': 'users',
        'action': 'delete',
        'display_name': 'Delete User',
        'description': 'Allow deleting regular users',
    },
}
