# Django core
from django.core.exceptions import ValidationError
from django.db import transaction

# Project models
from src.page.models import TermsPage


def get_terms_page():
    """
    دریافت صفحه قوانین و مقررات (Singleton)
    
    Returns:
        TermsPage: صفحه قوانین و مقررات
    
    Raises:
        ValidationError: در صورت خطا
    """
    try:
        return TermsPage.get_page()
    except Exception as e:
        raise ValidationError("terms_page_retrieve_failed")


@transaction.atomic
def update_terms_page(validated_data):
    """
    به‌روزرسانی صفحه قوانین و مقررات
    
    Args:
        validated_data: داده‌های معتبر شده
    
    Returns:
        TermsPage: صفحه به‌روزرسانی شده
    
    Raises:
        ValidationError: در صورت خطا
    """
    try:
        page = TermsPage.get_page()
        
        for field, value in validated_data.items():
            setattr(page, field, value)
        
        page.save()
        return page
    except Exception as e:
        raise ValidationError("terms_page_update_failed")

