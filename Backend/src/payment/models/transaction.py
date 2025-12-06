from django.db import models
from src.core.models import BaseModel


class Transaction(BaseModel):
    
    TYPE_CHOICES = (
        ('payment', 'Payment'),
        ('refund', 'Refund'),
        ('verification', 'Verification'),
    )
    
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('success', 'Success'),
        ('failed', 'Failed'),
    )
    
    payment = models.ForeignKey(
        'payment.Payment',
        on_delete=models.CASCADE,
        related_name='transactions',
        db_index=True,
        verbose_name="Payment",
        help_text="Payment this transaction belongs to"
    )
    
    transaction_type = models.CharField(
        max_length=20,
        choices=TYPE_CHOICES,
        default='payment',
        db_index=True,
        verbose_name="Transaction Type",
        help_text="Type of transaction"
    )
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        db_index=True,
        verbose_name="Status",
        help_text="Transaction status"
    )
    
    provider_transaction_id = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        db_index=True,
        verbose_name="Provider Transaction ID",
        help_text="Transaction ID from payment provider"
    )
    authority = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        db_index=True,
        verbose_name="Authority",
        help_text="Payment authority (for Zarinpal)"
    )
    ref_id = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        db_index=True,
        verbose_name="Reference ID",
        help_text="Reference ID from provider"
    )
    
    amount = models.BigIntegerField(
        db_index=True,
        verbose_name="Amount",
        help_text="Transaction amount"
    )
    
    request_data = models.JSONField(
        null=True,
        blank=True,
        default=dict,
        verbose_name="Request Data",
        help_text="Request data sent to provider"
    )
    response_data = models.JSONField(
        null=True,
        blank=True,
        default=dict,
        verbose_name="Response Data",
        help_text="Response data from provider"
    )
    
    error_message = models.TextField(
        null=True,
        blank=True,
        verbose_name="Error Message",
        help_text="Error message if transaction failed"
    )
    
    processed_at = models.DateTimeField(
        null=True,
        blank=True,
        db_index=True,
        verbose_name="Processed At",
        help_text="Date and time when transaction was processed"
    )
    
    class Meta(BaseModel.Meta):
        db_table = 'payment_transactions'
        verbose_name = 'Transaction'
        verbose_name_plural = 'Transactions'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['payment', 'transaction_type', '-created_at']),
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['provider_transaction_id']),
            models.Index(fields=['authority']),
            models.Index(fields=['ref_id']),
        ]
    
    def __str__(self):
        return f"{self.get_transaction_type_display()} - {self.payment.payment_number} - {self.status}"
