from django.core.exceptions import ValidationError
from django.db import transaction
from django.core.cache import cache

from src.page.models import TermsPage
from src.page.messages.messages import TERMS_PAGE_ERRORS
from src.page.utils.cache import PageCacheKeys, PageCacheManager

def get_terms_page():
    cache_key = PageCacheKeys.terms_page()
    page = cache.get(cache_key)
    
    if page is None:
        try:
            page = TermsPage.get_page()
            cache.set(cache_key, page, 3600)  # 1 hour cache
        except Exception as e:
            raise ValidationError(TERMS_PAGE_ERRORS["terms_page_retrieve_failed"])
    
    return page

@transaction.atomic
def update_terms_page(validated_data):
    try:
        page = TermsPage.get_page()
        
        for field, value in validated_data.items():
            setattr(page, field, value)
        
        page.save()
        PageCacheManager.invalidate_terms_page()
        return page
    except Exception as e:
        raise ValidationError(TERMS_PAGE_ERRORS["terms_page_update_failed"])
