import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.django.base')
django.setup()

from src.blog.models import Blog
from src.portfolio.models import Portfolio
from src.real_estate.models import Property

print("=" * 60)
print("Check Created Data")
print("=" * 60)
print(f"Blog: {Blog.objects.count()}")
print(f"Portfolio: {Portfolio.objects.count()}")
print(f"Property (Real Estate): {Property.objects.count()}")
print("=" * 60)


