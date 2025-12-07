TICKET_PERMISSIONS = {
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
