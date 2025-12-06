from django.db import models
from src.core.models import BaseModel


class PaymentProvider(BaseModel):
    
    PROVIDER_TYPES = (
        ('zarinpal', 'Zarinpal'),
        ('idpay', 'IDPay'),
        ('saman', 'Saman'),
        ('mellat', 'Mellat'),
        ('custom', 'Custom'),
    )
    
    name = models.CharField(
        max_length=100,
        unique=True,
        db_index=True,
        verbose_name="Name",
        help_text="Provider name"
    )
    provider_type = models.CharField(
        max_length=20,
        choices=PROVIDER_TYPES,
        db_index=True,
        verbose_name="Provider Type",
        help_text="Type of payment provider"
    )
    
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name="Active",
        help_text="Whether this provider is active"
    )
    is_default = models.BooleanField(
        default=False,
        db_index=True,
        verbose_name="Default",
        help_text="Default payment provider"
    )
    
    merchant_id = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="Merchant ID",
        help_text="Merchant ID from provider"
    )
    api_key = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="API Key",
        help_text="API key from provider"
    )
    sandbox_mode = models.BooleanField(
        default=False,
        db_index=True,
        verbose_name="Sandbox Mode",
        help_text="Use sandbox/test environment"
    )
    
    callback_url = models.URLField(
        null=True,
        blank=True,
        verbose_name="Callback URL",
        help_text="Default callback URL"
    )
    
    config = models.JSONField(
        null=True,
        blank=True,
        default=dict,
        verbose_name="Configuration",
        help_text="Additional provider configuration"
    )
    
    class Meta(BaseModel.Meta):
        db_table = 'payment_providers'
        verbose_name = 'Payment Provider'
        verbose_name_plural = 'Payment Providers'
        ordering = ['-is_default', 'name']
        indexes = [
            models.Index(fields=['provider_type', 'is_active']),
            models.Index(fields=['is_active', 'is_default']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['provider_type'],
                condition=models.Q(is_default=True),
                name='unique_default_provider'
            ),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.get_provider_type_display()})"
    
    def save(self, *args, **kwargs):
        if self.is_default:
            PaymentProvider.objects.filter(
                is_default=True
            ).exclude(pk=self.pk).update(is_default=False)
        
        super().save(*args, **kwargs)
