from django.core.exceptions import ValidationError
from django.db import transaction
from django.core.cache import cache

from src.page.models import AboutPage
from src.page.messages.messages import ABOUT_PAGE_ERRORS
from src.page.utils.cache import PageCacheKeys, PageCacheManager


def get_about_page():
    cache_key = PageCacheKeys.about_page()
    page = cache.get(cache_key)
    
    if page is None:
        try:
            page = AboutPage.get_page()
            cache.set(cache_key, page, 3600)  # 1 hour cache
        except Exception as e:
            raise ValidationError(ABOUT_PAGE_ERRORS["about_page_retrieve_failed"])
    
    return page


@transaction.atomic
def update_about_page(validated_data):
    try:
        page = AboutPage.get_page()
        
        for field, value in validated_data.items():
            setattr(page, field, value)
        
        page.save()
        PageCacheManager.invalidate_about_page()
        return page
    except Exception as e:
        raise ValidationError(ABOUT_PAGE_ERRORS["about_page_update_failed"])
