from src.settings.models import FooterSection


def get_public_footer_sections():
    return (
        FooterSection.objects.filter(is_active=True)
        .prefetch_related('links')
        .order_by('order', '-created_at')
    )
