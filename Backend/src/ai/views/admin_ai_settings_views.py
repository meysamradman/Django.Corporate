from rest_framework import viewsets, status
from rest_framework.decorators import action
from django.db import transaction

from src.ai.models.admin_ai_settings import AdminAISettings
from src.ai.serializers.admin_ai_settings_serializer import (
    AdminAISettingsSerializer,
    AdminAISettingsCreateUpdateSerializer,
    AdminAISettingsListSerializer
)
from src.ai.messages.messages import AI_SUCCESS, AI_ERRORS
from src.user.auth.admin_session_auth import CSRFExemptSessionAuthentication
from src.core.responses import APIResponse
from src.user.authorization import SimpleAdminPermission, SuperAdminOnly
from src.user.permissions import PermissionValidator


class AdminAISettingsViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing personal AI settings
    هر ادمین می‌تواند تنظیمات AI شخصی خودش را مدیریت کند
    """
    authentication_classes = [CSRFExemptSessionAuthentication]
    permission_classes = [SimpleAdminPermission]
    queryset = AdminAISettings.objects.all()
    serializer_class = AdminAISettingsSerializer
    lookup_field = 'id'
    
    def get_queryset(self):
        """
        هر ادمین فقط تنظیمات خودش را می‌بیند
        سوپر ادمین همه را می‌بیند
        """
        if self.request.user.is_admin_full:
            return AdminAISettings.objects.all().select_related('admin').order_by('-created_at')
        
        return AdminAISettings.objects.filter(
            admin=self.request.user
        ).order_by('-created_at')
    
    def get_serializer_class(self):
        """Use appropriate serializer for different actions"""
        if self.action in ['create', 'update', 'partial_update']:
            return AdminAISettingsCreateUpdateSerializer
        elif self.action == 'list' and self.request.user.is_admin_full:
            # سوپر ادمین لیست کامل می‌بیند
            return AdminAISettingsListSerializer
        return AdminAISettingsSerializer
    
    def list(self, request):
        """
        لیست تنظیمات AI
        - ادمین عادی: فقط تنظیمات خودش
        - سوپر ادمین: همه تنظیمات
        """
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        
        return APIResponse.success(
            message=AI_SUCCESS.get("settings_list_retrieved", "تنظیمات با موفقیت دریافت شد"),
            data=serializer.data
        )
    
    def retrieve(self, request, *args, **kwargs):
        """دریافت جزئیات یک تنظیمات"""
        instance = self.get_object()
        
        # بررسی دسترسی: فقط صاحب تنظیمات یا سوپر ادمین
        if instance.admin != request.user and not request.user.is_admin_full:
            return APIResponse.error(
                message=AI_ERRORS.get("settings_not_authorized", "شما به این تنظیمات دسترسی ندارید"),
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        serializer = self.get_serializer(instance)
        return APIResponse.success(
            message=AI_SUCCESS.get("settings_retrieved", "تنظیمات با موفقیت دریافت شد"),
            data=serializer.data
        )
    
    def create(self, request):
        """
        ایجاد تنظیمات AI شخصی
        """
        print(f"\n[AI Settings] CREATE called by user: {request.user.mobile}")
        print(f"[AI Settings] Request data: {request.data}")
        
        # بررسی پرمیژن
        if not PermissionValidator.has_permission(request.user, 'ai.settings.personal.manage'):
            return APIResponse.error(
                message=AI_ERRORS.get("settings_not_authorized", "شما به مدیریت تنظیمات AI دسترسی ندارید"),
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        serializer = self.get_serializer(data=request.data)
        
        if not serializer.is_valid():
            print(f"[AI Settings] Validation failed: {serializer.errors}")
            return APIResponse.error(
                message=AI_ERRORS.get("validation_error", "خطا در اعتبارسنجی داده‌ها"),
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            with transaction.atomic():
                # ایجاد تنظیمات برای ادمین فعلی
                settings = serializer.save(admin=request.user)
                print(f"[AI Settings] Settings created with ID: {settings.id}")
                print(f"[AI Settings] Provider: {settings.provider_name}")
                print(f"[AI Settings] Has API key: {bool(settings.api_key)}")
                print(f"[AI Settings] API key length: {len(settings.api_key) if settings.api_key else 0}")
                print(f"[AI Settings] Use shared API: {settings.use_shared_api}")
                print(f"[AI Settings] Is active: {settings.is_active}")
                
                response_serializer = AdminAISettingsSerializer(settings)
                return APIResponse.success(
                    message=AI_SUCCESS.get("settings_created", "تنظیمات با موفقیت ایجاد شد"),
                    data=response_serializer.data,
                    status_code=status.HTTP_201_CREATED
                )
        except Exception as e:
            print(f"[AI Settings] ERROR in create: {str(e)}")
            import traceback
            traceback.print_exc()
            return APIResponse.error(
                message=f"خطا در ایجاد تنظیمات: {str(e)}",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def update(self, request, *args, **kwargs):
        """
        ویرایش تنظیمات AI شخصی
        """
        instance = self.get_object()
        
        print(f"\n[AI Settings] UPDATE called by user: {request.user.mobile}")
        print(f"[AI Settings] Request data: {request.data}")
        print(f"[AI Settings] Updating settings ID: {instance.id}")
        print(f"[AI Settings] Current provider: {instance.provider_name}")
        print(f"[AI Settings] Current API key length: {len(instance.api_key) if instance.api_key else 0}")
        
        # بررسی دسترسی: فقط صاحب تنظیمات یا سوپر ادمین
        if instance.admin != request.user and not request.user.is_admin_full:
            return APIResponse.error(
                message=AI_ERRORS.get("settings_not_authorized", "شما به این تنظیمات دسترسی ندارید"),
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        # بررسی پرمیژن
        if not PermissionValidator.has_permission(request.user, 'ai.settings.personal.manage'):
            return APIResponse.error(
                message=AI_ERRORS.get("settings_not_authorized", "شما به مدیریت تنظیمات AI دسترسی ندارید"),
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        partial = kwargs.pop('partial', False)
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        
        if not serializer.is_valid():
            print(f"[AI Settings] Validation failed: {serializer.errors}")
            return APIResponse.error(
                message=AI_ERRORS.get("validation_error", "خطا در اعتبارسنجی داده‌ها"),
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            with transaction.atomic():
                serializer.save()
                
                # ✅ Refresh instance to get updated data
                instance.refresh_from_db()
                
                print(f"[AI Settings] Settings updated successfully")
                print(f"[AI Settings] New provider: {instance.provider_name}")
                print(f"[AI Settings] New API key length: {len(instance.api_key) if instance.api_key else 0}")
                print(f"[AI Settings] Use shared API: {instance.use_shared_api}")
                print(f"[AI Settings] Is active: {instance.is_active}")
                
                response_serializer = AdminAISettingsSerializer(instance)
                return APIResponse.success(
                    message=AI_SUCCESS.get("settings_updated", "تنظیمات با موفقیت به‌روزرسانی شد"),
                    data=response_serializer.data
                )
        except Exception as e:
            print(f"[AI Settings] ERROR in update: {str(e)}")
            import traceback
            traceback.print_exc()
            return APIResponse.error(
                message=f"خطا در به‌روزرسانی تنظیمات: {str(e)}",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def destroy(self, request, *args, **kwargs):
        """
        حذف تنظیمات AI شخصی
        """
        instance = self.get_object()
        
        # بررسی دسترسی: فقط صاحب تنظیمات یا سوپر ادمین
        if instance.admin != request.user and not request.user.is_admin_full:
            return APIResponse.error(
                message=AI_ERRORS.get("settings_not_authorized", "شما به این تنظیمات دسترسی ندارید"),
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        try:
            instance.delete()
            return APIResponse.success(
                message=AI_SUCCESS.get("settings_deleted", "تنظیمات با موفقیت حذف شد"),
                status_code=status.HTTP_204_NO_CONTENT
            )
        except Exception as e:
            return APIResponse.error(
                message=f"خطا در حذف تنظیمات: {str(e)}",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'], url_path='my-settings')
    def my_settings(self, request):
        """
        دریافت تنظیمات AI خود ادمین
        """
        settings = AdminAISettings.objects.filter(admin=request.user)
        serializer = AdminAISettingsSerializer(settings, many=True)
        
        return APIResponse.success(
            message=AI_SUCCESS.get("settings_retrieved", "تنظیمات شما با موفقیت دریافت شد"),
            data=serializer.data
        )
    
    @action(detail=False, methods=['get', 'patch'], url_path='global-control', permission_classes=[SuperAdminOnly])
    def global_control(self, request):
        """
        کنترل کلی دسترسی ادمین‌های معمولی به shared API
        فقط سوپر ادمین می‌تواند این تنظیم را تغییر دهد
        """
        from django.core.cache import cache
        
        CACHE_KEY = 'ai_allow_regular_admins_use_shared_api'
        
        if request.method == 'GET':
            # دریافت وضعیت فعلی
            allow = cache.get(CACHE_KEY)
            if allow is None:
                allow = True  # Default: مجاز
                cache.set(CACHE_KEY, allow, timeout=None)  # بدون expire
            
            return APIResponse.success(
                message="وضعیت Global Control دریافت شد",
                data={'allow_regular_admins_use_shared_api': allow}
            )
        
        elif request.method == 'PATCH':
            # تغییر وضعیت
            allow = request.data.get('allow_regular_admins_use_shared_api')
            
            if allow is None:
                return APIResponse.error(
                    message="فیلد 'allow_regular_admins_use_shared_api' الزامی است",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            # ذخیره در cache (بدون expire)
            cache.set(CACHE_KEY, bool(allow), timeout=None)
            
            return APIResponse.success(
                message="Global Control با موفقیت به‌روزرسانی شد",
                data={'allow_regular_admins_use_shared_api': bool(allow)}
            )
    
    @action(detail=True, methods=['post'], url_path='reset-monthly-usage')
    def reset_monthly_usage(self, request, id=None):
        """
        ریست کردن استفاده ماهانه (فقط سوپر ادمین)
        """
        if not request.user.is_admin_full:
            return APIResponse.error(
                message=AI_ERRORS.get("settings_not_authorized", "فقط سوپر ادمین می‌تواند استفاده ماهانه را ریست کند"),
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        instance = self.get_object()
        
        try:
            instance.reset_monthly_usage()
            serializer = AdminAISettingsSerializer(instance)
            
            return APIResponse.success(
                message=AI_SUCCESS.get("usage_reset", "استفاده ماهانه با موفقیت ریست شد"),
                data=serializer.data
            )
        except Exception as e:
            return APIResponse.error(
                message=f"خطا در ریست استفاده ماهانه: {str(e)}",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'], url_path='usage-statistics')
    def usage_statistics(self, request):
        """
        آمار استفاده از AI (فقط سوپر ادمین)
        """
        if not request.user.is_admin_full:
            return APIResponse.error(
                message=AI_ERRORS.get("settings_not_authorized", "فقط سوپر ادمین می‌تواند آمار کلی را مشاهده کند"),
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        from django.db.models import Sum, Count, Avg
        
        stats = AdminAISettings.objects.aggregate(
            total_usage=Sum('usage_count'),
            total_monthly_usage=Sum('monthly_usage'),
            active_admins=Count('admin', distinct=True),
            avg_monthly_usage=Avg('monthly_usage')
        )
        
        # پرمصرف‌ترین ادمین‌ها
        top_users = AdminAISettings.objects.select_related('admin').order_by('-monthly_usage')[:10]
        top_users_data = AdminAISettingsListSerializer(top_users, many=True).data
        
        return APIResponse.success(
            message=AI_SUCCESS.get("statistics_retrieved", "آمار با موفقیت دریافت شد"),
            data={
                'overview': stats,
                'top_users': top_users_data
            }
        )

