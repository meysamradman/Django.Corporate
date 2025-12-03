from django.core.exceptions import ValidationError
from django.db import transaction
from src.page.models import AboutPage


def get_about_page():
    try:
        return AboutPage.get_page()
    except Exception as e:
        raise ValidationError("about_page_retrieve_failed")


@transaction.atomic
def update_about_page(validated_data):
    try:
        page = AboutPage.get_page()
        
        for field, value in validated_data.items():
            setattr(page, field, value)
        
        page.save()
        return page
    except Exception as e:
        raise ValidationError("about_page_update_failed")
