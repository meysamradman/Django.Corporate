from django.db import models
from django.db.models import Sum, F, Case, When, IntegerField
from django.core.validators import MinValueValidator
from django.core.exceptions import ValidationError
from src.core.models import BaseModel


class Cart(BaseModel):
    user = models.ForeignKey(
        'user.User',
        on_delete=models.CASCADE,
        related_name='carts',
        null=True,
        blank=True,
        db_index=True,
        verbose_name="User",
        help_text="User who owns this cart"
    )
    session_key = models.CharField(
        max_length=40,
        null=True,
        blank=True,
        db_index=True,
        verbose_name="Session Key",
        help_text="Session key for anonymous users"
    )
    
    class Meta(BaseModel.Meta):
        db_table = 'order_carts'
        verbose_name = 'Cart'
        verbose_name_plural = 'Carts'
        indexes = [
            models.Index(fields=['user', 'is_active']),
            models.Index(fields=['session_key', 'is_active']),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(user__isnull=False) | models.Q(session_key__isnull=False),
                name='cart_must_have_user_or_session'
            ),
        ]
    
    def __str__(self):
        if self.user:
            return f"Cart for {self.user.mobile or self.user.email}"
        return f"Cart (Session: {self.session_key[:10]}...)"
    
    @property
    def total_items(self):
        return self.items.aggregate(total=models.Sum('quantity'))['total'] or 0
    
    @property
    def total_price(self):
        total = self.items.aggregate(
            total=models.Sum(models.F('quantity') * models.F('product__price'))
        )['total'] or 0
        return int(total)
    
    @property
    def total_discount(self):
        total = self.items.aggregate(
            total=models.Sum(
                models.Case(
                    models.When(
                        product__sale_price__isnull=False,
                        then=models.F('quantity') * (models.F('product__price') - models.F('product__sale_price'))
                    ),
                    default=0,
                    output_field=models.IntegerField()
                )
            )
        )['total'] or 0
        return int(total)
    
    @property
    def final_price(self):
        return self.total_price - self.total_discount
    
    def clear(self):
        self.items.all().delete()


class CartItem(BaseModel):
    cart = models.ForeignKey(
        Cart,
        on_delete=models.CASCADE,
        related_name='items',
        db_index=True,
        verbose_name="Cart",
        help_text="Cart this item belongs to"
    )
    product = models.ForeignKey(
        'store.Product',
        on_delete=models.CASCADE,
        related_name='cart_items',
        db_index=True,
        verbose_name="Product",
        help_text="Product in cart"
    )
    quantity = models.PositiveIntegerField(
        default=1,
        validators=[MinValueValidator(1)],
        db_index=True,
        verbose_name="Quantity",
        help_text="Quantity of product"
    )
    
    class Meta(BaseModel.Meta):
        db_table = 'order_cart_items'
        verbose_name = 'Cart Item'
        verbose_name_plural = 'Cart Items'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['cart', 'product']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['cart', 'product'],
                name='unique_cart_product'
            ),
        ]
    
    def __str__(self):
        return f"{self.quantity}x {self.product.title} in Cart"
    
    @property
    def unit_price(self):
        return self.product.current_price
    
    @property
    def total_price(self):
        return self.quantity * self.unit_price
    
    def clean(self):
        if self.product and not self.product.is_in_stock:
            raise ValidationError("Product is out of stock.")
        
        if self.product and self.product.manage_stock:
            if self.quantity > self.product.stock_quantity:
                raise ValidationError(f"Only {self.product.stock_quantity} items available in stock.")
