MANAGEMENT_PERMISSIONS = {
    'forms.manage': {
        'module': 'forms',
        'action': 'manage',
        'display_name': 'Manage Forms',
        'description': 'Allow full access to contact form fields (view, create, update, delete)',
        'is_standalone': True,
    },
    'settings.manage': {
        'module': 'settings',
        'action': 'manage',
        'display_name': 'Manage Settings',
        'description': 'Allow full access to website general settings (view and update)',
        'is_standalone': True,
    },
    'chatbot.manage': {
        'module': 'chatbot',
        'action': 'manage',
        'display_name': 'Manage Chatbot',
        'description': 'Full access to chatbot settings and FAQs',
        'is_standalone': True,
    },
    # 🔒 REMOVED: 'panel.manage' - Panel Settings فقط برای Super Admin (غیرقابل تفویض)
    # 'panel.manage': {
    #     'module': 'panel',
    #     'action': 'manage',
    #     'display_name': 'Manage Panel Settings',
    #     'description': 'Allow full access to panel settings (view, update, logo upload)',
    #     'is_standalone': True,
    # },
    'pages.manage': {
        'module': 'pages',
        'action': 'manage',
        'display_name': 'Manage Static Pages',
        'description': 'Allow full access to static pages (view, update)',
        'is_standalone': True,
    },
}
