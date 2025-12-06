from django.db import models
from src.core.models import BaseModel


class ShippingAddress(BaseModel):
    user = models.ForeignKey(
        'user.User',
        on_delete=models.CASCADE,
        related_name='shipping_addresses',
        db_index=True,
        verbose_name="User",
        help_text="User who owns this address"
    )
    
    first_name = models.CharField(
        max_length=100,
        db_index=True,
        verbose_name="First Name",
        help_text="First name"
    )
    last_name = models.CharField(
        max_length=100,
        db_index=True,
        verbose_name="Last Name",
        help_text="Last name"
    )
    mobile = models.CharField(
        max_length=20,
        db_index=True,
        verbose_name="Mobile",
        help_text="Mobile number"
    )
    phone = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name="Phone",
        help_text="Phone number"
    )
    
    province = models.CharField(
        max_length=100,
        db_index=True,
        verbose_name="Province",
        help_text="Province"
    )
    city = models.CharField(
        max_length=100,
        db_index=True,
        verbose_name="City",
        help_text="City"
    )
    district = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name="District",
        help_text="District or neighborhood"
    )
    address = models.TextField(
        verbose_name="Address",
        help_text="Full address"
    )
    postal_code = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        db_index=True,
        verbose_name="Postal Code",
        help_text="Postal code"
    )
    
    is_default = models.BooleanField(
        default=False,
        db_index=True,
        verbose_name="Default Address",
        help_text="Default shipping address"
    )
    
    class Meta(BaseModel.Meta):
        db_table = 'order_shipping_addresses'
        verbose_name = 'Shipping Address'
        verbose_name_plural = 'Shipping Addresses'
        ordering = ['-is_default', '-created_at']
        indexes = [
            models.Index(fields=['user', 'is_default']),
        ]
    
    def __str__(self):
        return f"{self.first_name} {self.last_name} - {self.city}, {self.province}"
    
    def save(self, *args, **kwargs):
        if self.is_default:
            ShippingAddress.objects.filter(
                user=self.user,
                is_default=True
            ).exclude(pk=self.pk).update(is_default=False)
        
        super().save(*args, **kwargs)
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"
    
    @property
    def full_address(self):
        parts = [self.address]
        if self.district:
            parts.insert(0, self.district)
        parts.extend([self.city, self.province])
        if self.postal_code:
            parts.append(f"Postal Code: {self.postal_code}")
        return ", ".join(parts)
