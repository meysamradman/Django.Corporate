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
}
