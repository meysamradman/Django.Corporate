"""
Communication Module Permissions
Email and Ticket management permissions
"""

COMMUNICATION_PERMISSIONS = {
    # Email - CRUD permissions (like other content modules)
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
    
    # Ticket - CRUD permissions (like Email)
    'ticket.read': {
        'module': 'ticket',
        'action': 'read',
        'display_name': 'View Tickets',
        'description': 'Allow viewing support tickets and messages',
    },
    'ticket.create': {
        'module': 'ticket',
        'action': 'create',
        'display_name': 'Create Tickets',
        'description': 'Allow creating and replying to support tickets',
    },
    'ticket.update': {
        'module': 'ticket',
        'action': 'update',
        'display_name': 'Update Tickets',
        'description': 'Allow updating ticket status, priority, and assignments',
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
        'description': 'Full access to ticket management (view, create, update, delete)',
    },
}

