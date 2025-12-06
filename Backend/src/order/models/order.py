from django.db import models
from django.core.validators import MinValueValidator
from django.utils import timezone
from src.core.models import BaseModel


class Order(BaseModel):
    
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('processing', 'Processing'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
        ('refunded', 'Refunded'),
    )
    
    PAYMENT_STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    )
    
    order_number = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name="Order Number",
        help_text="Unique order number"
    )
    
    user = models.ForeignKey(
        'user.User',
        on_delete=models.PROTECT,
        related_name='orders',
        db_index=True,
        verbose_name="User",
        help_text="User who placed this order"
    )
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        db_index=True,
        verbose_name="Status",
        help_text="Order status"
    )
    
    payment_status = models.CharField(
        max_length=20,
        choices=PAYMENT_STATUS_CHOICES,
        default='pending',
        db_index=True,
        verbose_name="Payment Status",
        help_text="Payment status"
    )
    
    subtotal = models.BigIntegerField(
        db_index=True,
        verbose_name="Subtotal",
        help_text="Subtotal amount (in smallest currency unit)"
    )
    discount_amount = models.BigIntegerField(
        default=0,
        verbose_name="Discount Amount",
        help_text="Total discount amount"
    )
    shipping_cost = models.BigIntegerField(
        default=0,
        verbose_name="Shipping Cost",
        help_text="Shipping cost"
    )
    total_amount = models.BigIntegerField(
        db_index=True,
        verbose_name="Total Amount",
        help_text="Total amount (in smallest currency unit)"
    )
    currency = models.CharField(
        max_length=3,
        default='IRR',
        db_index=True,
        verbose_name="Currency",
        help_text="Currency code"
    )
    
    shipping_address = models.ForeignKey(
        'order.ShippingAddress',
        on_delete=models.PROTECT,
        related_name='orders',
        db_index=True,
        verbose_name="Shipping Address",
        help_text="Shipping address for this order"
    )
    
    notes = models.TextField(
        blank=True,
        null=True,
        verbose_name="Notes",
        help_text="Order notes"
    )
    
    confirmed_at = models.DateTimeField(
        null=True,
        blank=True,
        db_index=True,
        verbose_name="Confirmed At",
        help_text="Date and time when order was confirmed"
    )
    shipped_at = models.DateTimeField(
        null=True,
        blank=True,
        db_index=True,
        verbose_name="Shipped At",
        help_text="Date and time when order was shipped"
    )
    delivered_at = models.DateTimeField(
        null=True,
        blank=True,
        db_index=True,
        verbose_name="Delivered At",
        help_text="Date and time when order was delivered"
    )
    
    class Meta(BaseModel.Meta):
        db_table = 'order_orders'
        verbose_name = 'Order'
        verbose_name_plural = 'Orders'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status', '-created_at']),
            models.Index(fields=['status', 'payment_status', '-created_at']),
            models.Index(fields=['order_number']),
        ]
    
    def __str__(self):
        return f"Order #{self.order_number}"
    
    def save(self, *args, **kwargs):
        if not self.order_number:
            timestamp = int(timezone.now().timestamp())
            self.order_number = f"ORD-{timestamp}-{self.public_id.hex[:8].upper()}"
        
        if self.status == 'confirmed' and not self.confirmed_at:
            self.confirmed_at = timezone.now()
        
        if self.status == 'shipped' and not self.shipped_at:
            self.shipped_at = timezone.now()
        
        if self.status == 'delivered' and not self.delivered_at:
            self.delivered_at = timezone.now()
        
        super().save(*args, **kwargs)
    
    @property
    def can_be_cancelled(self):
        return self.status in ['pending', 'confirmed']
    
    @property
    def can_be_refunded(self):
        return self.payment_status == 'paid' and self.status not in ['refunded', 'cancelled']


class OrderItem(BaseModel):
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name='items',
        db_index=True,
        verbose_name="Order",
        help_text="Order this item belongs to"
    )
    product = models.ForeignKey(
        'store.Product',
        on_delete=models.PROTECT,
        related_name='order_items',
        db_index=True,
        verbose_name="Product",
        help_text="Product in order"
    )
    quantity = models.PositiveIntegerField(
        validators=[MinValueValidator(1)],
        db_index=True,
        verbose_name="Quantity",
        help_text="Quantity ordered"
    )
    unit_price = models.BigIntegerField(
        db_index=True,
        verbose_name="Unit Price",
        help_text="Price per unit at time of order"
    )
    total_price = models.BigIntegerField(
        db_index=True,
        verbose_name="Total Price",
        help_text="Total price for this item"
    )
    
    product_title = models.CharField(
        max_length=200,
        verbose_name="Product Title",
        help_text="Product title at time of order (snapshot)"
    )
    product_sku = models.CharField(
        max_length=100,
        verbose_name="Product SKU",
        help_text="Product SKU at time of order (snapshot)"
    )
    
    class Meta(BaseModel.Meta):
        db_table = 'order_order_items'
        verbose_name = 'Order Item'
        verbose_name_plural = 'Order Items'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['order', 'product']),
        ]
    
    def __str__(self):
        return f"{self.quantity}x {self.product_title} in Order #{self.order.order_number}"
    
    def save(self, *args, **kwargs):
        if self.product:
            if not self.product_title:
                self.product_title = self.product.title
            if not self.product_sku:
                self.product_sku = self.product.sku
            if not self.unit_price:
                self.unit_price = self.product.current_price
            if not self.total_price:
                self.total_price = self.quantity * self.unit_price
        
        super().save(*args, **kwargs)
