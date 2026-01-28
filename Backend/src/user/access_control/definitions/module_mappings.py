

from typing import Dict, List

MODULE_MAPPINGS: Dict[str, List[str]] = {
    'blog': ['blog', 'blog_categories', 'blog_tags', 'media'],
    'portfolio': ['portfolio', 'portfolio_categories', 'portfolio_tags', 'portfolio_options', 'portfolio_option_values', 'media'],
    'real_estate': ['real_estate', 'real_estate_properties', 'real_estate_agents', 'real_estate_agencies', 'media'],
    'real_estate.property': ['real_estate_properties'],
    'users': ['users'],
    'media': ['media'],
    'panel': ['panel'],
    'pages': ['pages'],
    'settings': ['settings'],
    'email': ['email'],
    'ai': ['ai'],
    'chatbot': ['chatbot'],
    'ticket': ['ticket'],
    'forms': ['forms'],
    'admin': ['admin'],
    'analytics': ['analytics'],
}
