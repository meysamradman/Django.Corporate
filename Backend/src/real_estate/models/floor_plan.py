from django.db import models
from django.core.validators import MinValueValidator
from src.core.models import BaseModel


class RealEstateFloorPlan(BaseModel):
    
    property_obj = models.ForeignKey(
        'Property',
        on_delete=models.CASCADE,
        related_name='floor_plans',
        db_index=True,
        verbose_name="Property",
        help_text="The property this floor plan belongs to"
    )
    
    title = models.CharField(
        max_length=200,
        db_index=True,
        verbose_name="Title",
        help_text="Floor plan title (e.g., 'First Floor - Type A', 'Duplex VIP')"
    )
    
    slug = models.SlugField(
        max_length=250,
        unique=True,
        allow_unicode=True,
        db_index=True,
        verbose_name="URL Slug",
        help_text="A unique URL-friendly identifier for this floor plan"
    )
    
    description = models.TextField(
        blank=True,
        verbose_name="Description",
        help_text="Detailed description of this floor plan"
    )
    
    floor_size = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        verbose_name="Floor Size (sqft/sqm)",
        help_text="Total floor area (e.g., 1267 sqft)"
    )
    
    size_unit = models.CharField(
        max_length=10,
        choices=[
            ('sqft', 'Square Feet'),
            ('sqm', 'Square Meters'),
        ],
        default='sqm',
        verbose_name="Size Unit",
        help_text="Unit of measurement for floor size"
    )
    
    bedrooms = models.SmallIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
        verbose_name="Bedrooms",
        help_text="Number of bedrooms in this floor plan"
    )
    
    bathrooms = models.SmallIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
        verbose_name="Bathrooms",
        help_text="Number of bathrooms in this floor plan"
    )
    
    price = models.BigIntegerField(
        null=True,
        blank=True,
        db_index=True,
        verbose_name="Price",
        help_text="Price for this floor plan (e.g., $1,650 per month or total price)"
    )
    
    currency = models.CharField(
        max_length=3,
        default='USD',
        verbose_name="Currency",
        help_text="Currency code (USD, EUR, IRR, etc.)"
    )
    
    floor_number = models.SmallIntegerField(
        null=True,
        blank=True,
        verbose_name="Floor Number",
        help_text="Which floor this plan is for (optional)"
    )
    
    unit_type = models.CharField(
        max_length=50,
        blank=True,
        verbose_name="Unit Type",
        help_text="Unit type identifier (e.g., 'Type A', 'Type B', 'VIP')"
    )
    
    display_order = models.IntegerField(
        default=0,
        db_index=True,
        verbose_name="Display Order",
        help_text="Order for displaying floor plans"
    )
    
    is_available = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name="Available",
        help_text="Whether this floor plan is currently available"
    )

    class Meta(BaseModel.Meta):
        db_table = 'real_estate_floor_plans'
        verbose_name = 'Real Estate Floor Plan'
        verbose_name_plural = 'Real Estate Floor Plans'
        ordering = ['property_obj', 'display_order', 'floor_number']
        indexes = [
            models.Index(fields=['property_obj', 'is_active']),
            models.Index(fields=['property_obj', 'display_order']),
            models.Index(fields=['is_available', 'is_active']),
            models.Index(fields=['slug']),
        ]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(floor_size__gte=0),
                name='floor_plan_size_non_negative'
            ),
            models.CheckConstraint(
                condition=models.Q(price__isnull=True) | models.Q(price__gte=0),
                name='floor_plan_price_non_negative'
            ),
        ]

    def __str__(self):
        return f"{self.property_obj.title} - {self.title}"
    
    @property
    def size_display(self):
        """نمایش زیبای اندازه با واحد"""
        return f"{self.floor_size} {self.get_size_unit_display()}"
    
    @property
    def price_display(self):
        """نمایش زیبای قیمت"""
        if self.price:
            return f"{self.currency} {self.price:,}"
        return "Price on request"
