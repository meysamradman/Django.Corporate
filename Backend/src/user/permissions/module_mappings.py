"""
Module mappings for permission system.
Defines which modules are related to each main module.
"""

from typing import Dict, List

MODULE_MAPPINGS: Dict[str, List[str]] = {
    'blog': ['blog', 'blog_categories', 'blog_tags', 'media'],
    'portfolio': ['portfolio', 'portfolio_categories', 'portfolio_tags', 'portfolio_options', 'portfolio_option_values', 'media'],
    'users': ['users'],
    'media': ['media'],
    'panel': ['panel'],
    'pages': ['pages'],
    'settings': ['settings'],
    'email': ['email'],
    'ai': ['ai'],
    'chatbot': ['chatbot'],
    'ticket': ['ticket'],
    'statistics': ['statistics'],
    'forms': ['forms'],
    'admin': ['admin'],
}
