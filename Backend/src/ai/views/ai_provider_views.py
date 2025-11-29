"""
✅ AI Provider ViewSets - Complete Admin Panel Implementation (2025)

Features:
- Full CRUD for Providers & Models
- Admin-specific permissions
- Redis cache with invalidation
- Computed fields in responses
- Filtering by capability
"""
# Django imports
from django.core.cache import cache
from django.db.models import Q, Count

# DRF imports
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied

# Third-party imports
from django_filters.rest_framework import DjangoFilterBackend

# Local imports
from src.ai.models import AIProvider, AIModel, AdminProviderSettings
from src.ai.serializers.ai_provider_serializer import (
    AIProviderListSerializer,
    AIProviderDetailSerializer,
    AIProviderCreateUpdateSerializer,
    AIModelListSerializer,
    AIModelDetailSerializer,
    AIModelCreateUpdateSerializer,
    AdminProviderSettingsSerializer,
    AdminProviderSettingsUpdateSerializer,
)
from src.ai.messages.messages import AI_ERRORS, AI_SUCCESS
from src.user.permissions.validator import PermissionValidator
from src.core.responses.response import APIResponse


class AIProviderViewSet(viewsets.ModelViewSet):
    """
    ✅ ViewSet for AI Providers (OpenAI, Gemini, etc.)
    
    Permissions:
    - List/Retrieve: All admin users
    - Create/Update/Delete: Super admin only
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'display_name', 'description']
    ordering_fields = ['name', 'sort_order', 'total_requests', 'created_at']
    ordering = ['sort_order', 'name']
    
    def get_queryset(self):
        """
        ✅ Get providers based on user type
        - Super Admin: همه provider ها (فعال و غیرفعال)
        - Normal Admin: فقط provider های فعال
        """
        is_super = getattr(self.request.user, 'is_superuser', False) or getattr(self.request.user, 'is_admin_full', False)
        
        if is_super:
            # ✅ سوپر ادمین: همه provider ها
            return AIProvider.objects.all().annotate(
                models_count=Count('models', filter=Q(models__is_active=True))
            )
        else:
            # ✅ ادمین معمولی: فقط provider های فعال
            return AIProvider.objects.filter(is_active=True).annotate(
                models_count=Count('models', filter=Q(models__is_active=True))
            )
    
    def get_serializer_class(self):
        if self.action == 'list':
            return AIProviderListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return AIProviderCreateUpdateSerializer
        return AIProviderDetailSerializer
    
    def list(self, request, *args, **kwargs):
        """
        ✅ List providers - all admins can view active providers
        اگر سوپر ادمین provider را فعال کند، برای همه ادمین‌ها قابل مشاهده است
        """
        # ✅ اگر سوپر ادمین است، همه provider ها را ببین (فعال و غیرفعال)
        is_super = getattr(request.user, 'is_superuser', False) or getattr(request.user, 'is_admin_full', False)
        if is_super:
            return super().list(request, *args, **kwargs)
        
        # ✅ برای ادمین‌های معمولی: فقط provider های فعال را نمایش بده
        # اگر provider فعال است، یعنی سوپر ادمین آن را فعال کرده و باید برای همه قابل مشاهده باشد
        # نیازی به permission check نیست - فقط فعال بودن provider کافی است
        return super().list(request, *args, **kwargs)
    
    def retrieve(self, request, *args, **kwargs):
        """✅ Retrieve provider - all admins can view"""
        if not PermissionValidator.has_permission(request.user, 'ai.view'):
            raise PermissionDenied(AI_ERRORS.get('settings_not_authorized', 'شما دسترسی مشاهده Provider را ندارید'))
        return super().retrieve(request, *args, **kwargs)
    
    def perform_create(self, serializer):
        """✅ Create provider - only ai.manage permission"""
        if not PermissionValidator.has_permission(self.request.user, 'ai.manage'):
            raise PermissionDenied(AI_ERRORS.get('settings_not_authorized', 'فقط سوپر ادمین می‌تواند Provider جدید اضافه کند'))
        serializer.save()
        # Clear cache
        AIProvider.clear_all_cache()
    
    def perform_update(self, serializer):
        """✅ Update provider - only ai.manage permission"""
        if not PermissionValidator.has_permission(self.request.user, 'ai.manage'):
            raise PermissionDenied(AI_ERRORS.get('settings_not_authorized', 'فقط سوپر ادمین می‌تواند Provider را ویرایش کند'))
        serializer.save()
        # Clear cache
        AIProvider.clear_all_cache()
    
    def perform_destroy(self, instance):
        """✅ Delete provider - only ai.manage permission"""
        if not PermissionValidator.has_permission(self.request.user, 'ai.manage'):
            raise PermissionDenied(AI_ERRORS.get('settings_not_authorized', 'فقط سوپر ادمین می‌تواند Provider را حذف کند'))
        
        instance.is_active = False
        instance.save()
        # Clear cache
        AIProvider.clear_all_cache()
    
    @action(detail=True, methods=['post'], url_path='activate')
    def activate_provider(self, request, pk=None, id=None):
        """
        ✅ فعال‌سازی Provider
        فقط سوپر ادمین می‌تواند provider را فعال کند
        """
        if not PermissionValidator.has_permission(request.user, 'ai.manage'):
            raise PermissionDenied(AI_ERRORS.get('settings_not_authorized', 'فقط سوپر ادمین می‌تواند Provider را فعال کند'))
        
        provider = self.get_object()
        provider.is_active = True
        provider.save(update_fields=['is_active', 'updated_at'])
        
        # Clear cache
        AIProvider.clear_all_cache()
        
        serializer = self.get_serializer(provider)
        return Response({
            'status': 'success',
            'message': 'Provider فعال شد',
            'data': serializer.data
        })
    
    @action(detail=True, methods=['post'], url_path='deactivate')
    def deactivate_provider(self, request, pk=None, id=None):
        """
        ✅ غیرفعال‌سازی Provider
        فقط سوپر ادمین می‌تواند provider را غیرفعال کند
        اگر سوپر ادمین provider را غیرفعال کند، ادمین‌های معمولی دیگر نمی‌توانند آن را ببینند
        """
        if not PermissionValidator.has_permission(request.user, 'ai.manage'):
            raise PermissionDenied(AI_ERRORS.get('settings_not_authorized', 'فقط سوپر ادمین می‌تواند Provider را غیرفعال کند'))
        
        provider = self.get_object()
        provider.is_active = False
        provider.save(update_fields=['is_active', 'updated_at'])
        
        # Clear cache
        AIProvider.clear_all_cache()
        
        serializer = self.get_serializer(provider)
        return Response({
            'status': 'success',
            'message': 'Provider غیرفعال شد',
            'data': serializer.data
        })
    
    @action(detail=False, methods=['get'], url_path='available')
    def available_providers(self, request):
        """
        ✅ لیست Provider های فعال
        - اگر سوپر ادمین provider را فعال کند، برای همه ادمین‌ها قابل مشاهده است
        - ادمین‌های معمولی: فقط provider های فعال
        - سوپر ادمین: همه provider ها (فعال و غیرفعال)
        """
        # ✅ بررسی permission: ai.view یا ai.manage
        has_view_permission = PermissionValidator.has_permission(request.user, 'ai.view')
        has_manage_permission = PermissionValidator.has_permission(request.user, 'ai.manage')
        
        if not (has_view_permission or has_manage_permission):
            raise PermissionDenied(AI_ERRORS.get('settings_not_authorized', 'شما دسترسی مشاهده Provider ها را ندارید'))
        
        # ✅ استفاده از get_queryset که خودش filtering را انجام می‌دهد
        providers = self.get_queryset()
        
        # ✅ Serialize providers
        serializer = AIProviderListSerializer(providers, many=True)
        
        # ✅ فیلتر کردن provider هایی که API key دارند (shared یا personal)
        available = []
        for p in serializer.data:
            # اگر shared API key دارد یا allow_personal_keys دارد، اضافه کن
            if p.get('has_shared_api') or p.get('allow_personal_keys'):
                available.append(p)
        
        return APIResponse.success(
            message=AI_SUCCESS.get("providers_list_retrieved", "لیست Provider های فعال دریافت شد"),
            data=available,
            status_code=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """✅ Statistics for all providers - ai.view permission"""
        if not PermissionValidator.has_permission(request.user, 'ai.view'):
            raise PermissionDenied(AI_ERRORS.get('settings_not_authorized', 'شما دسترسی مشاهده آمار را ندارید'))
        providers = self.get_queryset()
        return Response({
            'total_providers': providers.count(),
            'total_models': AIModel.objects.filter(provider__is_active=True, is_active=True).count(),
            'total_requests': sum(p.total_requests for p in providers),
        })


class AIModelViewSet(viewsets.ModelViewSet):
    """
    ✅ ViewSet for AI Models (GPT-4o, Claude, Gemini, etc.)
    
    Features:
    - Filter by provider, capability
    - Computed fields: api_config, actions, usage_info
    - Admin-specific permissions
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['provider', 'is_active']
    search_fields = ['name', 'display_name', 'description', 'model_id']
    ordering_fields = ['name', 'sort_order', 'total_requests', 'created_at']
    ordering = ['provider__sort_order', 'sort_order', 'name']
    
    def get_queryset(self):
        """Models with provider - includes inactive for admin panel"""
        # ✅ برای admin panel، همه مدل‌ها را نمایش بده (فعال و غیرفعال)
        # فقط provider باید فعال باشد
        queryset = AIModel.objects.filter(
            provider__is_active=True
        ).select_related('provider')
        
        # Filter by capability
        capability = self.request.query_params.get('capability')
        if capability:
            # JSONField contains filter
            queryset = [m for m in queryset if capability in m.capabilities]
        
        return queryset
    
    def get_serializer_class(self):
        if self.action == 'list':
            return AIModelListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return AIModelCreateUpdateSerializer
        return AIModelDetailSerializer
    
    def get_serializer_context(self):
        """Add request to context for computed fields"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def list(self, request, *args, **kwargs):
        """
        ✅ List models - all admins can view models of active providers
        اگر سوپر ادمین provider را فعال کند، مدل‌های آن برای همه ادمین‌ها قابل مشاهده است
        """
        # ✅ نیازی به permission check نیست - فقط provider باید فعال باشد
        # get_queryset() قبلاً فیلتر کرده است که فقط provider های فعال را نمایش دهد
        return super().list(request, *args, **kwargs)
    
    def retrieve(self, request, *args, **kwargs):
        """
        ✅ Retrieve model - all admins can view models of active providers
        اگر سوپر ادمین provider را فعال کند، مدل‌های آن برای همه ادمین‌ها قابل مشاهده است
        """
        # ✅ نیازی به permission check نیست - فقط provider باید فعال باشد
        # get_queryset() قبلاً فیلتر کرده است که فقط provider های فعال را نمایش دهد
        return super().retrieve(request, *args, **kwargs)
    
    def perform_create(self, serializer):
        """✅ Create model - only ai.manage permission"""
        if not PermissionValidator.has_permission(self.request.user, 'ai.manage'):
            raise PermissionDenied(AI_ERRORS.get('settings_not_authorized', 'فقط سوپر ادمین می‌تواند Model جدید اضافه کند'))
        serializer.save()
        # Clear cache
        cache.delete_pattern("ai_models_*")
    
    def perform_update(self, serializer):
        """✅ Update model - only ai.manage permission"""
        if not PermissionValidator.has_permission(self.request.user, 'ai.manage'):
            raise PermissionDenied(AI_ERRORS.get('settings_not_authorized', 'فقط سوپر ادمین می‌تواند Model را ویرایش کند'))
        serializer.save()
        # Clear cache
        cache.delete_pattern("ai_models_*")
    
    @action(detail=False, methods=['get'])
    def by_capability(self, request):
        """
        ✅ Get models grouped by capability - all admins can view models of active providers
        اگر سوپر ادمین provider را فعال کند، مدل‌های آن برای همه ادمین‌ها قابل مشاهده است
        """
        capability = request.query_params.get('capability')
        if not capability:
            return Response({"error": "capability parameter required"}, status=400)
        
        # ✅ شامل مدل‌های غیرفعال هم باشه (برای admin panel)
        include_inactive = request.query_params.get('include_inactive', 'true').lower() == 'true'
        models = AIModel.get_models_by_capability(capability, include_inactive=include_inactive)
        
        # ✅ فیلتر کردن: فقط مدل‌های provider های فعال (برای ادمین‌های معمولی)
        is_super = getattr(request.user, 'is_superuser', False) or getattr(request.user, 'is_admin_full', False)
        if not is_super:
            # ✅ برای ادمین‌های معمولی: فقط مدل‌های provider های فعال
            models = [m for m in models if m.provider.is_active]
        
        serializer = AIModelListSerializer(models, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_provider(self, request):
        """
        ✅ Get models by provider slug - all admins can view models of active providers
        اگر سوپر ادمین provider را فعال کند، مدل‌های آن برای همه ادمین‌ها قابل مشاهده است
        """
        provider_slug = request.query_params.get('provider')
        if not provider_slug:
            return Response({"error": "provider parameter required"}, status=400)
        
        # ✅ بررسی اینکه provider فعال است یا نه (برای ادمین‌های معمولی)
        is_super = getattr(request.user, 'is_superuser', False) or getattr(request.user, 'is_admin_full', False)
        if not is_super:
            try:
                provider = AIProvider.objects.get(slug=provider_slug)
                if not provider.is_active:
                    return Response({"error": "این Provider غیرفعال است"}, status=403)
            except AIProvider.DoesNotExist:
                return Response({"error": "Provider یافت نشد"}, status=404)
        
        capability = request.query_params.get('capability')
        models = AIModel.get_models_by_provider(provider_slug, capability)
        serializer = AIModelListSerializer(models, many=True, context={'request': request})
        return Response(serializer.data)


class AdminProviderSettingsViewSet(viewsets.ModelViewSet):
    """
    ✅ ViewSet for Admin Personal Settings
    
    Each admin can manage their own settings
    """
    permission_classes = [IsAuthenticated]
    serializer_class = AdminProviderSettingsSerializer
    
    def get_queryset(self):
        """Only current admin's settings"""
        return AdminProviderSettings.objects.filter(
            admin=self.request.user,
            is_active=True
        ).select_related('provider')
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return AdminProviderSettingsUpdateSerializer
        return AdminProviderSettingsSerializer
    
    def get_serializer_context(self):
        """Add request for computed fields"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def create(self, request, *args, **kwargs):
        """Override create to handle update if already exists"""
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"✅ AI Settings CREATE - Request data: {request.data}")
        
        # Check if setting already exists
        serializer = self.get_serializer(data=request.data)
        
        # ✅ چک کردن validation errors
        if not serializer.is_valid():
            logger.error(f"❌ Validation Error: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        provider_id = serializer.validated_data.get('provider_id')
        if provider_id:
            # بررسی وجود رکورد قبلی
            existing = AdminProviderSettings.objects.filter(
                admin=self.request.user,
                provider_id=provider_id
            ).first()
            
            if existing:
                # اگر وجود داشت، update کن
                logger.info(f"✅ Setting exists - Updating ID {existing.id}")
                update_serializer = self.get_serializer(
                    existing,
                    data=request.data,
                    partial=True
                )
                if not update_serializer.is_valid():
                    logger.error(f"❌ Update Validation Error: {update_serializer.errors}")
                    return Response(update_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                
                self.perform_update(update_serializer)
                # ✅ Return response with AdminProviderSettingsSerializer for consistency
                response_serializer = AdminProviderSettingsSerializer(update_serializer.instance, context=self.get_serializer_context())
                return Response(response_serializer.data, status=status.HTTP_200_OK)
        
        # اگر وجود نداشت، create کن
        self.perform_create(serializer)
        # ✅ Return response with AdminProviderSettingsSerializer for consistency
        response_serializer = AdminProviderSettingsSerializer(serializer.instance, context=self.get_serializer_context())
        headers = self.get_success_headers(response_serializer.data)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    def perform_create(self, serializer):
        """Set admin to current user and provider"""
        # ✅ Get provider from validated data
        provider_id = serializer.validated_data.pop('provider_id', None)
        if provider_id:
            provider = AIProvider.objects.get(pk=provider_id)
            serializer.save(admin=self.request.user, provider=provider)
        else:
            serializer.save(admin=self.request.user)
    
    def perform_update(self, serializer):
        """Update admin provider settings"""
        # ✅ Get provider from validated data if present
        provider_id = serializer.validated_data.pop('provider_id', None)
        if provider_id:
            provider = AIProvider.objects.get(pk=provider_id)
            serializer.save(provider=provider)
        else:
            serializer.save()
    
    def update(self, request, *args, **kwargs):
        """Override update to return AdminProviderSettingsSerializer response"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        # ✅ Return response with AdminProviderSettingsSerializer for consistency
        response_serializer = AdminProviderSettingsSerializer(serializer.instance, context=self.get_serializer_context())
        return Response(response_serializer.data)
    
    def partial_update(self, request, *args, **kwargs):
        """Override partial_update to return AdminProviderSettingsSerializer response"""
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)
    
    def perform_destroy(self, instance):
        """Soft delete"""
        instance.is_active = False
        instance.save()
    
    @action(detail=False, methods=['get'])
    def my_settings(self, request):
        """Get all settings for current admin"""
        settings = self.get_queryset()
        serializer = self.get_serializer(settings, many=True)
        return Response(serializer.data)
