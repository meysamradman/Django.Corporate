"""
Module mappings for permission system.
Defines which modules are related to each main module.
"""

from typing import Dict, List

MODULE_MAPPINGS: Dict[str, List[str]] = {
    'blog': ['blog', 'blog_categories', 'blog_tags', 'media'],
    'portfolio': ['portfolio', 'portfolio_categories', 'portfolio_tags', 'portfolio_options', 'portfolio_option_values', 'media'],
    'real_estate': ['real_estate', 'property', 'property_agent', 'real_estate_agency', 'property_type', 'property_state', 'property_label', 'property_feature', 'property_tag', 'media'],
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
