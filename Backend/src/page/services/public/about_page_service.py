from src.page.services.about_page_service import get_about_page


def get_public_about_page():
    return get_about_page()

__all__ = [
    'get_public_about_page',
]
