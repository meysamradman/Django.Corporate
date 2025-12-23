FEATURE_CONFIG = {
    'portfolio': {
        'url_patterns': [
            r'^/api/admin/portfolio',
            r'^/api/(portfolio|portfolios)/',
        ],
        'module_name': 'portfolio',
        'error_message': 'Portfolio feature is currently disabled',
    },
    'blog': {
        'url_patterns': [
            r'^/api/admin/blog',
            r'^/api/(blog|blogs|blog-category|blog-tag)',
        ],
        'module_name': 'blog',
        'error_message': 'Blog feature is currently disabled',
    },
    'ai': {
        'url_patterns': [
            r'^/api/(ai|ai-)/',
        ],
        'module_name': 'ai',
        'error_message': 'AI feature is currently disabled',
    },
    'chatbot': {
        'url_patterns': [
            r'^/api/(chatbot|chatbots)/',
        ],
        'module_name': 'chatbot',
        'error_message': 'Chatbot feature is currently disabled',
    },
    'ticket': {
        'url_patterns': [
            r'^/api/(ticket|tickets)/',
        ],
        'module_name': 'ticket',
        'error_message': 'Ticket feature is currently disabled',
    },
    'email': {
        'url_patterns': [
            r'^/api/email/',
        ],
        'module_name': 'email',
        'error_message': 'Email feature is currently disabled',
    },
    'page': {
        'url_patterns': [
            r'^/api/(page|pages)/',
        ],
        'module_name': 'pages',
        'error_message': 'Page feature is currently disabled',
    },
    'form': {
        'url_patterns': [
            r'^/api/(form|forms)/',
        ],
        'module_name': 'forms',
        'error_message': 'Form feature is currently disabled',
    },
    'real_estate': {
        'url_patterns': [
            r'^/api/admin/property',
            r'^/api/admin/property-type',
            r'^/api/admin/property-state',
            r'^/api/admin/property-label',
            r'^/api/admin/property-feature',
            r'^/api/admin/property-tag',
            r'^/api/admin/property-agent',
            r'^/api/admin/real-estate-agency',
            r'^/api/(property|properties|real-estate)/',
        ],
        'module_name': 'real_estate',
        'error_message': 'Real Estate feature is currently disabled',
    },
}


def get_url_mapping():
    mapping = {}
    for feature_key, config in FEATURE_CONFIG.items():
        for pattern in config['url_patterns']:
            mapping[pattern] = feature_key
    return mapping


def get_module_to_feature_flag():
    mapping = {}
    for feature_key, config in FEATURE_CONFIG.items():
        module_name = config.get('module_name', feature_key)
        mapping[module_name] = feature_key
    return mapping


def get_feature_config(feature_key: str):
    return FEATURE_CONFIG.get(feature_key, {})


def get_all_feature_keys():
    return list(FEATURE_CONFIG.keys())

