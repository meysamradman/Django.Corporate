from django.core.exceptions import ValidationError
from django.db import transaction
from src.page.models import TermsPage


def get_terms_page():
    try:
        return TermsPage.get_page()
    except Exception as e:
        raise ValidationError("terms_page_retrieve_failed")


@transaction.atomic
def update_terms_page(validated_data):
    try:
        page = TermsPage.get_page()
        
        for field, value in validated_data.items():
            setattr(page, field, value)
        
        page.save()
        return page
    except Exception as e:
        raise ValidationError("terms_page_update_failed")
