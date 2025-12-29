"""
Real Estate Constants
مقادیر ثابت و لیست‌های گزینه‌های املاک
"""
from .document_types import DOCUMENT_TYPE_CHOICES, get_document_type_label

__all__ = [
    # Document Types (فقط این!)
    'DOCUMENT_TYPE_CHOICES',
    'get_document_type_label',
    # بقیه ویژگی‌ها در PropertyFeature, PropertyType, PropertyLabel هستند
]
