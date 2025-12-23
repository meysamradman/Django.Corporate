from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.contrib.auth import get_user_model
from src.core.models import BaseModel
from src.real_estate.models.seo import SEOMixin
from src.real_estate.models.location import City
from src.real_estate.models.managers import PropertyAgentQuerySet

User = get_user_model()


class PropertyAgent(BaseModel, SEOMixin):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='real_estate_agent_profile',
        db_index=True,
        verbose_name="User",
        help_text="Associated user account"
    )
    agency = models.ForeignKey(
        'real_estate.RealEstateAgency',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='agents',
        db_index=True,
        verbose_name="Agency",
        help_text="Agency this agent belongs to (optional)"
    )
    
    first_name = models.CharField(
        max_length=100,
        db_index=True,
        verbose_name="First Name",
        help_text="Agent first name"
    )
    last_name = models.CharField(
        max_length=100,
        db_index=True,
        verbose_name="Last Name",
        help_text="Agent last name"
    )
    phone = models.CharField(
        max_length=20,
        db_index=True,
        verbose_name="Phone",
        help_text="Contact phone number"
    )
    email = models.EmailField(
        blank=True,
        db_index=True,
        verbose_name="Email",
        help_text="Contact email address"
    )
    whatsapp = models.CharField(
        max_length=20,
        blank=True,
        verbose_name="WhatsApp",
        help_text="WhatsApp contact number"
    )
    telegram = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="Telegram",
        help_text="Telegram username or contact"
    )
    
    license_number = models.CharField(
        max_length=100,
        unique=True,
        db_index=True,
        verbose_name="License Number",
        help_text="Agent license number"
    )
    slug = models.SlugField(
        max_length=200,
        unique=True,
        db_index=True,
        allow_unicode=True,
        blank=True,
        null=True,
        verbose_name="URL Slug",
        help_text="URL-friendly identifier"
    )
    experience_years = models.IntegerField(
        default=0,
        verbose_name="Experience Years",
        help_text="Years of experience in real estate"
    )
    specialization = models.CharField(
        max_length=200,
        blank=True,
        verbose_name="Specialization",
        help_text="Specialization (e.g., Residential, Commercial)"
    )
    
    city = models.ForeignKey(
        City,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='real_estate_agents',
        db_index=True,
        verbose_name="City",
        help_text="City where the agent is located"
    )
    address = models.TextField(
        blank=True,
        verbose_name="Address",
        help_text="Agent office or contact address"
    )
    latitude = models.DecimalField(
        max_digits=10,
        decimal_places=8,
        null=True,
        blank=True,
        verbose_name="Latitude",
        help_text="Geographic latitude"
    )
    longitude = models.DecimalField(
        max_digits=11,
        decimal_places=8,
        null=True,
        blank=True,
        verbose_name="Longitude",
        help_text="Geographic longitude"
    )
    
    avatar = models.ForeignKey(
        'media.ImageMedia',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='real_estate_agent_avatars',
        verbose_name="Avatar",
        help_text="Agent profile picture"
    )
    cover_image = models.ForeignKey(
        'media.ImageMedia',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='real_estate_agent_covers',
        verbose_name="Cover Image",
        help_text="Agent cover image"
    )
    
    is_verified = models.BooleanField(
        default=False,
        db_index=True,
        verbose_name="Verified",
        help_text="Designates whether this agent is verified"
    )
    rating = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(5)],
        db_index=True,
        verbose_name="Rating",
        help_text="Agent rating (0-5)"
    )
    total_sales = models.IntegerField(
        default=0,
        verbose_name="Total Sales",
        help_text="Total number of sales completed"
    )
    total_reviews = models.IntegerField(
        default=0,
        verbose_name="Total Reviews",
        help_text="Total number of reviews"
    )
    
    bio = models.TextField(
        blank=True,
        verbose_name="Biography",
        help_text="Agent biography"
    )
    
    objects = PropertyAgentQuerySet.as_manager()
    
    class Meta(BaseModel.Meta, SEOMixin.Meta):
        db_table = 'real_estate_agents'
        verbose_name = 'Property Agent'
        verbose_name_plural = 'Property Agents'
        ordering = ['-rating', '-total_sales', 'last_name']
        indexes = [
            # Composite indexes for common query patterns
            models.Index(fields=['is_active', 'is_verified', '-rating']),
            models.Index(fields=['agency', 'is_active']),
            models.Index(fields=['city', 'is_active']),
            models.Index(fields=['user', 'is_active']),
            models.Index(fields=['license_number']),
            models.Index(fields=['slug']),
            models.Index(fields=['last_name', 'first_name']),
            models.Index(fields=['-rating', '-total_sales']),
        ]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(rating__gte=0) & models.Q(rating__lte=5),
                name='agent_rating_range'
            ),
            models.CheckConstraint(
                condition=models.Q(total_sales__gte=0),
                name='agent_total_sales_non_negative'
            ),
            models.CheckConstraint(
                condition=models.Q(total_reviews__gte=0),
                name='agent_total_reviews_non_negative'
            ),
            models.CheckConstraint(
                condition=models.Q(experience_years__gte=0),
                name='agent_experience_years_non_negative'
            ),
        ]
    
    def __str__(self):
        return f"{self.first_name} {self.last_name}"
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"
    
    def get_public_url(self):
        if hasattr(self, 'slug') and self.slug:
            return f"/agent/{self.slug}/"
        return f"/agent/{self.public_id}/"
    
    def clean(self):
        """Validate that user is an admin user"""
        from django.core.exceptions import ValidationError
        from src.real_estate.messages.messages import AGENT_ERRORS
        
        if self.user_id:
            user = self.user
            user_type = getattr(user, 'user_type', None)
            is_staff = getattr(user, 'is_staff', False)
            is_admin_active = getattr(user, 'is_admin_active', False)
            
            if user_type != 'admin' or not is_staff or not is_admin_active:
                raise ValidationError({
                    'user': AGENT_ERRORS["user_must_be_admin"]
                })
    
    def save(self, *args, **kwargs):
        # Validate user is admin before saving
        self.full_clean()
        
        # Auto-generate slug if not provided
        if not self.slug and self.first_name and self.last_name:
            from django.utils.text import slugify
            base_slug = slugify(f"{self.first_name} {self.last_name}")
            slug = base_slug
            counter = 1
            while PropertyAgent.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        
        # Auto-populate SEO fields
        if not self.meta_title and self.full_name:
            self.meta_title = f"{self.full_name} - Real Estate Agent"[:70]
        
        if not self.meta_description and self.bio:
            self.meta_description = self.bio[:300]
        
        if not self.og_title and self.meta_title:
            self.og_title = self.meta_title
        
        if not self.og_description and self.meta_description:
            self.og_description = self.meta_description
        
        super().save(*args, **kwargs)
