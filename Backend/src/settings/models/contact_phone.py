from django.db import models
from django.core.validators import RegexValidator

from src.core.models.base import BaseModel


phone_validator = RegexValidator(
    regex=r'^[0-9+\-\s()]+$',
    message="Phone number must contain only digits, +, -, (), and spaces."
)


class ContactPhone(BaseModel):
    
    phone_number = models.CharField(
        max_length=20,
        verbose_name="Phone Number",
        help_text="Phone number (landline) - example: 021-12345678",
        validators=[phone_validator]
    )
    
    label = models.CharField(
        max_length=100,
        verbose_name="Label",
        help_text="Label for phone number (e.g., Main Office, Support)",
        blank=True
    )
    
    order = models.PositiveIntegerField(
        default=0,
        verbose_name="Display Order",
        help_text="Display order in list (lower numbers appear first)",
        db_index=True
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
