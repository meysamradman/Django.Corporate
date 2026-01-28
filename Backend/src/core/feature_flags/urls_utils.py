from django.urls import include, path
from .services import is_feature_active
from .models import FeatureFlag

def feature_urls(feature_key: str, prefix: str, urlconf: str):
    try:
        flag_exists = FeatureFlag.objects.filter(key=feature_key).exists()
        
        if flag_exists:
            if is_feature_active(feature_key):
                return [path(prefix, include(urlconf))]
        else:
            return [path(prefix, include(urlconf))]
    except Exception:
        return [path(prefix, include(urlconf))]
    return []

def feature_path(feature_key: str, prefix: str, view, name: str = None):
    try:
        flag_exists = FeatureFlag.objects.filter(key=feature_key).exists()
        
        if flag_exists:
            if is_feature_active(feature_key):
                return [path(prefix, view.as_view() if hasattr(view, 'as_view') else view, name=name)]
        else:
            return [path(prefix, view.as_view() if hasattr(view, 'as_view') else view, name=name)]
    except Exception:
        return [path(prefix, view.as_view() if hasattr(view, 'as_view') else view, name=name)]
    return []
