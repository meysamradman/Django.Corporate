from django.db import models
from django.core.validators import MinLengthValidator

from src.core.models.base import BaseModel

class ContactFormField(BaseModel):

    FIELD_TYPE_CHOICES = [
        ('text', 'Text'),
        ('email', 'Email'),
        ('phone', 'Phone'),
        ('textarea', 'Textarea'),
        ('select', 'Select'),
        ('checkbox', 'Checkbox'),
        ('radio', 'Radio'),
        ('number', 'Number'),
        ('date', 'Date'),
        ('url', 'URL'),
    ]

    field_type = models.CharField(
        max_length=20,
        choices=FIELD_TYPE_CHOICES,
        default='text',
        db_index=True,
        verbose_name="Field Type",
        help_text="Type of field (text, email, select, etc.)"
    )

    field_key = models.CharField(
        max_length=100,
        unique=True,
        db_index=True,
        verbose_name="Field Key",
        help_text="Unique key for the field (e.g., name, email, phone)",
        validators=[MinLengthValidator(2, message="Field key must be at least 2 characters.")]
    )
    label = models.CharField(
        max_length=200,
        verbose_name="Label",
        help_text="Field label displayed to users"
    )
    placeholder = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name="Placeholder",
        help_text="Placeholder text inside the field (optional)"
    )

    required = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name="Required",
        help_text="Whether this field is required"
    )

    order = models.PositiveIntegerField(
        default=0,
        db_index=True,
        verbose_name="Display Order",
        help_text="Display order in form (lower numbers appear first)"
    )

    platforms = models.JSONField(
        default=list,
        verbose_name="Platforms",
        help_text="List of platforms where this field is displayed: ['website', 'mobile_app']"
    )
    options = models.JSONField(
        default=list,
        blank=True,
        verbose_name="Options",
        help_text="Options for select field: [{'value': 'option1', 'label': 'Option 1'}]"
    )
    validation_rules = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="Validation Rules",
        help_text="Validation rules: {'min_length': 3, 'max_length': 100, 'pattern': '...'}"
    )

    class Meta(BaseModel.Meta):
        db_table = 'form_contact_fields'
        verbose_name = "Contact Form Field"
        verbose_name_plural = "Contact Form Fields"
        ordering = ['order', 'field_key']
        indexes = [
            models.Index(fields=['is_active', 'order']),
            models.Index(fields=['field_type', 'is_active']),
        ]

    def __str__(self):
        return f"{self.label} ({self.field_key})"

    def clean(self):
        super().clean()

        if not isinstance(self.platforms, list):
            raise models.ValidationError("Platforms must be a list.")

        valid_platforms = ['website', 'mobile_app']
        for platform in self.platforms:
            if platform not in valid_platforms:
                raise models.ValidationError("Invalid platform.")

        if self.field_type in ['select', 'radio']:
            if not self.options or not isinstance(self.options, list):
                raise models.ValidationError(f"{self.field_type} fields must have at least one option.")

            for option in self.options:
                if not isinstance(option, dict) or 'value' not in option or 'label' not in option:
                    raise models.ValidationError("Each option must have value and label.")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    @property
    def is_for_website(self):
        return 'website' in (self.platforms or [])

    @property
    def is_for_mobile_app(self):
        return 'mobile_app' in (self.platforms or [])