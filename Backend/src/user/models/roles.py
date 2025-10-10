from django.db import models
from django.conf import settings
from django.core.cache import cache
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.utils import timezone
from src.core.models import BaseModel


class AdminRole(BaseModel):
    """
    Advanced Role system optimized for high-performance admin panel
    Based on Permission_System.mdc specifications
    """
    # Pre-defined admin roles for admin panel
    ADMIN_ROLES = (
        ('super_admin', 'Super Admin'),           # Full access
        ('content_manager', 'Content Manager'),   # Content management (portfolio, blog)
        ('user_manager', 'User Manager'),         # Website user management
        ('media_manager', 'Media Manager'),       # File and media management
        ('analytics_viewer', 'Analytics Viewer'), # Statistics and reports viewing
        ('support_admin', 'Support Admin'),       # Limited support access
    )
    
    name = models.CharField(
        max_length=50, 
        unique=True, 
        db_index=True,
        verbose_name="Role Name",
        help_text="Role name for admin panel (can be custom or predefined)"
    )
    display_name = models.CharField(
        max_length=100,
        verbose_name="Display Name",
        help_text="Human-readable role name"
    )
    description = models.TextField(
        blank=True,
        verbose_name="Description",
        help_text="Detailed description of this role"
    )
    
    # JSON-based permissions for high performance
    permissions = models.JSONField(
        default=dict, 
        verbose_name="Permissions",
        help_text="JSON structure: {'modules': ['users', 'media'], 'actions': ['read', 'create', 'update']}"
    )
    
    # Hierarchy for role levels
    level = models.PositiveIntegerField(
        default=5, 
        db_index=True,
        verbose_name="Role Level",
        help_text="Role hierarchy level (1=highest, 10=lowest)"
    )
    is_system_role = models.BooleanField(
        default=True,
        verbose_name="System Role",
        help_text="System roles cannot be deleted"
    )

    class Meta:
        db_table = 'admin_roles'
        verbose_name = 'Admin Role'
        verbose_name_plural = 'Admin Roles'
        ordering = ['level', 'name']
        indexes = [
            models.Index(fields=['name', 'is_active'], name='admin_role_name_active_idx'),
            models.Index(fields=['level'], name='admin_role_level_idx'),
            models.Index(fields=['public_id'], name='admin_role_public_id_idx'),
        ]

    def __str__(self):
        return self.display_name



class AdminUserRole(BaseModel):
    """
    Optimized relationship between Admin Users and Roles
    High-performance design with caching support
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        db_index=True,
        limit_choices_to={'is_staff': True},  # Only admin users
        verbose_name="Admin User",
        help_text="Admin user for this role assignment"
    )
    role = models.ForeignKey(
        AdminRole, 
        on_delete=models.CASCADE, 
        db_index=True,
        verbose_name="Admin Role",
        help_text="Role assigned to the admin user"
    )
    
    # Assignment metadata
    assigned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='assigned_admin_roles',
        verbose_name="Assigned By",
        help_text="Super admin who assigned this role"
    )
    assigned_at = models.DateTimeField(
        auto_now_add=True, 
        db_index=True,
        verbose_name="Assigned At"
    )
    expires_at = models.DateTimeField(
        null=True, blank=True, 
        db_index=True,
        verbose_name="Expires At",
        help_text="Optional expiry date for this role assignment"
    )
    
    # Cache for performance
    permissions_cache = models.JSONField(
        default=dict, 
        blank=True,
        verbose_name="Permissions Cache",
        help_text="Cached permissions for performance"
    )
    last_cache_update = models.DateTimeField(
        auto_now=True,
        verbose_name="Last Cache Update"
    )

    class Meta:
        db_table = 'admin_user_roles'
        verbose_name = 'Admin User Role'
        verbose_name_plural = 'Admin User Roles'
        unique_together = ['user', 'role']
        indexes = [
            models.Index(fields=['user', 'is_active'], name='adm_usr_role_usr_act_idx'),
            models.Index(fields=['role', 'is_active'], name='adm_usr_role_role_act_idx'),
            models.Index(fields=['expires_at'], name='adm_usr_role_exp_idx'),
            models.Index(fields=['public_id'], name='adm_usr_role_pub_idx'),
        ]

    def clean(self):
        """Validate role assignment based on Permission_System.md rules"""
        super().clean()
        
        # Rule: super_admin role can only be assigned to users with is_superuser=True
        if (self.role and self.role.name == 'super_admin' and 
            self.user and not self.user.is_superuser):
            from django.core.exceptions import ValidationError
            raise ValidationError(
                "نقش 'super_admin' فقط برای کاربرانی که 'is_superuser=True' هستند قابل تخصیص است."
            )
    
    def save(self, *args, **kwargs):
        """Override save to call clean validation"""
        self.clean()
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.user} - {self.role}"
    
    @property
    def is_expired(self):
        """Check if role assignment is expired"""
        if self.expires_at:
            return timezone.now() > self.expires_at
        return False


# Cache invalidation signals
@receiver([post_save, post_delete], sender=AdminUserRole)
def clear_admin_user_cache(sender, instance, **kwargs):
    """Clear admin user permission cache on role changes"""
    cache.delete_many([
        f'admin_permissions_{instance.user_id}',
        f'admin_roles_{instance.user_id}',
        f'admin_info_{instance.user_id}'
    ])

@receiver([post_save, post_delete], sender=AdminRole)
def clear_admin_role_cache(sender, instance, **kwargs):
    """Clear role cache when role permissions change"""
    # Clear all admin user caches that have this role
    user_roles = AdminUserRole.objects.filter(role=instance, is_active=True)
    cache_keys = []
    for user_role in user_roles:
        cache_keys.extend([
            f'admin_permissions_{user_role.user_id}',
            f'admin_roles_{user_role.user_id}',
            f'admin_info_{user_role.user_id}'
        ])
    
    if cache_keys:
        cache.delete_many(cache_keys)


# Legacy models for backward compatibility (will be deprecated)
class Role(BaseModel):
    """Legacy Role model - will be deprecated in favor of AdminRole"""
    name = models.CharField(max_length=255, db_index=True)
    description = models.TextField(null=True, blank=True)
    is_superuser = models.BooleanField(default=False)

    class Meta:
        db_table = 'roles'
        verbose_name = 'Role (Legacy)'
        verbose_name_plural = 'Roles (Legacy)'
        ordering = ['name']

    def __str__(self):
        return self.name


class CustomPermission(BaseModel):
    """Legacy Permission model - will be deprecated"""
    name = models.CharField(max_length=255, db_index=True)
    codename = models.CharField(max_length=100, unique=True, db_index=True)
    description = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'custom_permissions'
        verbose_name = 'Permission (Legacy)'
        verbose_name_plural = 'Permissions (Legacy)'
        ordering = ['name']

    def __str__(self):
        return self.name


class UserRole(BaseModel):
    """Legacy UserRole model - will be deprecated"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, db_index=True)
    role = models.ForeignKey(Role, on_delete=models.CASCADE, db_index=True)

    class Meta:
        db_table = 'user_roles'
        verbose_name = 'User Role (Legacy)'
        verbose_name_plural = 'User Roles (Legacy)'
        unique_together = ('user', 'role')

    def __str__(self):
        return f"{self.user} - {self.role}"


class RolePermission(BaseModel):
    """Legacy RolePermission model - will be deprecated"""
    role = models.ForeignKey(Role, on_delete=models.CASCADE, db_index=True)
    permission = models.ForeignKey(CustomPermission, on_delete=models.CASCADE, db_index=True)

    class Meta:
        db_table = 'role_permissions'
        unique_together = ('role', 'permission')

    def __str__(self):
        return f"{self.role} - {self.permission}"