from django.db import models
from django.core.validators import RegexValidator

from src.core.models.base import BaseModel


phone_validator = RegexValidator(
    regex=r'^[0-9+\-\s()]+$',
    message="Phone number must contain only digits, +, -, (), and spaces."
)


class ContactPhone(BaseModel):
    """
    Contact phone model following DJANGO_MODEL_STANDARDS.md conventions.
    Field ordering: Content → Order
    """
    # 2. Primary Content Fields
    phone_number = models.CharField(
        max_length=20,
        db_index=True,
        verbose_name="Phone Number",
        help_text="Phone number (landline) - example: 021-12345678",
        validators=[phone_validator]
    )
    label = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="Label",
        help_text="Label for phone number (e.g., Main Office, Support)"
    )
    
    # Order Field
    order = models.PositiveIntegerField(
        default=0,
        db_index=True,
        verbose_name="Display Order",
        help_text="Display order in list (lower numbers appear first)"
    )
    
    class Meta(BaseModel.Meta):
        db_table = 'settings_contact_phone'
        verbose_name = "Contact Phone"
        verbose_name_plural = "Contact Phones"
        ordering = ['order', '-created_at']
        indexes = [
            models.Index(fields=['is_active', 'order']),
        ]
    
    def __str__(self):
        label_text = f" ({self.label})" if self.label else ""
        return f"{self.phone_number}{label_text}"
