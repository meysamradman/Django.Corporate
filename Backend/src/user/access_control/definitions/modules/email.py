EMAIL_PERMISSIONS = {
    'email.read': {
        'module': 'email',
        'action': 'read',
        'display_name': 'View Email Messages',
        'description': 'Allow viewing email messages, inbox, and statistics',
    },
    'email.create': {
        'module': 'email',
        'action': 'create',
        'display_name': 'Send Email Messages',
        'description': 'Allow sending and replying to email messages',
    },
    'email.update': {
        'module': 'email',
        'action': 'update',
        'display_name': 'Update Email Messages',
        'description': 'Allow updating email status, marking as read/unread',
    },
    'email.delete': {
        'module': 'email',
        'action': 'delete',
        'display_name': 'Delete Email Messages',
        'description': 'Allow deleting email messages',
    },
    'email.manage': {
        'module': 'email',
        'action': 'manage',
        'display_name': 'Manage Email Messages',
        'description': 'Full access to email messages (view, send, update, delete)',
    },
}
