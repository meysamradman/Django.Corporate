"""
Management Module Permissions
Forms, Settings, and Chatbot management permissions
"""

MANAGEMENT_PERMISSIONS = {
    # Forms
    'forms.manage': {
        'module': 'forms',
        'action': 'manage',
        'display_name': 'Manage Forms',
        'description': 'Allow full access to contact form fields (view, create, update, delete)',
        'is_standalone': True,
    },
    
    # Settings
    'settings.manage': {
        'module': 'settings',
        'action': 'manage',
        'display_name': 'Manage Settings',
        'description': 'Allow full access to website general settings (view and update)',
        'is_standalone': True,
    },
    
    # Chatbot - Standalone (only manage permission)
    'chatbot.manage': {
        'module': 'chatbot',
        'action': 'manage',
        'display_name': 'Manage Chatbot',
        'description': 'Full access to chatbot settings and FAQs',
        'is_standalone': True,
    },
}

