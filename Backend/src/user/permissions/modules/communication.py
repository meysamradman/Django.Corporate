COMMUNICATION_PERMISSIONS = {
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
    
    'ticket.read': {
        'module': 'ticket',
        'action': 'read',
        'display_name': 'View Tickets',
        'description': 'Allow viewing support tickets and messages',
    },
    'ticket.update': {
        'module': 'ticket',
        'action': 'update',
        'display_name': 'Update Tickets',
        'description': 'Allow updating ticket status, priority, assignments, and replying to tickets',
    },
    'ticket.delete': {
        'module': 'ticket',
        'action': 'delete',
        'display_name': 'Delete Tickets',
        'description': 'Allow deleting support tickets',
    },
    'ticket.manage': {
        'module': 'ticket',
        'action': 'manage',
        'display_name': 'Manage Tickets',
        'description': 'Full access to ticket management (view, reply, update, delete)',
    },
}

