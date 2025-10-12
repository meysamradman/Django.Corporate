"""
Media Admin - تنظیمات Django Admin برای رسانه
"""
# ✅ Import نسبی - چون در __init__.py هستیم
from .media import ImageMediaAdmin

__all__ = [
    'ImageMediaAdmin'
]