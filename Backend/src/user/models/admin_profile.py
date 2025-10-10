from django.db import models
from django.utils import timezone
from django.conf import settings
from src.media.models.media import Media
from src.core.models import BaseModel
from .location import Province, City


class AdminProfile(BaseModel):
    
    admin_user = models.OneToOneField(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE,
        related_name="admin_profile", 
        verbose_name='Admin Profile',
        help_text="The admin user this profile belongs to.",
        limit_choices_to={'is_staff': True}  # Only admin users
    )
    profile_picture = models.ForeignKey(
        Media, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='admin_profiles',
        verbose_name="Profile Picture", 
        help_text="Admin's profile picture from media library"
    )
    first_name = models.CharField(
        max_length=50, 
        null=True, blank=True,
        verbose_name="First Name", 
        help_text="Admin's first name."
    )
    last_name = models.CharField(
        max_length=50, 
        null=True, blank=True,
        verbose_name="Last Name", 
        help_text="Admin's last name."
    )
    birth_date = models.DateField(
        null=True, blank=True,
        verbose_name="Birth Date", 
        help_text="Admin's birth date."
    )
    national_id = models.CharField(
        max_length=20, 
        null=True, blank=True, unique=True,
        verbose_name="National ID", 
        help_text="Admin's national ID (unique)."
    )
    province = models.ForeignKey(
        Province, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='admin_profiles',
        verbose_name="Province", 
        help_text="Admin's province"
    )
    city = models.ForeignKey(
        City, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='admin_profiles',
        verbose_name="City", 
        help_text="Admin's city"
    )
    address = models.TextField(
        null=True, blank=True,
        verbose_name="Address", 
        help_text="Admin's address."
    )
    phone = models.CharField(
        max_length=15, 
        null=True, blank=True,
        db_index=True,  # اضافه کردن index برای performance
        verbose_name="Phone Number", 
        help_text="Admin's additional phone number (different from mobile for authentication)"
    )
    bio = models.TextField(
        null=True, blank=True,
        verbose_name="Biography", 
        help_text="Brief description about the admin."
    )

    class Meta:
        db_table = 'admin_profiles'
        verbose_name = 'Admin Profile'
        verbose_name_plural = 'Admin Profiles'
        indexes = [
            models.Index(fields=["admin_user"], name="admin_profile_user_idx"),
            models.Index(fields=["national_id"], name="admin_profile_national_id_idx"),
            models.Index(fields=["public_id"], name="admin_profile_public_id_idx"),
            models.Index(fields=["profile_picture"], name="admin_profile_pic_idx"),
            models.Index(fields=["phone"], name="admin_profile_phone_idx"),  # اضافه کردن index برای phone
            models.Index(fields=["province"], name="admin_profile_province_idx"),  # اضافه index برای province
            models.Index(fields=["city"], name="admin_profile_city_idx"),  # اضافه index برای city
        ]

    def __str__(self):
        return f"Admin Profile: {self.admin_user.email or self.admin_user.mobile}"

