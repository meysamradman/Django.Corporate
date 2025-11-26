"""
AI Module Permissions
All AI-related permissions including chat, content, image generation, and API settings
"""

AI_PERMISSIONS = {
    # AI - Divided system (like Statistics)
    # 1. AI Chat
    'ai.chat.manage': {
        'module': 'ai',
        'action': 'manage',
        'display_name': 'AI Chat',
        'description': 'Access to AI chat and intelligent responses',
    },
    # 2. Content Generation
    'ai.content.manage': {
        'module': 'ai',
        'action': 'manage',
        'display_name': 'AI Content Generation',
        'description': 'Access to text and content generation with AI',
    },
    # 3. Image Generation
    'ai.image.manage': {
        'module': 'ai',
        'action': 'manage',
        'display_name': 'AI Image Generation',
        'description': 'Access to image generation with AI',
    },
    # 4. Audio Generation (Text-to-Speech)
    'ai.audio.manage': {
        'module': 'ai',
        'action': 'manage',
        'display_name': 'AI Audio Generation',
        'description': 'Access to text-to-speech and audio generation with AI',
    },
    # 5. Full AI Access
    'ai.manage': {
        'module': 'ai',
        'action': 'manage',
        'display_name': 'Full AI Access',
        'description': 'Access to all AI features (chat, content, image, audio)',
    },
    # 6. Shared API Settings (Super Admin only)
    'ai.settings.shared.manage': {
        'module': 'ai',
        'action': 'manage',
        'display_name': 'Manage Shared API Keys',
        'description': 'Manage shared API Keys for all admins (Super Admin only)',
        'requires_superadmin': True,
    },
    # 7. Personal API Settings (Admins)
    'ai.settings.personal.manage': {
        'module': 'ai',
        'action': 'manage',
        'display_name': 'Manage Personal API Key',
        'description': 'Manage personal API Key for exclusive use',
    },
}

