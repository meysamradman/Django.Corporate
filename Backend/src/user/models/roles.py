from django.db import models
from django.conf import settings
from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.db.models.signals import post_save, post_delete, pre_save
from django.dispatch import receiver
from django.utils import timezone
from src.core.models import BaseModel


class AdminRole(BaseModel):
    """
    Admin role model following DJANGO_MODEL_STANDARDS.md conventions.
    Field ordering: Content → Description → Metadata → Flags
    """
    ADMIN_ROLES = (
        ('super_admin', 'Super Admin'),
        ('content_manager', 'Content Manager'),
        ('blog_manager', 'Blog Manager'),
        ('portfolio_manager', 'Portfolio Manager'),
        ('media_manager', 'Media Manager'),
        ('forms_manager', 'Forms Manager'),
        ('pages_manager', 'Pages Manager'),
        ('email_manager', 'Email Manager'),
        ('ai_manager', 'AI Manager'),
        ('settings_manager', 'Settings Manager'),
        ('panel_manager', 'Panel Manager'),
        ('statistics_viewer', 'Statistics Viewer'),
        ('user_manager', 'User Manager'),
    )
    
    # 2. Primary Content Fields
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
    
    # 3. Description Fields
    description = models.TextField(
        blank=True,
        verbose_name="Description",
        help_text="Detailed description of this role"
    )
    
    # Metadata Fields
    permissions = models.JSONField(
        default=dict, 
        verbose_name="Permissions",
        help_text="JSON structure: {'modules': ['users', 'media'], 'actions': ['read', 'create', 'update']}"
    )
    level = models.PositiveIntegerField(
        default=5, 
        db_index=True,
        verbose_name="Role Level",
        help_text="Role hierarchy level (1=highest, 10=lowest)"
    )
    
    # 4. Boolean Flags
    is_system_role = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name="System Role",
        help_text="System roles cannot be deleted"
    )

    class Meta(BaseModel.Meta):
        db_table = 'admin_roles'
        verbose_name = 'Admin Role'
        verbose_name_plural = 'Admin Roles'
        ordering = ['level', 'name']
        indexes = [
            # Composite index for filtering active roles by name
            models.Index(fields=['name', 'is_active']),
            # Note: name already has unique=True and db_index=True (automatic index)
            # Note: level already has db_index=True (automatic index)
            # Note: public_id already indexed in BaseModel
        ]

    def __str__(self):
        return self.display_name



class AdminUserRole(BaseModel):
    """
    Admin user role assignment model following DJANGO_MODEL_STANDARDS.md conventions.
    Field ordering: Relationships → Metadata → Timestamps
    """
    # 5. Relationships
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        db_index=True,
        related_name='admin_user_roles',
        limit_choices_to={'is_staff': True},
        verbose_name="Admin User",
        help_text="Admin user for this role assignment"
    )
    role = models.ForeignKey(
        AdminRole, 
        on_delete=models.CASCADE, 
        db_index=True,
        related_name='admin_user_roles',
        verbose_name="Admin Role",
        help_text="Role assigned to the admin user"
    )
    assigned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True,
        blank=True,
        related_name='assigned_admin_roles',
        db_index=True,
        verbose_name="Assigned By",
        help_text="Super admin who assigned this role"
    )
    
    # Metadata Fields
    permissions_cache = models.JSONField(
        default=dict, 
        blank=True,
        verbose_name="Permissions Cache",
        help_text="Cached permissions for performance"
    )
    
    # Timestamp Fields (additional to BaseModel timestamps)
    assigned_at = models.DateTimeField(
        auto_now_add=True, 
        db_index=True,
        verbose_name="Assigned At",
        help_text="Date and time when role was assigned"
    )
    expires_at = models.DateTimeField(
        null=True,
        blank=True, 
        db_index=True,
        verbose_name="Expires At",
        help_text="Optional expiry date for this role assignment"
    )
    last_cache_update = models.DateTimeField(
        auto_now=True,
        verbose_name="Last Cache Update",
        help_text="Date and time when permissions cache was last updated"
    )

    class Meta(BaseModel.Meta):
        db_table = 'admin_user_roles'
        verbose_name = 'Admin User Role'
        verbose_name_plural = 'Admin User Roles'
        unique_together = ['user', 'role']
        indexes = [
            # Composite indexes for common query patterns
            models.Index(fields=['user', 'is_active']),
            models.Index(fields=['role', 'is_active']),
            # Note: expires_at already has db_index=True (automatic index)
            # Note: public_id already indexed in BaseModel
        ]
    
    def __str__(self):
        return f"{self.user} - {self.role}"
    
    def update_permissions_cache(self):
        role_permissions = self.role.permissions if self.role.permissions else {}
        self.permissions_cache = role_permissions
        
        super(AdminUserRole, self).save(update_fields=['permissions_cache', 'last_cache_update'])
        
        from src.user.authorization.admin_permission import AdminPermissionCache
        from src.user.permissions.validator import PermissionValidator
        from src.user.permissions.helpers import PermissionHelper
        
        AdminPermissionCache.clear_user_cache(self.user_id)
        PermissionValidator.clear_user_cache(self.user_id)
        PermissionHelper.clear_user_cache(self.user_id)
    
    @property
    def is_expired(self):
        if self.expires_at:
            return timezone.now() > self.expires_at
        return False


@receiver(pre_save, sender=AdminUserRole)
def validate_admin_user_role(sender, instance, **kwargs):
    if (instance.role and instance.role.name == 'super_admin' and 
        instance.user and not instance.user.is_superuser):
        raise ValidationError(
            "The 'super_admin' role can only be assigned to users with is_superuser=True."
        )


@receiver([post_save, post_delete], sender=AdminUserRole)
def clear_admin_user_cache(sender, instance, **kwargs):
    from src.user.authorization.admin_permission import AdminPermissionCache
    from src.user.permissions.validator import PermissionValidator
    from src.user.permissions.helpers import PermissionHelper
    
    user_id = instance.user_id
    
    AdminPermissionCache.clear_user_cache(user_id)
    PermissionValidator.clear_user_cache(user_id)
    PermissionHelper.clear_user_cache(user_id)
    
    from src.user.utils.cache import UserCacheManager
    UserCacheManager.invalidate_profile(user_id)

@receiver([post_save, post_delete], sender=AdminRole)
def clear_admin_role_cache(sender, instance, **kwargs):
    from src.user.authorization.admin_permission import AdminPermissionCache
    from src.user.permissions.validator import PermissionValidator
    from src.user.permissions.helpers import PermissionHelper
    
    user_roles = AdminUserRole.objects.filter(role=instance, is_active=True).values_list('user_id', flat=True).distinct()
    
    for user_id in user_roles:
        AdminPermissionCache.clear_user_cache(user_id)
        PermissionValidator.clear_user_cache(user_id)
        PermissionHelper.clear_user_cache(user_id)
        
        from src.user.utils.cache import UserCacheManager
        UserCacheManager.invalidate_profile(user_id)


class Role(BaseModel):
    """
    Legacy role model following DJANGO_MODEL_STANDARDS.md conventions.
    Field ordering: Content → Flags
    """
    # 2. Primary Content Fields
    name = models.CharField(
        max_length=255,
        db_index=True,
        verbose_name="Name",
        help_text="Role name"
    )
    
    # 3. Description Fields
    description = models.TextField(
        null=True,
        blank=True,
        verbose_name="Description",
        help_text="Role description"
    )
    
    # 4. Boolean Flags
    is_superuser = models.BooleanField(
        default=False,
        db_index=True,
        verbose_name="Superuser",
        help_text="Designates whether this role has superuser privileges"
    )

    class Meta(BaseModel.Meta):
        db_table = 'roles'
        verbose_name = 'Role (Legacy)'
        verbose_name_plural = 'Roles (Legacy)'
        ordering = ['name']
        indexes = [
            # Composite index for filtering roles
            models.Index(fields=['is_superuser', 'name']),
            # Note: name already has db_index=True, no need for separate Index()
            # Note: public_id already indexed in BaseModel
        ]

    def __str__(self):
        return self.name


class CustomPermission(BaseModel):
    """
    Legacy custom permission model following DJANGO_MODEL_STANDARDS.md conventions.
    Field ordering: Content → Description
    """
    # 2. Primary Content Fields
    name = models.CharField(
        max_length=255,
        db_index=True,
        verbose_name="Name",
        help_text="Permission name"
    )
    codename = models.CharField(
        max_length=100,
        unique=True,
        db_index=True,
        verbose_name="Code Name",
        help_text="Unique code name for the permission"
    )
    
    # 3. Description Fields
    description = models.TextField(
        null=True,
        blank=True,
        verbose_name="Description",
        help_text="Permission description"
    )

    class Meta(BaseModel.Meta):
        db_table = 'custom_permissions'
        verbose_name = 'Permission (Legacy)'
        verbose_name_plural = 'Permissions (Legacy)'
        ordering = ['name']
        indexes = [
            # Composite index for common queries
            models.Index(fields=['codename', 'name']),
            # Note: codename and name already have db_index=True and unique=True (automatic indexes)
            # Note: public_id already indexed in BaseModel
        ]

    def __str__(self):
        return self.name


class UserRole(BaseModel):
    """
    Legacy user role assignment model following DJANGO_MODEL_STANDARDS.md conventions.
    Field ordering: Relationships
    """
    # 5. Relationships
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        db_index=True,
        related_name='legacy_user_roles',
        verbose_name="User",
        help_text="User assigned to this role"
    )
    role = models.ForeignKey(
        Role,
        on_delete=models.CASCADE,
        db_index=True,
        related_name='legacy_user_roles',
        verbose_name="Role",
        help_text="Role assigned to the user"
    )

    class Meta(BaseModel.Meta):
        db_table = 'user_roles'
        verbose_name = 'User Role (Legacy)'
        verbose_name_plural = 'User Roles (Legacy)'
        unique_together = ('user', 'role')
        indexes = [
            # Composite indexes for common query patterns
            models.Index(fields=['user', 'is_active']),
            models.Index(fields=['role', 'is_active']),
            # Note: public_id already indexed in BaseModel
        ]

    def __str__(self):
        return f"{self.user} - {self.role}"


class RolePermission(BaseModel):
    """
    Legacy role permission assignment model following DJANGO_MODEL_STANDARDS.md conventions.
    Field ordering: Relationships
    """
    # 5. Relationships
    role = models.ForeignKey(
        Role,
        on_delete=models.CASCADE,
        db_index=True,
        related_name='legacy_role_permissions',
        verbose_name="Role",
        help_text="Role assigned to this permission"
    )
    permission = models.ForeignKey(
        CustomPermission,
        on_delete=models.CASCADE,
        db_index=True,
        related_name='legacy_role_permissions',
        verbose_name="Permission",
        help_text="Permission assigned to the role"
    )

    class Meta(BaseModel.Meta):
        db_table = 'role_permissions'
        verbose_name = 'Role Permission (Legacy)'
        verbose_name_plural = 'Role Permissions (Legacy)'
        unique_together = ('role', 'permission')
        indexes = [
            # Composite indexes for common query patterns
            models.Index(fields=['role', 'is_active']),
            models.Index(fields=['permission', 'is_active']),
            # Note: public_id already indexed in BaseModel
        ]

    def __str__(self):
        return f"{self.role} - {self.permission}"