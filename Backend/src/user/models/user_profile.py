from django.db import models
from django.conf import settings
from src.core.models import BaseModel
from .location import Province, City
from src.media.models.media import ImageMedia


class UserProfile(BaseModel):
    """
    User profile model following DJANGO_MODEL_STANDARDS.md conventions.
    Field ordering: Primary Relationship → Content → Other Relationships → Metadata
    Note: user relationship is kept first as it's the primary identifier (OneToOneField)
    """
    # 5. Relationships (Primary - kept first as it's the primary identifier)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="user_profile",
        db_index=True,
        verbose_name="User",
        help_text="The user this profile belongs to"
    )
    
    # 2. Primary Content Fields
    first_name = models.CharField(
        max_length=30,
        null=True,
        blank=True,
        verbose_name="First Name",
        help_text="The first name of the user"
    )
    last_name = models.CharField(
        max_length=30,
        null=True,
        blank=True,
        verbose_name="Last Name",
        help_text="The last name of the user"
    )
    
    # 3. Description Fields
    bio = models.TextField(
        null=True,
        blank=True,
        verbose_name="Biography",
        help_text="A short biography or description about the user"
    )
    address = models.TextField(
        null=True,
        blank=True,
        verbose_name="Address",
        help_text="The address of the user"
    )
    
    # 5. Relationships (Secondary)
    profile_picture = models.ForeignKey(
        ImageMedia,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='user_profiles',
        db_index=True,
        verbose_name="Profile Picture",
        help_text="User's profile picture"
    )
    province = models.ForeignKey(
        Province,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='user_profiles',
        db_index=True,
        verbose_name="Province",
        help_text="User's province"
    )
    city = models.ForeignKey(
        City,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='user_profiles',
        db_index=True,
        verbose_name="City",
        help_text="User's city"
    )
    
    # Metadata Fields
    birth_date = models.DateField(
        null=True,
        blank=True,
        verbose_name="Birth Date",
        help_text="The birth date of the user"
    )
    national_id = models.CharField(
        max_length=20,
        null=True,
        blank=True,
        unique=True,
        db_index=True,
        verbose_name="National ID",
        help_text="The national ID of the user (unique)"
    )
    phone = models.CharField(
        max_length=15,
        null=True,
        blank=True,
        unique=True,
        db_index=True,
        verbose_name="Phone Number",
        help_text="User's additional phone number (different from mobile for authentication)"
    )

    class Meta(BaseModel.Meta):
        db_table = 'user_profile'
        verbose_name = "User Profile"
        verbose_name_plural = "User Profiles"
        ordering = ['-created_at']
        indexes = [
            # Composite index for common queries
            models.Index(fields=['province', 'city']),
            # Note: national_id and phone already have db_index=True, no need for separate Index()
        ]

    def __str__(self):
        return f"Profile of {self.user.mobile or self.user.email}"