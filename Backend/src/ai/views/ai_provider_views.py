from django.db.models import Q, Count
from src.ai.utils.cache import AICacheManager
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from django_filters.rest_framework import DjangoFilterBackend
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
from src.user.access_control import ai_permission, ai_any_permission, PermissionValidator, RequirePermission
from src.core.responses.response import APIResponse


class AIProviderViewSet(viewsets.ModelViewSet):
    permission_classes = [ai_any_permission]  # هر نوع دسترسی AI
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'display_name', 'description']
    ordering_fields = ['name', 'sort_order', 'total_requests', 'created_at']
    ordering = ['sort_order', 'name']
    
    def get_queryset(self):
        is_super = getattr(self.request.user, 'is_superuser', False) or getattr(self.request.user, 'is_admin_full', False)
        
        if is_super:
            return AIProvider.objects.all().annotate(
                models_count=Count('models', filter=Q(models__is_active=True))
            )
        else:
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
        return super().list(request, *args, **kwargs)
    
    def retrieve(self, request, *args, **kwargs):
        if not PermissionValidator.has_permission(request.user, 'ai.view'):
            raise PermissionDenied(AI_ERRORS['settings_not_authorized'])
        return super().retrieve(request, *args, **kwargs)
    
    def perform_create(self, serializer):
        if not PermissionValidator.has_permission(self.request.user, 'ai.manage'):
            raise PermissionDenied(AI_ERRORS['settings_not_authorized'])
        serializer.save()
        AIProvider.clear_all_cache()
    
    def perform_update(self, serializer):
        if not PermissionValidator.has_permission(self.request.user, 'ai.manage'):
            raise PermissionDenied(AI_ERRORS['settings_not_authorized'])
        serializer.save()
        AIProvider.clear_all_cache()
    
    def perform_destroy(self, instance):
        if not PermissionValidator.has_permission(self.request.user, 'ai.manage'):
            raise PermissionDenied(AI_ERRORS['settings_not_authorized'])
        
        instance.is_active = False
        instance.save()
        AIProvider.clear_all_cache()
    
    @action(detail=True, methods=['post'], url_path='activate')
    def activate_provider(self, request, pk=None, id=None):
        if not PermissionValidator.has_permission(request.user, 'ai.manage'):
            raise PermissionDenied(AI_ERRORS['settings_not_authorized'])
        
        provider = self.get_object()
        provider.is_active = True
        provider.save(update_fields=['is_active', 'updated_at'])
        
        AIProvider.clear_all_cache()
        
        serializer = self.get_serializer(provider)
        return APIResponse.success(
            message=AI_SUCCESS['provider_activated'],
            data=serializer.data,
            status_code=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['post'], url_path='deactivate')
    def deactivate_provider(self, request, pk=None, id=None):
        if not PermissionValidator.has_permission(request.user, 'ai.manage'):
            raise PermissionDenied(AI_ERRORS['settings_not_authorized'])
        
        provider = self.get_object()
        provider.is_active = False
        provider.save(update_fields=['is_active', 'updated_at'])
        
        AIProvider.clear_all_cache()
        
        serializer = self.get_serializer(provider)
        return APIResponse.success(
            message=AI_SUCCESS['provider_deactivated'],
            data=serializer.data,
            status_code=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['get'], url_path='available')
    def available_providers(self, request):
        has_view_permission = PermissionValidator.has_permission(request.user, 'ai.view')
        has_manage_permission = PermissionValidator.has_permission(request.user, 'ai.manage')
        
        if not (has_view_permission or has_manage_permission):
            raise PermissionDenied(AI_ERRORS['settings_not_authorized'])
        
        # اگر capability داده شده باشد، از ProviderAvailabilityManager استفاده می‌کنیم
        capability = request.query_params.get('capability')
        if capability:
            try:
                from src.ai.providers.capabilities import ProviderAvailabilityManager
                providers = ProviderAvailabilityManager.get_available_providers(capability, include_api_based=True)
                return APIResponse.success(
                    message=AI_SUCCESS["providers_list_retrieved"],
                    data=providers,
                    status_code=status.HTTP_200_OK
                )
            except Exception as e:
                # در صورت خطا، به روش قدیمی برمی‌گردیم
                pass
        
        # روش قدیمی: فقط providerهایی که API key دارند
        providers = self.get_queryset()
        serializer = AIProviderListSerializer(providers, many=True)
        
        available = []
        for p in serializer.data:
            if p.get('has_shared_api') or p.get('allow_personal_keys'):
                available.append(p)
        
        return APIResponse.success(
            message=AI_SUCCESS["providers_list_retrieved"],
            data=available,
            status_code=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        if not PermissionValidator.has_permission(request.user, 'ai.view'):
            raise PermissionDenied(AI_ERRORS['settings_not_authorized'])
        providers = self.get_queryset()
        return APIResponse.success(
            message=AI_SUCCESS.get('statistics_retrieved', 'Statistics retrieved successfully'),
            data={
                'total_providers': providers.count(),
                'total_models': AIModel.objects.filter(provider__is_active=True, is_active=True).count(),
                'total_requests': sum(p.total_requests for p in providers),
            },
            status_code=status.HTTP_200_OK
        )


class AIModelViewSet(viewsets.ModelViewSet):
    permission_classes = [ai_any_permission]  # هر نوع دسترسی AI
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['provider', 'is_active']
    search_fields = ['name', 'display_name', 'description', 'model_id']
    ordering_fields = ['name', 'sort_order', 'total_requests', 'created_at']
    ordering = ['provider__sort_order', 'sort_order', 'name']
    
    def get_queryset(self):
        queryset = AIModel.objects.filter(
            provider__is_active=True
        ).select_related('provider')
        
        capability = self.request.query_params.get('capability')
        if capability:
            queryset = [m for m in queryset if capability in m.capabilities]
        
        return queryset
    
    def get_serializer_class(self):
        if self.action == 'list':
            return AIModelListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return AIModelCreateUpdateSerializer
        return AIModelDetailSerializer
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)
    
    def perform_create(self, serializer):
        if not PermissionValidator.has_permission(self.request.user, 'ai.manage'):
            raise PermissionDenied(AI_ERRORS['settings_not_authorized'])
        serializer.save()
        AICacheManager.invalidate_models()
    
    def perform_update(self, serializer):
        if not PermissionValidator.has_permission(self.request.user, 'ai.manage'):
            raise PermissionDenied(AI_ERRORS['settings_not_authorized'])
        serializer.save()
        AICacheManager.invalidate_models()
    
    @action(detail=False, methods=['get'])
    def by_capability(self, request):
        capability = request.query_params.get('capability')
        if not capability:
            return APIResponse.error(
                message=AI_ERRORS['validation_error'],
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        include_inactive = request.query_params.get('include_inactive', 'true').lower() == 'true'
        models = AIModel.get_models_by_capability(capability, include_inactive=include_inactive)
        
        is_super = getattr(request.user, 'is_superuser', False) or getattr(request.user, 'is_admin_full', False)
        if not is_super:
            models = [m for m in models if m.provider.is_active]
        
        serializer = AIModelListSerializer(models, many=True, context={'request': request})
        return APIResponse.success(
            message=AI_SUCCESS.get('models_list_retrieved', 'Models retrieved successfully'),
            data=serializer.data,
            status_code=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['get'])
    def by_provider(self, request):
        provider_slug = request.query_params.get('provider')
        if not provider_slug:
            return APIResponse.error(
                message=AI_ERRORS['validation_error'],
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        is_super = getattr(request.user, 'is_superuser', False) or getattr(request.user, 'is_admin_full', False)
        if not is_super:
            try:
                provider = AIProvider.objects.get(slug=provider_slug)
                if not provider.is_active:
                    return APIResponse.error(
                        message=AI_ERRORS['provider_not_active'],
                        status_code=status.HTTP_403_FORBIDDEN
                    )
            except AIProvider.DoesNotExist:
                return APIResponse.error(
                    message=AI_ERRORS['provider_not_found'],
                    status_code=status.HTTP_404_NOT_FOUND
                )
        
        capability = request.query_params.get('capability')
        models = AIModel.get_models_by_provider(provider_slug, capability)
        serializer = AIModelListSerializer(models, many=True, context={'request': request})
        return APIResponse.success(
            message=AI_SUCCESS.get('models_list_retrieved', 'Models retrieved successfully'),
            data=serializer.data,
            status_code=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['get'])
    def active_model(self, request):
        """
        Get the single active model for a provider+capability combination.
        Required params: provider (slug), capability
        """
        provider_slug = request.query_params.get('provider')
        capability = request.query_params.get('capability')
        
        if not provider_slug or not capability:
            return APIResponse.error(
                message=AI_ERRORS['validation_error'],
                errors={'detail': 'Both provider and capability are required'},
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        # Get active model
        active_model = AIModel.objects.get_active_model(provider_slug, capability)
        
        if not active_model:
            return APIResponse.error(
                message=AI_ERRORS.get('no_active_model', 'No active model found for this provider+capability'),
                status_code=status.HTTP_404_NOT_FOUND
            )
        
        serializer = AIModelDetailSerializer(active_model, context={'request': request})
        return APIResponse.success(
            message=AI_SUCCESS.get('model_retrieved', 'Active model retrieved successfully'),
            data=serializer.data,
            status_code=status.HTTP_200_OK
        )


class AdminProviderSettingsViewSet(viewsets.ModelViewSet):
    permission_classes = [ai_any_permission]  # هر نوع دسترسی AI
    serializer_class = AdminProviderSettingsSerializer
    
    def get_queryset(self):
        return AdminProviderSettings.objects.filter(
            admin=self.request.user,
            is_active=True
        ).select_related('provider')
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return AdminProviderSettingsUpdateSerializer
        return AdminProviderSettingsSerializer
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        
        if not serializer.is_valid():
            return APIResponse.error(
                message=AI_ERRORS['validation_error'],
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        provider_id = serializer.validated_data.get('provider_id')
        if provider_id:
            existing = AdminProviderSettings.objects.filter(
                admin=self.request.user,
                provider_id=provider_id
            ).first()
            
            if existing:
                update_serializer = self.get_serializer(
                    existing,
                    data=request.data,
                    partial=True
                )
                if not update_serializer.is_valid():
                    return APIResponse.error(
                        message=AI_ERRORS['validation_error'],
                        errors=update_serializer.errors,
                        status_code=status.HTTP_400_BAD_REQUEST
                    )
                
                self.perform_update(update_serializer)
                response_serializer = AdminProviderSettingsSerializer(update_serializer.instance, context=self.get_serializer_context())
                return APIResponse.success(
                    message=AI_SUCCESS['settings_updated'],
                    data=response_serializer.data,
                    status_code=status.HTTP_200_OK
                )
        
        self.perform_create(serializer)
        response_serializer = AdminProviderSettingsSerializer(serializer.instance, context=self.get_serializer_context())
        return APIResponse.success(
            message=AI_SUCCESS['settings_created'],
            data=response_serializer.data,
            status_code=status.HTTP_201_CREATED
        )
    
    def perform_create(self, serializer):
        provider_id = serializer.validated_data.pop('provider_id', None)
        if provider_id:
            provider = AIProvider.objects.get(pk=provider_id)
            serializer.save(admin=self.request.user, provider=provider)
        else:
            serializer.save(admin=self.request.user)
    
    def perform_update(self, serializer):
        provider_id = serializer.validated_data.pop('provider_id', None)
        if provider_id:
            provider = AIProvider.objects.get(pk=provider_id)
            serializer.save(provider=provider)
        else:
            serializer.save()
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        response_serializer = AdminProviderSettingsSerializer(serializer.instance, context=self.get_serializer_context())
        return APIResponse.success(
            message=AI_SUCCESS['settings_updated'],
            data=response_serializer.data,
            status_code=status.HTTP_200_OK
        )
    
    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)
    
    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save()
    
    @action(detail=False, methods=['get'])
    def my_settings(self, request):
        settings = self.get_queryset()
        serializer = self.get_serializer(settings, many=True)
        return APIResponse.success(
            message=AI_SUCCESS['settings_list_retrieved'],
            data=serializer.data,
            status_code=status.HTTP_200_OK
        )
