from django.db import models
from django.conf import settings
from django.db import models
from src.core.models import BaseModel, Province, City
from src.media.models.media import ImageMedia

class UserProfile(BaseModel):

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="user_profile",
        db_index=True,
        verbose_name="User",
        help_text="The user this profile belongs to"
    )
    
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
            models.Index(fields=['province', 'city']),
        ]

    def __str__(self):
        return f"Profile of {self.user.mobile or self.user.email}"