from rest_framework import serializers
from django.core.exceptions import ValidationError
from datetime import datetime
from src.user.models import User, AdminRole
from src.user.messages import AUTH_ERRORS
from src.media.models import ImageMedia
from src.user.utils.email_validator import validate_email_address
from src.user.utils.mobile_validator import validate_mobile_number
from django.db.models import Q
from src.user.authorization.role_permissions import BASE_ADMIN_PERMISSIONS, BASE_ADMIN_PERMISSIONS_SIMPLE


class AdminListSerializer(serializers.ModelSerializer):
    profile = serializers.SerializerMethodField()
    permissions = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()
    roles = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'public_id', 'full_name', 'mobile', 'email', 'is_active', 'is_staff', 'is_superuser', 
                 'created_at', 'updated_at', 'profile', 'permissions', 'roles']
    
    def get_profile(self, obj):
        """دریافت پروفایل بر اساس نوع کاربر"""
        if obj.user_type == 'admin' and hasattr(obj, 'admin_profile') and obj.admin_profile:
            from src.user.serializers.admin.admin_profile_serializer import AdminProfileSerializer
            return AdminProfileSerializer(obj.admin_profile, context=self.context).data
        elif obj.user_type == 'user' and hasattr(obj, 'user_profile') and obj.user_profile:
            from src.user.serializers.user.user_profile_serializer import UserProfileSerializer
            return UserProfileSerializer(obj.user_profile, context=self.context).data
        return None
    
    def get_full_name(self, obj):
        """دریافت نام کامل بهینه از پروفایل پیش‌بارگذاری شده"""
        if hasattr(obj, 'admin_profile') and obj.admin_profile:
            profile = obj.admin_profile
            if profile.first_name and profile.last_name:
                return f"{profile.first_name} {profile.last_name}"
            elif profile.first_name:
                return profile.first_name
            elif profile.last_name:
                return profile.last_name
        return obj.mobile or obj.email or f"کاربر {obj.id}"
    
    def get_roles(self, obj):
        """دریافت نقش‌های کاربر برای لیست ادمین"""
        if obj.is_superuser:
            return [{'name': 'super_admin', 'display_name': 'سوپر ادمین'}]
        
        assigned_roles = []
        try:
            if hasattr(obj, 'adminuserrole_set'):
                user_role_assignments = obj.adminuserrole_set.filter(
                    is_active=True
                ).select_related('role')
                assigned_roles = [
                    {
                        'id': ur.role.id,
                        'name': ur.role.name,
                        'display_name': ur.role.display_name
                    } 
                    for ur in user_role_assignments
                ]
        except:
            pass
        
        return assigned_roles
    
    def get_permissions(self, user):
        """دریافت مجوزها به صورت ساده برای لیست ادمین"""
        if user.user_type == 'user' and not user.is_staff and not user.is_superuser:
            return {
                'access_level': 'user',
                'roles': [],
                'permissions_count': 0
            }
        
        if user.is_superuser:
            return {
                'access_level': 'super_admin',
                'roles': ['super_admin'],
                'permissions_count': 'unlimited',
                'base_permissions': []
            }
        
        assigned_roles = []
        try:
            if hasattr(user, 'adminuserrole_set'):
                user_role_assignments = user.adminuserrole_set.filter(
                    is_active=True
                ).select_related('role')
                assigned_roles = [ur.role.name for ur in user_role_assignments]
        except:
            pass
        
        return {
            'access_level': 'admin',
            'roles': assigned_roles,
            'permissions_count': len(assigned_roles) * 10 if assigned_roles else 0,
            'has_permissions': len(assigned_roles) > 0,
            'base_permissions': BASE_ADMIN_PERMISSIONS_SIMPLE
        }


class AdminDetailSerializer(serializers.ModelSerializer):
    profile = serializers.SerializerMethodField()
    permissions = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'public_id', 'email', 'mobile', 'is_active', 'is_staff', 'is_superuser', 
                 'created_at', 'updated_at', 'profile', 'full_name', 'permissions']
    
    def get_profile(self, obj):
        """دریافت پروفایل بر اساس نوع کاربر"""
        if obj.user_type == 'admin' and hasattr(obj, 'admin_profile') and obj.admin_profile:
            from src.user.serializers.admin.admin_profile_serializer import AdminProfileSerializer
            return AdminProfileSerializer(obj.admin_profile, context=self.context).data
        elif obj.user_type == 'user' and hasattr(obj, 'user_profile') and obj.user_profile:
            from src.user.serializers.user.user_profile_serializer import UserProfileSerializer
            return UserProfileSerializer(obj.user_profile, context=self.context).data
        return None
    
    def get_full_name(self, user):
        """دریافت نام کامل بهینه از پروفایل پیش‌بارگذاری شده"""
        if user.user_type == 'admin' and hasattr(user, 'admin_profile') and user.admin_profile:
            profile = user.admin_profile
            if profile.first_name and profile.last_name:
                return f"{profile.first_name} {profile.last_name}"
            elif profile.first_name:
                return profile.first_name
            elif profile.last_name:
                return profile.last_name
        elif user.user_type == 'user' and hasattr(user, 'user_profile') and user.user_profile:
            profile = user.user_profile
            if profile.first_name and profile.last_name:
                return f"{profile.first_name} {profile.last_name}"
            elif profile.first_name:
                return profile.first_name
            elif profile.last_name:
                return profile.last_name
        return user.mobile or user.email or f"کاربر {user.id}"
    
    def get_permissions(self, user):
        """دریافت مجوزهای کامل برای جزئیات ادمین"""
        if user.user_type == 'user' and not user.is_staff and not user.is_superuser:
            return {
                'access_level': 'user',
                'permissions': [],
                'roles': [],
                'modules': [],
                'actions': [],
                'permission_summary': {
                    'total_permissions': 0,
                    'accessible_modules': 0,
                    'available_actions': 0,
                    'access_type': 'website_user'
                }
            }
        
        if user.is_superuser:
            return {
                'access_level': 'super_admin',
                'permissions': ['all'],
                'roles': ['super_admin'],
                'modules': ['all'],
                'actions': ['all'],
                'base_permissions': [],
                'permission_summary': {
                    'total_permissions': 'unlimited',
                    'access_type': 'full_system_access',
                    'restrictions': 'none'
                }
            }
        
        assigned_roles = []
        permissions_list = []
        modules = set()
        actions = set()
        
        try:
            if hasattr(user, 'adminuserrole_set'):
                user_role_assignments = user.adminuserrole_set.filter(
                    is_active=True
                ).select_related('role')
                
                for ur in user_role_assignments:
                    assigned_roles.append(ur.role.name)
                    
                    role_permissions = ur.role.permissions.get('actions', [])
                    role_modules = ur.role.permissions.get('modules', [])
                    
                    modules.update(role_modules)
                    actions.update(role_permissions)
                    
                    for module in role_modules:
                        for action in role_permissions:
                            if module != 'all' and action != 'all':
                                permissions_list.append(f"{module}.{action}")
        except Exception as e:
            pass
        
        return {
            'access_level': 'admin',
            'permissions': sorted(list(permissions_list)),
            'roles': assigned_roles,
            'modules': list(modules),
            'actions': list(actions),
            'base_permissions': BASE_ADMIN_PERMISSIONS,
            'permission_summary': {
                'total_permissions': len(permissions_list),
                'accessible_modules': len(modules),
                'available_actions': len(actions),
                'access_type': 'role_based_access'
            }
        }


class AdminUpdateSerializer(serializers.Serializer):
    # فیلدهای کاربر
    email = serializers.EmailField(required=False, allow_blank=True, allow_null=True)
    mobile = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    password = serializers.CharField(write_only=True, required=False, allow_blank=True, allow_null=True)
    is_active = serializers.BooleanField(required=False)
    is_staff = serializers.BooleanField(required=False)
    is_superuser = serializers.BooleanField(required=False)
    
    # فیلد نقش
    role_id = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    # آبجکت پروفایل
    profile = serializers.DictField(required=False)
    
    # پشتیبانی از آپلود مستقیم تصویر پروفایل
    profile_picture = serializers.ImageField(required=False, allow_null=True, write_only=True)

    def validate_profile_picture(self, value):
        """اعتبارسنجی فایل تصویر پروفایل آپلود شده با استفاده از سرویس مدیا"""
        if value is None:
            return value
        
        from src.media.utils.validators import validate_image_file
        
        try:
            validate_image_file(value)
            return value
        except Exception as e:
            raise serializers.ValidationError(str(e))

    def validate_profile_picture_id(self, value):
        """اعتبارسنجی ID تصویر پروفایل"""
        if value is None:
            return value
        
        try:
            from src.media.models import ImageMedia
            image_media = ImageMedia.objects.get(id=value, is_active=True)
            return value
        except ImageMedia.DoesNotExist:
            raise serializers.ValidationError("ID مدیا نامعتبر یا تصویر فعال نیست")
    
    def validate_email(self, value):
        if value == "": 
            return None
        if value:
            user_id = self.context.get('user_id')
            try:
                validate_email_address(value)
                from django.db.models import Q
                if User.objects.filter(~Q(id=user_id), email=value).exists():
                    raise serializers.ValidationError(AUTH_ERRORS["auth_email_exists"])
            except ValidationError:
                raise serializers.ValidationError(AUTH_ERRORS["auth_invalid_email"])
        return value
    
    def validate_mobile(self, value):
        if value == "":
            return None
        if value:
            user_id = self.context.get('user_id')
            try:
                validated_mobile = validate_mobile_number(value)
                from django.db.models import Q
                if User.objects.filter(~Q(id=user_id), mobile=validated_mobile).exists():
                    raise serializers.ValidationError(AUTH_ERRORS["auth_mobile_exists"])
                return validated_mobile
            except ValidationError:
                raise serializers.ValidationError(AUTH_ERRORS["auth_invalid_mobile"])
        return value

    def validate_role_id(self, value):
        """اعتبارسنجی ID نقش"""
        if value is None or value == "" or value == "none":
            return None
        
        try:
            role_id = int(value)
            from src.user.models import AdminRole
            AdminRole.objects.get(id=role_id, is_active=True)
            return role_id
        except (ValueError, TypeError):
            raise serializers.ValidationError("فرمت ID نقش نامعتبر است")
        except AdminRole.DoesNotExist:
            raise serializers.ValidationError("نقش یافت نشد یا غیرفعال است")

    def validate(self, data):
        admin_user = self.context.get('admin_user')
        if data.get('is_superuser') is True and not admin_user.is_superuser:
            raise serializers.ValidationError({'is_superuser': AUTH_ERRORS["auth_only_superuser_set"]})

        return data
    
    def to_internal_value(self, data):
        """تبدیل داده‌های ورودی به مقادیر داخلی"""
        user_id = self.context.get('user_id')
        
        # Debug: چاپ داده‌های ورودی
        print(f"🔍 AdminUpdateSerializer - Input data: {data}")
        
        if user_id:
            try:
                from src.user.models import User
                user = User.objects.get(id=user_id)
                
                if hasattr(user, 'admin_profile') and user.admin_profile:
                    data['profile'] = data.get('profile', {})
                    profile_data = data['profile']
                    
                    # اضافه کردن profile_picture به profile_data اگر در data اصلی وجود دارد
                    if 'profile_picture' in data:
                        profile_data['profile_picture'] = data['profile_picture']
                        print(f"🔍 AdminUpdateSerializer - Added profile_picture to profile_data: {data['profile_picture']}")
                    
                    context_with_user_id = self.context.copy()
                    context_with_user_id['admin_user_id'] = user_id
                    from src.user.serializers.admin.admin_profile_serializer import AdminProfileUpdateSerializer
                    temp_serializer = AdminProfileUpdateSerializer(
                        instance=user.admin_profile,
                        data=profile_data,
                        partial=True,
                        context=context_with_user_id
                    )
                    if temp_serializer.is_valid():
                        profile_data_for_super = {}
                        for key, value in temp_serializer.validated_data.items():
                            if hasattr(value, 'id'):
                                profile_data_for_super[key] = value.id
                            else:
                                profile_data_for_super[key] = value
                        data['profile'] = profile_data_for_super
                        print(f"🔍 AdminUpdateSerializer - Final profile_data: {profile_data_for_super}")
                    else:
                        print(f"❌ AdminUpdateSerializer - Profile validation errors: {temp_serializer.errors}")
                        raise serializers.ValidationError({'profile': temp_serializer.errors})
            except User.DoesNotExist:
                pass
        
        profile_data = data.pop('profile', None)
        
        try:
            result = super().to_internal_value(data)
            
            if profile_data:
                result['profile'] = profile_data
                print(f"🔍 AdminUpdateSerializer - Final result with profile: {result}")
            
            return result
        except Exception as e:
            print(f"❌ AdminUpdateSerializer - Error in to_internal_value: {e}")
            raise e


class AdminFilterSerializer(serializers.Serializer):
    user_type = serializers.ChoiceField(
        choices=['all', 'admin', 'user'],
        default='all',
        required=False
    )
    is_superuser = serializers.BooleanField(required=False, allow_null=True)
    search = serializers.CharField(required=False, allow_blank=True)


class BulkDeleteSerializer(serializers.Serializer):
    ids = serializers.ListField(
        child=serializers.IntegerField(),
        allow_empty=False,
        min_length=1,
        help_text="لیست IDهای عددی کاربران برای حذف"
    )
    user_type = serializers.CharField(required=False)

    def validate_ids(self, value):
        if not value:
            raise serializers.ValidationError("لیست IDها نمی‌تواند خالی باشد")
        if not all(isinstance(item, int) for item in value):
            raise serializers.ValidationError("تمام آیتم‌های لیست باید عدد صحیح باشند")
        return value