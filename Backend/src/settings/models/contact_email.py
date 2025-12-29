from django.db import models
from django.core.validators import EmailValidator

from src.core.models.base import BaseModel


class ContactEmail(BaseModel):

    email = models.EmailField(
        max_length=255,
        unique=True,
        db_index=True,
        verbose_name="Email",
        help_text="Contact email address",
        validators=[EmailValidator()]
    )
    label = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="Label",
        help_text="Label for email (e.g., Support, Sales, Info)"
    )
    
    # Order Field
    order = models.PositiveIntegerField(
        default=0,
        db_index=True,
        verbose_name="Display Order",
        help_text="Display order in list (lower numbers appear first)"
    )
    
    class Meta(BaseModel.Meta):
        db_table = 'settings_contact_email'
        verbose_name = "Contact Email"
        verbose_name_plural = "Contact Emails"
        ordering = ['order', '-created_at']
        indexes = [
            # Composite index for filtering active items by order
            models.Index(fields=['is_active', 'order']),
            # Email already has unique=True which creates an index
        ]
    
    def __str__(self):
        label_text = f" ({self.label})" if self.label else ""
        return f"{self.email}{label_text}"
