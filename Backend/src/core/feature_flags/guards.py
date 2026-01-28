from rest_framework.exceptions import PermissionDenied
from .services import is_feature_active
from .feature_config import get_feature_config

def ensure_feature_enabled(feature_key: str, error_message: str = None):
    if not is_feature_active(feature_key):
        if error_message is None:
            config = get_feature_config(feature_key)
            error_message = config.get('error_message') or f"{feature_key.capitalize()} feature is currently disabled"
        raise PermissionDenied(error_message)

def ensure_portfolio_enabled():
    config = get_feature_config('portfolio')
    ensure_feature_enabled('portfolio', config.get('error_message'))

def ensure_blog_enabled():
    config = get_feature_config('blog')
    ensure_feature_enabled('blog', config.get('error_message'))

def ensure_ai_enabled():
    config = get_feature_config('ai')
    ensure_feature_enabled('ai', config.get('error_message'))

def ensure_chatbot_enabled():
    config = get_feature_config('chatbot')
    ensure_feature_enabled('chatbot', config.get('error_message'))

def ensure_ticket_enabled():
    config = get_feature_config('ticket')
    ensure_feature_enabled('ticket', config.get('error_message'))

def ensure_email_enabled():
    config = get_feature_config('email')
    ensure_feature_enabled('email', config.get('error_message'))

def ensure_page_enabled():
    config = get_feature_config('page')
    ensure_feature_enabled('page', config.get('error_message'))

def ensure_form_enabled():
    config = get_feature_config('form')
    ensure_feature_enabled('form', config.get('error_message'))

def ensure_real_estate_enabled():
    config = get_feature_config('real_estate')
    ensure_feature_enabled('real_estate', config.get('error_message'))