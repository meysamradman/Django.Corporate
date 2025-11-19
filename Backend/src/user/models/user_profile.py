from django.db import models
from django.utils import timezone
from django.conf import settings
from src.core.models import BaseModel
from .location import Province, City
from src.media.models.media import ImageMedia

class UserProfile(BaseModel):
    
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name="user_profile", verbose_name="User profile", help_text="The user this profile belongs to."
    )
    profile_picture = models.ForeignKey(
        ImageMedia, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='user_profiles',
        verbose_name="Profile Picture", 
        help_text="User's profile picture"
    )
    first_name = models.CharField(
        max_length=30, null=True, blank=True,
        verbose_name="First name", help_text="The first name of the user."
    )
    last_name = models.CharField(
        max_length=30, null=True, blank=True,
        verbose_name="Last name", help_text="The last name of the user."
    )
    birth_date = models.DateField(
        null=True, blank=True,
        verbose_name="Birth date", help_text="The birth date of the user."
    )
    national_id = models.CharField(
        max_length=20, null=True, blank=True, unique=True,
        verbose_name="National id", help_text="The national ID of the user (unique)."
    )
    province = models.ForeignKey(
        Province, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='user_profiles',
        verbose_name="Province", 
        help_text="User's province"
    )
    city = models.ForeignKey(
        City, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='user_profiles',
        verbose_name="City", 
        help_text="User's city"
    )
    address = models.TextField(
        null=True, blank=True,
        verbose_name="Address", help_text="The address of the user."
    )
    phone = models.CharField(
        max_length=15, null=True, blank=True,
        unique=True,
        db_index=True,
        verbose_name="Phone Number", 
        help_text="User's additional phone number (different from mobile for authentication)"
    )
    bio = models.TextField(
        null=True, blank=True,
        verbose_name="Biography", help_text="A short biography or description about the user."
    )


    class Meta:
        db_table = 'user_profile'
        verbose_name = 'User Profile'
        verbose_name_plural = 'User Profiles'
        indexes = [
            models.Index(fields=["user"], name="user_profile_user_idx"),
            models.Index(fields=["national_id"], name="user_profile_national_id_idx"),
            models.Index(fields=["public_id"], name="user_profile_public_id_idx"),
            models.Index(fields=["profile_picture"], name="user_profile_pic_idx"),
            models.Index(fields=["phone"], name="user_profile_phone_idx"),
            models.Index(fields=["province"], name="user_profile_province_idx"),
            models.Index(fields=["city"], name="user_profile_city_idx"),
        ]

    def __str__(self):
        return f"Profile of {self.user.mobile or self.user.email}"