from django.db import models
from django.core.validators import EmailValidator

from src.core.models.base import BaseModel


class ContactEmail(BaseModel):
    
    email = models.EmailField(
        max_length=255,
        verbose_name="Email",
        help_text="Contact email address",
        validators=[EmailValidator()],
        unique=True
    )
    
    label = models.CharField(
        max_length=100,
        verbose_name="Label",
        help_text="Label for email (e.g., Support, Sales, Info)",
        blank=True
    )
    
    order = models.PositiveIntegerField(
        default=0,
        verbose_name="Display Order",
        help_text="Display order in list (lower numbers appear first)",
        db_index=True
    )
    
    class Meta(BaseModel.Meta):
        db_table = 'settings_contact_email'
        verbose_name = "Contact Email"
        verbose_name_plural = "Contact Emails"
        ordering = ['order', '-created_at']
        indexes = [
            models.Index(fields=['is_active', 'order']),
        ]
    
    def __str__(self):
        label_text = f" ({self.label})" if self.label else ""
        return f"{self.email}{label_text}"
