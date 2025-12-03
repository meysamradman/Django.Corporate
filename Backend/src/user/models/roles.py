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
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        db_index=True,
        limit_choices_to={'is_staff': True},
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
    role = models.ForeignKey(Role, on_delete=models.CASCADE, db_index=True)
    permission = models.ForeignKey(CustomPermission, on_delete=models.CASCADE, db_index=True)

    class Meta:
        db_table = 'role_permissions'
        unique_together = ('role', 'permission')

    def __str__(self):
        return f"{self.role} - {self.permission}"