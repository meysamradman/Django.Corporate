PORTFOLIO_PERMISSIONS = {
    'portfolio.read': {
        'module': 'portfolio',
        'action': 'read',
        'display_name': 'View Portfolios',
        'description': 'Allow viewing portfolio items list and details',
    },
    'portfolio.create': {
        'module': 'portfolio',
        'action': 'create',
        'display_name': 'Create Portfolio',
        'description': 'Allow creating new portfolio items',
    },
    'portfolio.update': {
        'module': 'portfolio',
        'action': 'update',
        'display_name': 'Update Portfolio',
        'description': 'Allow updating portfolio items',
    },
    'portfolio.delete': {
        'module': 'portfolio',
        'action': 'delete',
        'display_name': 'Delete Portfolio',
        'description': 'Allow deleting portfolio items',
    },
    'portfolio.option.delete': {
        'module': 'portfolio',
        'action': 'delete',
        'display_name': 'Delete Portfolio Option',
        'description': 'Allow deleting portfolio options',
    },
}
