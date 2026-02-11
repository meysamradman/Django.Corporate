from django.db.models import Count
from src.ai.utils.cache import AICacheManager
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from django_filters.rest_framework import DjangoFilterBackend
from src.ai.models import AIProvider, AdminProviderSettings, AICapabilityModel
from src.ai.serializers.ai_provider_serializer import (
    AIProviderListSerializer,
    AIProviderDetailSerializer,
    AIProviderCreateUpdateSerializer,
    AdminProviderSettingsSerializer,
    AdminProviderSettingsUpdateSerializer,
)
from src.ai.messages.messages import AI_ERRORS, AI_SUCCESS
from src.user.access_control import ai_permission, PermissionRequiredMixin
from src.user.access_control.definitions import PermissionValidator
from src.core.responses.response import APIResponse

class AIProviderViewSet(PermissionRequiredMixin, viewsets.ModelViewSet):
    permission_classes = [ai_permission]
    
    permission_map = {
        'list': 'ai.manage',
        'retrieve': 'ai.manage',
        'create': 'ai.manage',
        'update': 'ai.manage',
        'partial_update': 'ai.manage',
        'destroy': 'ai.manage',
        'activate': 'ai.manage',
        'deactivate': 'ai.manage',
        'available_providers': ['ai.view', 'ai.manage'],  # Check if user has ai.view OR ai.manage
        'stats': 'ai.manage',
    }
    permission_denied_message = AI_ERRORS['settings_not_authorized']
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'display_name', 'description']
    ordering_fields = ['name', 'sort_order', 'total_requests', 'created_at']
    ordering = ['sort_order', 'name']
    
    def get_queryset(self):
        is_super = getattr(self.request.user, 'is_superuser', False) or getattr(self.request.user, 'is_admin_full', False)
        
        if is_super:
            return AIProvider.objects.all()
        else:
            return AIProvider.objects.filter(is_active=True)
    
    def get_serializer_class(self):
        if self.action == 'list':
            return AIProviderListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return AIProviderCreateUpdateSerializer
        return AIProviderDetailSerializer
    
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    
    def perform_create(self, serializer):
        serializer.save()
        AIProvider.clear_all_cache()
    
    def perform_update(self, serializer):
        serializer.save()
        AIProvider.clear_all_cache()
    
    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save()
        AIProvider.clear_all_cache()
    
    @action(detail=True, methods=['post'], url_path='activate')
    def activate_provider(self, request, pk=None, id=None):
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
        from src.ai.providers.capabilities import supports_feature
        
        is_super = getattr(request.user, 'is_superuser', False) or getattr(request.user, 'is_admin_full', False)
        capability = request.query_params.get('capability')
        
        providers = AIProvider.objects.filter(is_active=True).order_by('sort_order')
        serializer = AIProviderListSerializer(providers, many=True, context={'request': request})
        
        available = []
        for provider_data in serializer.data:
            provider_slug = provider_data['slug']
            
            # اگر capability مشخص شده، فقط Providerهایی که آن را support می‌کنند
            if capability and not supports_feature(provider_slug, capability):
                continue
            
            has_access = self._check_provider_access(request.user, provider_slug, is_super)
            
            provider_info = {
                **provider_data,
                'has_access': has_access,
                'provider_name': provider_slug,
                'can_generate': has_access,  # فقط اگر دسترسی داشته باشد می‌تواند generate کند
            }
            available.append(provider_info)
        
        return APIResponse.success(
            message=AI_SUCCESS["providers_list_retrieved"],
            data=available,
            status_code=status.HTTP_200_OK
        )
    
    def _check_provider_access(self, user, provider_slug: str, is_super: bool) -> bool:
        try:
            provider = AIProvider.objects.get(slug=provider_slug, is_active=True)
        except AIProvider.DoesNotExist:
            return False
        
        if is_super and provider.shared_api_key:
            return True
        
        personal_settings = AdminProviderSettings.objects.filter(
            admin=user,
            provider=provider,
            is_active=True,
            personal_api_key__isnull=False
        ).exclude(personal_api_key='').first()
        
        if personal_settings:
            return True
        
        if provider.allow_shared_for_normal_admins and provider.shared_api_key:
            return True
        
        return False
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        providers = self.get_queryset()
        return APIResponse.success(
            message=AI_SUCCESS.get('statistics_retrieved', 'Statistics retrieved successfully'),
            data={
                'total_providers': providers.count(),
                'total_models': AICapabilityModel.objects.filter(provider__is_active=True, is_active=True).count(),
                'total_requests': sum(p.total_requests for p in providers),
            },
            status_code=status.HTTP_200_OK
        )

class AdminProviderSettingsViewSet(PermissionRequiredMixin, viewsets.ModelViewSet):
    permission_classes = [ai_permission]
    serializer_class = AdminProviderSettingsSerializer
    
    permission_map = {
        'list': 'ai.settings.personal.manage',
        'retrieve': 'ai.settings.personal.manage',
        'create': 'ai.settings.personal.manage',
        'update': 'ai.settings.personal.manage',
        'partial_update': 'ai.settings.personal.manage',
        'destroy': 'ai.settings.personal.manage',
        'my_settings': 'ai.settings.personal.manage',
    }
    permission_denied_message = AI_ERRORS['settings_not_authorized']
    
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
