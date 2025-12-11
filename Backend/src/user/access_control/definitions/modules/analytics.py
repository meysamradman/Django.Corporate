ANALYTICS_PERMISSIONS = {
    'analytics.manage': {
        'module': 'analytics',
        'action': 'manage',
        'display_name': 'Manage Website Analytics',
        'description': 'Full access to website and app visit analytics (page views, top pages, countries, traffic statistics)',
        'is_standalone': True,
    },
    'analytics.stats.manage': {
        'module': 'analytics',
        'action': 'manage',
        'display_name': 'Manage All Statistics',
        'description': 'Full access to all app statistics (users, admins, content, tickets, emails, system)',
    },
    'analytics.users.read': {
        'module': 'analytics',
        'action': 'read',
        'display_name': 'View Users Statistics',
        'description': 'View detailed user statistics (sensitive)',
    },
    'analytics.admins.read': {
        'module': 'analytics',
        'action': 'read',
        'display_name': 'View Admins Statistics',
        'description': 'View admin user statistics (highly sensitive)',
    },
    'analytics.content.read': {
        'module': 'analytics',
        'action': 'read',
        'display_name': 'View Content Statistics',
        'description': 'View portfolio, blog, media statistics',
    },
    'analytics.tickets.read': {
        'module': 'analytics',
        'action': 'read',
        'display_name': 'View Tickets Statistics',
        'description': 'View support tickets statistics and analytics',
    },
    'analytics.emails.read': {
        'module': 'analytics',
        'action': 'read',
        'display_name': 'View Emails Statistics',
        'description': 'View email messages statistics and analytics',
    },
    'analytics.system.read': {
        'module': 'analytics',
        'action': 'read',
        'display_name': 'View System Statistics',
        'description': 'View system-level statistics (server, performance, logs)',
    },
}
