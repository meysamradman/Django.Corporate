"""
Panel & Pages Module Permissions
Management permissions for panel settings and static pages
"""

PANEL_PERMISSIONS = {
    # Panel - single manage permission (either full panel control or none)
    'panel.manage': {
        'module': 'panel',
        'action': 'manage',
        'display_name': 'Manage Panel Settings',
        'description': 'Allow full access to panel settings (view, update, logo upload)',
        'is_standalone': True,
    },
    # Pages - single manage permission (either full pages control or none)
    'pages.manage': {
        'module': 'pages',
        'action': 'manage',
        'display_name': 'Manage Static Pages',
        'description': 'Allow full access to static pages (view, update)',
        'is_standalone': True,
    },
}

