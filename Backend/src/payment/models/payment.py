from django.db import models
from django.utils import timezone
from src.core.models import BaseModel


class Payment(BaseModel):
    
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
        ('refunded', 'Refunded'),
    )
    
    payment_number = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name="Payment Number",
        help_text="Unique payment number"
    )
    
    order = models.OneToOneField(
        'order.Order',
        on_delete=models.PROTECT,
        related_name='payment',
        db_index=True,
        verbose_name="Order",
        help_text="Order this payment belongs to"
    )
    
    provider = models.ForeignKey(
        'payment.PaymentProvider',
        on_delete=models.PROTECT,
        related_name='payments',
        db_index=True,
        verbose_name="Payment Provider",
        help_text="Payment provider used for this payment"
    )
    
    amount = models.BigIntegerField(
        db_index=True,
        verbose_name="Amount",
        help_text="Payment amount (in smallest currency unit)"
    )
    currency = models.CharField(
        max_length=3,
        default='IRR',
        db_index=True,
        verbose_name="Currency",
        help_text="Currency code"
    )
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        db_index=True,
        verbose_name="Status",
        help_text="Payment status"
    )
    
    callback_url = models.URLField(
        null=True,
        blank=True,
        verbose_name="Callback URL",
        help_text="Callback URL for payment gateway"
    )
    return_url = models.URLField(
        null=True,
        blank=True,
        verbose_name="Return URL",
        help_text="Return URL after payment"
    )
    
    provider_transaction_id = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        db_index=True,
        verbose_name="Provider Transaction ID",
        help_text="Transaction ID from payment provider"
    )
    
    paid_at = models.DateTimeField(
        null=True,
        blank=True,
        db_index=True,
        verbose_name="Paid At",
        help_text="Date and time when payment was completed"
    )
    
    failure_reason = models.TextField(
        null=True,
        blank=True,
        verbose_name="Failure Reason",
        help_text="Reason for payment failure"
    )
    
    metadata = models.JSONField(
        null=True,
        blank=True,
        default=dict,
        verbose_name="Metadata",
        help_text="Additional payment metadata"
    )
    
    class Meta(BaseModel.Meta):
        db_table = 'payment_payments'
        verbose_name = 'Payment'
        verbose_name_plural = 'Payments'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['order', 'status', '-created_at']),
            models.Index(fields=['provider', 'status', '-created_at']),
            models.Index(fields=['payment_number']),
            models.Index(fields=['provider_transaction_id']),
        ]
    
    def __str__(self):
        return f"Payment #{self.payment_number} - {self.amount} {self.currency}"
    
    def save(self, *args, **kwargs):
        if not self.payment_number:
            timestamp = int(timezone.now().timestamp())
            self.payment_number = f"PAY-{timestamp}-{self.public_id.hex[:8].upper()}"
        
        if self.status == 'completed' and not self.paid_at:
            self.paid_at = timezone.now()
        
        super().save(*args, **kwargs)
    
    @property
    def is_paid(self):
        return self.status == 'completed'
    
    @property
    def can_be_refunded(self):
        return self.status == 'completed' and self.order.status != 'refunded'
