from django.db import models
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from src.core.models import BaseModel
from src.real_estate.models.seo import SEOMixin
from src.core.models import City, Province
from src.real_estate.models.managers import RealEstateAgencyQuerySet


class RealEstateAgency(BaseModel, SEOMixin):
    name = models.CharField(
        max_length=200,
        db_index=True,
        verbose_name="Name",
        help_text="Agency name"
    )
    slug = models.SlugField(
        max_length=200,
        unique=True,
        db_index=True,
        allow_unicode=True,
        verbose_name="URL Slug",
        help_text="URL-friendly identifier"
    )
    license_number = models.CharField(
        max_length=100,
        unique=True,
        db_index=True,
        verbose_name="License Number",
        help_text="Agent license number"
    )
    license_expire_date = models.DateField(
        null=True,
        blank=True,
        db_index=True,
        verbose_name="License Expiry Date",
        help_text="Date when the license expires"
    )
    
    phone = models.CharField(
        max_length=20,
        db_index=True,
        verbose_name="Phone",
        help_text="Contact phone number"
    )
    email = models.EmailField(
        db_index=True,
        verbose_name="Email",
        help_text="Contact email address"
    )
    website = models.URLField(
        blank=True,
        verbose_name="Website",
        help_text="Agency website URL"
    )
    
    province = models.ForeignKey(
        Province,
        on_delete=models.PROTECT,
        related_name='real_estate_agencies',
        null=True,
        blank=True,
        db_index=True,
        verbose_name="Province",
        help_text="Province where the agency is located"
    )
    city = models.ForeignKey(
        City,
        on_delete=models.PROTECT,
        related_name='real_estate_agencies',
        db_index=True,
        verbose_name="City",
        help_text="City where the agency is located"
    )
    address = models.TextField(
        verbose_name="Address",
        help_text="Full address of the agency"
    )
    
    logo = models.ForeignKey(
        'media.ImageMedia',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='real_estate_agency_logos',
        verbose_name="Logo",
        help_text="Agency logo image"
    )
    cover_image = models.ForeignKey(
        'media.ImageMedia',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='real_estate_agency_covers',
        verbose_name="Cover Image",
        help_text="Agency cover image"
    )
    
    is_verified = models.BooleanField(
        default=False,
        db_index=True,
        verbose_name="Verified",
        help_text="Designates whether this agency is verified"
    )
    rating = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(5)],
        db_index=True,
        verbose_name="Rating",
        help_text="Agency rating (0-5)"
    )
    total_reviews = models.IntegerField(
        default=0,
        verbose_name="Total Reviews",
        help_text="Total number of reviews"
    )
    
    description = models.TextField(
        blank=True,
        verbose_name="Description",
        help_text="Agency description"
    )
    
    objects = RealEstateAgencyQuerySet.as_manager()
    
    class Meta(BaseModel.Meta, SEOMixin.Meta):
        db_table = 'real_estate_agencies'
        verbose_name = 'Real Estate Agency'
        verbose_name_plural = 'Real Estate Agencies'
        ordering = ['-rating', '-is_verified', 'name']
        indexes = [
            # Composite indexes for common query patterns
            models.Index(fields=['is_active', 'is_verified', '-rating']),
            models.Index(fields=['province', 'is_active']),
            models.Index(fields=['city', 'is_active']),
            models.Index(fields=['license_number']),
            models.Index(fields=['slug']),
            models.Index(fields=['-rating', '-total_reviews']),
        ]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(rating__gte=0) & models.Q(rating__lte=5),
                name='agency_rating_range'
            ),
            models.CheckConstraint(
                condition=models.Q(total_reviews__gte=0),
                name='agency_total_reviews_non_negative'
            ),
        ]
    
    def __str__(self):
        return self.name
    
    def get_public_url(self):
        return f"/agency/{self.slug}/"
    
    def save(self, *args, **kwargs):
        if not self.meta_title and self.name:
            self.meta_title = self.name[:70]
        
        if not self.meta_description and self.description:
            self.meta_description = self.description[:300]
        
        if not self.og_title and self.meta_title:
            self.og_title = self.meta_title
        
        if not self.og_description and self.meta_description:
            self.og_description = self.meta_description
        
        super().save(*args, **kwargs)
