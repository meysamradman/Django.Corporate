from django.db import models
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.contrib.auth import get_user_model
from src.core.models import BaseModel
from src.real_estate.models.seo import SEOMixin
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
    slug = models.SlugField(
        max_length=200,
        unique=True,
        db_index=True,
        allow_unicode=True,
        verbose_name="URL Slug",
        help_text="URL-friendly identifier for the agent"
    )
    specialization = models.CharField(
        max_length=200,
        blank=True,
        verbose_name="Specialization",
        help_text="Specialization (e.g., Residential, Commercial)"
    )
    
    profile_picture = models.ForeignKey(
        'media.ImageMedia',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='real_estate_agent_profiles',
        verbose_name="Profile Picture",
        help_text="Agent profile picture"
    )
    
    is_verified = models.BooleanField(
        default=False,
        db_index=True,
        verbose_name="Verified",
        help_text="Designates whether this agent is verified"
    )
    show_in_team = models.BooleanField(
        default=False,
        db_index=True,
        verbose_name="Show In Team",
        help_text="Show this agent in public team sections"
    )
    team_order = models.PositiveIntegerField(
        default=0,
        db_index=True,
        verbose_name="Team Order",
        help_text="Sort order for team listing (lower first)"
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
        ordering = ['-rating', '-total_sales', 'user__admin_profile__last_name']
        indexes = [
            models.Index(fields=['is_active', 'is_verified', '-rating']),
            models.Index(fields=['is_active', 'show_in_team', 'team_order']),
            models.Index(fields=['agency', 'is_active']),
            models.Index(fields=['user', 'is_active']),
            models.Index(fields=['license_number']),
            models.Index(fields=['slug']),
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
        ]
    
    def __str__(self):
        
        try:
            if hasattr(self.user, 'admin_profile'):
                profile = self.user.admin_profile
                if profile.first_name and profile.last_name:
                    return f"{profile.first_name} {profile.last_name}"
            return self.user.mobile or self.user.email or f"Agent {self.id}"
        except Exception:
            return f"Agent {self.id}"
    
    @property
    def full_name(self):
        
        try:
            if hasattr(self.user, 'admin_profile'):
                profile = self.user.admin_profile
                if profile.first_name and profile.last_name:
                    return f"{profile.first_name} {profile.last_name}"
            return self.user.mobile or self.user.email or ""
        except Exception:
            return ""
    
    @property
    def first_name(self):
        
        try:
            if hasattr(self.user, 'admin_profile'):
                return self.user.admin_profile.first_name or ""
            return ""
        except Exception:
            return ""
    
    @property
    def last_name(self):
        
        try:
            if hasattr(self.user, 'admin_profile'):
                return self.user.admin_profile.last_name or ""
            return ""
        except Exception:
            return ""
    
    @property
    def phone(self):
        
        return self.user.mobile if self.user else ""
    
    @property
    def email(self):
        
        return self.user.email if self.user else ""
    
    def get_public_url(self):
        if hasattr(self, 'slug') and self.slug:
            return f"/agent/{self.slug}/"
        return f"/agent/{self.public_id}/"
    
    def clean(self):
        
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
        self.full_clean()
        
        if not self.meta_title and self.full_name:
            self.meta_title = f"{self.full_name} - Real Estate Agent"[:70]
        
        if not self.meta_description and self.bio:
            self.meta_description = self.bio[:300]
        
        if not self.og_title and self.meta_title:
            self.og_title = self.meta_title
        
        if not self.og_description and self.meta_description:
            self.og_description = self.meta_description
        
        super().save(*args, **kwargs)
