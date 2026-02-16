from src.page.services.terms_page_service import get_terms_page


def get_public_terms_page():
    return get_terms_page()

__all__ = [
    'get_public_terms_page',
]
