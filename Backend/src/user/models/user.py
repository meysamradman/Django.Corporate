from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone
from django.core.validators import RegexValidator
import uuid

class UserManager(BaseUserManager):
    def create_user(self, mobile=None, email=None, password=None, **extra_fields):
        if not mobile and not email:
            raise ValueError('Either mobile or email must be provided')
            
        email = self.normalize_email(email) if email else None
        user = self.model(mobile=mobile, email=email, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, mobile, email=None, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('user_type', 'admin')
        extra_fields.setdefault('is_admin_active', True)
        extra_fields.setdefault('is_admin_full', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(mobile, email, password, **extra_fields)
    
    def get_queryset(self):
        return super().get_queryset()
    
    def with_profiles(self):
        return self.select_related('user_profile', 'admin_profile')
    
    def regular_users(self):
        return self.filter(user_type='user', is_staff=False)
    
    def admin_users(self):
        return self.filter(user_type='admin', is_staff=True, is_admin_active=True)

class User(AbstractBaseUser, PermissionsMixin):

    USER_TYPES = (
        ('user', 'User'),
        ('admin', 'Admin User'),
    )

    id = models.AutoField(primary_key=True, editable=False)
    public_id = models.UUIDField(
        default=uuid.uuid4, 
        unique=True, 
        editable=False,
        verbose_name="Public ID",
        db_index=True,
        help_text="Unique identifier for public-facing operations"
    )
    mobile = models.CharField(
        max_length=11, 
        null=True, blank=True, 
        unique=True,
        validators=[RegexValidator(r'^09\d{9}$', 'Enter a valid Iranian mobile number')],
        verbose_name="Mobile Number", 
        help_text="User's mobile number, unique and used as primary identifier"
    )
    email = models.EmailField(
        null=True, blank=True, 
        unique=True,
        verbose_name="Email", 
        help_text="User's email address, optional but unique"
    )
    user_type = models.CharField(
        max_length=10, 
        choices=USER_TYPES, 
        default='user',
        db_index=True,
        verbose_name="User Type",
        help_text="Type of user: user (website) or admin (panel)"
    )
    is_staff = models.BooleanField(
        default=False,
        db_index=True,
        verbose_name="Staff Status", 
        help_text="Designates whether user can log into admin panel"
    )
    is_superuser = models.BooleanField(
        default=False,
        db_index=True,
        verbose_name="Superuser Status", 
        help_text="Designates that user has all permissions without explicitly assigning them"
    )
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name="Active Status", 
        help_text="Designates whether this user should be treated as active"
    )
    is_admin_active = models.BooleanField(
        default=False, 
        db_index=True,
        verbose_name="Admin Active Status",
        help_text="Designates whether user can access admin panel"
    )
    is_admin_full = models.BooleanField(
        default=False, 
        db_index=True,
        verbose_name="Full Admin Access",
        help_text="Designates admin with full access and bypass all permissions"
    )
    last_login_admin = models.DateTimeField(
        null=True, blank=True, 
        db_index=True,
        verbose_name="Last Admin Login",
        help_text="Last time user logged into admin panel"
    )
    created_at = models.DateTimeField(
        default=timezone.now,
        db_index=True,
        verbose_name="Created At", 
        help_text="Date and time when user was created"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Updated At", 
        help_text="Date and time when user was last updated"
    )

    objects = UserManager()

    USERNAME_FIELD = 'mobile'
    REQUIRED_FIELDS = []

    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        indexes = [
            models.Index(fields=['user_type', 'is_admin_active'], name='user_type_admin_active_idx'),
            models.Index(fields=['is_admin_full', 'is_active'], name='user_admin_full_active_idx'),
            models.Index(fields=['mobile'], name='user_mobile_idx'),
            models.Index(fields=['email'], name='user_email_idx'),
            models.Index(fields=['last_login_admin'], name='user_last_login_admin_idx'),
            models.Index(fields=['public_id'], name='user_public_id_idx'),
            models.Index(fields=['is_active', 'user_type'], name='user_active_type_idx'),
            models.Index(fields=['is_staff', 'is_admin_active'], name='user_staff_admin_idx'),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(mobile__isnull=False) | models.Q(email__isnull=False),
                name='user_mobile_or_email_required'
            ),
            models.CheckConstraint(
                check=models.Q(is_admin_full=False) | 
                      (models.Q(is_admin_full=True) & models.Q(is_staff=True) & models.Q(is_admin_active=True)),
                name='super_admin_must_be_staff_with_panel_access'
            ),
        ]

    def __str__(self):
        return self.mobile or self.email or f"User {self.id}"

    @property
    def is_regular_user(self):
        return self.user_type == 'user'
    
    @property 
    def is_admin_user(self):
        return self.user_type == 'admin' and self.is_admin_active
    
    def has_admin_access(self):
        return self.is_admin_user and self.is_active
    
    def is_full_admin_user(self):
        return self.is_admin_full and self.has_admin_access()


 
