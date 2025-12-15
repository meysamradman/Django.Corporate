"""
Guard functions for feature flags in service layer.
Use these to add an extra layer of security even if URLs are registered.
"""
from rest_framework.exceptions import PermissionDenied
from .services import is_feature_active


def ensure_feature_enabled(feature_key: str, error_message: str = None):
    """
    Ensure a feature is enabled, raise PermissionDenied if not.
    
    Args:
        feature_key: Feature flag key
        error_message: Custom error message (optional)
        
    Raises:
        PermissionDenied: If feature is not active
    """
    if not is_feature_active(feature_key):
        if error_message is None:
            error_message = f"{feature_key.capitalize()} feature is currently disabled"
        raise PermissionDenied(error_message)


def ensure_portfolio_enabled():
    """Ensure portfolio feature is enabled."""
    ensure_feature_enabled('portfolio', "Portfolio feature is currently disabled")


def ensure_blog_enabled():
    """Ensure blog feature is enabled."""
    ensure_feature_enabled('blog', "Blog feature is currently disabled")


def ensure_ai_enabled():
    """Ensure AI feature is enabled."""
    ensure_feature_enabled('ai', "AI feature is currently disabled")


def ensure_chatbot_enabled():
    """Ensure chatbot feature is enabled."""
    ensure_feature_enabled('chatbot', "Chatbot feature is currently disabled")


def ensure_ticket_enabled():
    """Ensure ticket feature is enabled."""
    ensure_feature_enabled('ticket', "Ticket feature is currently disabled")


def ensure_email_enabled():
    """Ensure email feature is enabled."""
    ensure_feature_enabled('email', "Email feature is currently disabled")


def ensure_page_enabled():
    """Ensure page feature is enabled."""
    ensure_feature_enabled('page', "Page feature is currently disabled")


def ensure_form_enabled():
    """Ensure form feature is enabled."""
    ensure_feature_enabled('form', "Form feature is currently disabled")

