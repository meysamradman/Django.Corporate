AI_PERMISSIONS = {
    'ai.manage': {
        'module': 'ai',
        'action': 'manage',
        'display_name': 'Full AI Access',
        'description': 'Access to all AI features (chat, content, image, audio)',
        'is_standalone': True,
    },
    'ai.chat.manage': {
        'module': 'ai',
        'action': 'manage',
        'display_name': 'AI Chat',
        'description': 'Access to AI chat and intelligent responses',
    },
    'ai.content.manage': {
        'module': 'ai',
        'action': 'manage',
        'display_name': 'AI Content Generation',
        'description': 'Access to text and content generation with AI',
    },
    'ai.image.manage': {
        'module': 'ai',
        'action': 'manage',
        'display_name': 'AI Image Generation',
        'description': 'Access to image generation with AI',
    },
    'ai.audio.manage': {
        'module': 'ai',
        'action': 'manage',
        'display_name': 'AI Audio Generation',
        'description': 'Access to text-to-speech and audio generation with AI',
    },
    'ai.settings.shared.manage': {
        'module': 'ai',
        'action': 'manage',
        'display_name': 'Manage Shared API Keys',
        'description': 'Manage shared API Keys for all admins (Super Admin only)',
        'requires_superadmin': True,
    },
    'ai.settings.personal.manage': {
        'module': 'ai',
        'action': 'manage',
        'display_name': 'Manage Personal API Key',
        'description': 'Manage personal API Key for exclusive use',
        'requires_superadmin': False,
    },
    'ai.models.manage': {
        'module': 'ai',
        'action': 'manage',
        'display_name': 'Manage AI Capability Models',
        'description': 'Manage provider and model selection for AI capabilities (Super Admin only)',
        'requires_superadmin': True,
    },
}
