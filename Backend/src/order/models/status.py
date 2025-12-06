from django.db import models
from src.core.models import BaseModel


class OrderStatusHistory(BaseModel):
    order = models.ForeignKey(
        'order.Order',
        on_delete=models.CASCADE,
        related_name='status_history',
        db_index=True,
        verbose_name="Order",
        help_text="Order this status change belongs to"
    )
    
    old_status = models.CharField(
        max_length=20,
        null=True,
        blank=True,
        verbose_name="Old Status",
        help_text="Previous status"
    )
    new_status = models.CharField(
        max_length=20,
        db_index=True,
        verbose_name="New Status",
        help_text="New status"
    )
    
    old_payment_status = models.CharField(
        max_length=20,
        null=True,
        blank=True,
        verbose_name="Old Payment Status",
        help_text="Previous payment status"
    )
    new_payment_status = models.CharField(
        max_length=20,
        null=True,
        blank=True,
        verbose_name="New Payment Status",
        help_text="New payment status"
    )
    
    changed_by = models.ForeignKey(
        'user.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='order_status_changes',
        verbose_name="Changed By",
        help_text="User who made this change"
    )
    
    notes = models.TextField(
        blank=True,
        null=True,
        verbose_name="Notes",
        help_text="Additional notes about this status change"
    )
    
    class Meta(BaseModel.Meta):
        db_table = 'order_status_history'
        verbose_name = 'Order Status History'
        verbose_name_plural = 'Order Status Histories'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['order', '-created_at']),
            models.Index(fields=['new_status', '-created_at']),
        ]
    
    def __str__(self):
        status_change = f"{self.old_status} → {self.new_status}" if self.old_status else self.new_status
        return f"Order #{self.order.order_number}: {status_change}"
