from django.utils.translation import gettext_lazy as _

ANALYTICS_SOURCE_CHOICES = [
    ('web', _('Website')),
    ('app', _('Mobile Application')),
    ('desktop', _('Desktop Software')),
    ('bot', _('Bot/Scraper')),
    ('other', _('Other')),
]

DEVICE_CHOICES = [
    ('mobile', _('Mobile')),
    ('desktop', _('Desktop')),
    ('tablet', _('Tablet')),
    ('other', _('Other')),
]
