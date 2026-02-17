from django.core.exceptions import ValidationError
from django.db import transaction

from src.page.models import AboutPage
from src.page.messages.messages import ABOUT_PAGE_ERRORS
from src.page.utils.cache import PageCacheManager

def get_about_page():
    try:
        return AboutPage.get_page()
    except Exception:
        raise ValidationError(ABOUT_PAGE_ERRORS["about_page_retrieve_failed"])

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
