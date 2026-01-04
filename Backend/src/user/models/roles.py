from django.db import models
from django.conf import settings
from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.db.models.signals import post_save, post_delete, pre_save
from django.dispatch import receiver
from django.utils import timezone
from src.core.models import BaseModel


class AdminRole(BaseModel):
    ADMIN_ROLES = (
        ('super_admin', 'Super Admin'),
        ('blog_manager', 'Blog Manager'),
        ('portfolio_manager', 'Portfolio Manager'),
        ('media_manager', 'Media Manager'),
        ('forms_manager', 'Forms Manager'),
        ('pages_manager', 'Pages Manager'),
        ('panel_manager', 'Panel Manager'),
        ('chatbot_manager', 'Chatbot Manager'),
        ('ticket_manager', 'Ticket Manager'),
        ('email_manager', 'Email Manager'),
        ('ai_manager', 'AI Manager'),
        ('analytics_manager', 'Analytics Manager'),
        ('settings_manager', 'Settings Manager'),
        ('user_manager', 'User Manager'),
        ('real_estate_manager', 'Real Estate Manager'),
        ('property_agent', 'Property Agent'),
        ('agency_manager', 'Agency Manager'),
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
            models.Index(fields=['name', 'is_active']),
        ]

    def __str__(self):
        return self.display_name



class AdminUserRole(BaseModel):
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
    
    permissions_cache = models.JSONField(
        default=dict, 
        blank=True,
        verbose_name="Permissions Cache",
        help_text="Cached permissions for performance"
    )
    
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
            models.Index(fields=['user', 'is_active']),
            models.Index(fields=['role', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.user} - {self.role}"
    
    def update_permissions_cache(self):
        role_permissions = self.role.permissions if self.role.permissions else {}
        self.permissions_cache = role_permissions
        
        super(AdminUserRole, self).save(update_fields=['permissions_cache', 'last_cache_update'])
        
        from src.user.access_control.classes.admin_permission import AdminPermissionCache
        from src.user.access_control.definitions.validator import PermissionValidator
        from src.user.access_control.definitions.helpers import PermissionHelper
        
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


@receiver([post_save, post_delete], sender=AdminUserRole, dispatch_uid="clear_admin_user_cache")
def clear_admin_user_cache(sender, instance, **kwargs):
    from src.user.access_control import AdminPermissionCache, PermissionValidator, PermissionHelper
    
    user_id = instance.user_id
    
    AdminPermissionCache.clear_user_cache(user_id)
    PermissionValidator.clear_user_cache(user_id)
    PermissionHelper.clear_user_cache(user_id)
    
    from src.user.utils.cache import UserCacheManager
    UserCacheManager.invalidate_profile(user_id)

@receiver([post_save, post_delete], sender=AdminRole, dispatch_uid="clear_admin_role_cache")
def clear_admin_role_cache(sender, instance, **kwargs):
    from src.user.access_control import AdminPermissionCache, PermissionValidator, PermissionHelper
    
    user_roles = AdminUserRole.objects.filter(role=instance, is_active=True).values_list('user_id', flat=True).distinct()
    
    for user_id in user_roles:
        AdminPermissionCache.clear_user_cache(user_id)
        PermissionValidator.clear_user_cache(user_id)
        PermissionHelper.clear_user_cache(user_id)
        
        from src.user.utils.cache import UserCacheManager
        UserCacheManager.invalidate_profile(user_id)


class Role(BaseModel):
    name = models.CharField(
        max_length=255,
        db_index=True,
        verbose_name="Name",
        help_text="Role name"
    )
    
    description = models.TextField(
        null=True,
        blank=True,
        verbose_name="Description",
        help_text="Role description"
    )
    
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
            models.Index(fields=['is_superuser', 'name']),
        ]

    def __str__(self):
        return self.name


class CustomPermission(BaseModel):
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
            models.Index(fields=['codename', 'name']),
        ]

    def __str__(self):
        return self.name


class UserRole(BaseModel):
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
            models.Index(fields=['user', 'is_active']),
            models.Index(fields=['role', 'is_active']),
        ]

    def __str__(self):
        return f"{self.user} - {self.role}"


class RolePermission(BaseModel):
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
            models.Index(fields=['role', 'is_active']),
            models.Index(fields=['permission', 'is_active']),
        ]

    def __str__(self):
        return f"{self.role} - {self.permission}"