from django.urls import include, path
from .services import is_feature_active
from .models import FeatureFlag


def feature_urls(feature_key: str, prefix: str, urlconf: str):
    """
    Conditionally register URLs based on feature flag status.
    
    Args:
        feature_key: Feature flag key (e.g., 'portfolio', 'blog')
        prefix: URL prefix (e.g., 'api/portfolio/')
        urlconf: URL configuration module (e.g., 'src.portfolio.urls')
        
    Returns:
        list: List of URL patterns if feature is active, empty list otherwise
    """
    try:
        # Check if feature flag exists in database
        flag_exists = FeatureFlag.objects.filter(key=feature_key).exists()
        
        if flag_exists:
            # If flag exists, use its status
            if is_feature_active(feature_key):
                return [path(prefix, include(urlconf))]
        else:
            # If flag doesn't exist, default to active (backward compatibility)
            # This ensures existing apps work before feature flags are configured
            return [path(prefix, include(urlconf))]
    except Exception:
        # If database is not ready, default to active (backward compatibility)
        return [path(prefix, include(urlconf))]
    return []


def feature_path(feature_key: str, prefix: str, view, name: str = None):
    """
    Conditionally register a single URL path based on feature flag status.
    
    Args:
        feature_key: Feature flag key (e.g., 'portfolio', 'blog')
        prefix: URL prefix (e.g., 'api/admin/portfolio/export/')
        view: View class or function
        name: URL name (optional)
        
    Returns:
        list: List with one URL pattern if feature is active, empty list otherwise
    """
    try:
        # Check if feature flag exists in database
        flag_exists = FeatureFlag.objects.filter(key=feature_key).exists()
        
        if flag_exists:
            # If flag exists, use its status
            if is_feature_active(feature_key):
                return [path(prefix, view.as_view() if hasattr(view, 'as_view') else view, name=name)]
        else:
            # If flag doesn't exist, default to active (backward compatibility)
            # This ensures existing apps work before feature flags are configured
            return [path(prefix, view.as_view() if hasattr(view, 'as_view') else view, name=name)]
    except Exception:
        # If database is not ready, default to active (backward compatibility)
        return [path(prefix, view.as_view() if hasattr(view, 'as_view') else view, name=name)]
    return []

