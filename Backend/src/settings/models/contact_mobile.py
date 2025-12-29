from django.db import models
from django.core.validators import RegexValidator

from src.core.models.base import BaseModel


mobile_validator = RegexValidator(
    regex=r'^(09|\+989)[0-9]{9}$',
    message="Mobile number must start with 09 or +989 and be 11 digits."
)


class ContactMobile(BaseModel):

    mobile_number = models.CharField(
        max_length=15,
        unique=True,
        db_index=True,
        verbose_name="Mobile Number",
        help_text="Mobile number - must start with 09 (example: 09123456789)",
        validators=[mobile_validator]
    )
    label = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="Label",
        help_text="Label for mobile number (e.g., Support, Sales)"
    )
    
    # Order Field
    order = models.PositiveIntegerField(
        default=0,
        db_index=True,
        verbose_name="Display Order",
        help_text="Display order in list (lower numbers appear first)"
    )
    
    class Meta(BaseModel.Meta):
        db_table = 'settings_contact_mobile'
        verbose_name = "Contact Mobile"
        verbose_name_plural = "Contact Mobiles"
        ordering = ['order', '-created_at']
        indexes = [
            models.Index(fields=['is_active', 'order']),
        ]
    
    def __str__(self):
        label_text = f" ({self.label})" if self.label else ""
        return f"{self.mobile_number}{label_text}"
