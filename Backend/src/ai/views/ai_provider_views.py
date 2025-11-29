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
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'display_name', 'description']
    ordering_fields = ['name', 'sort_order', 'total_requests', 'created_at']
    ordering = ['sort_order', 'name']
    
    def get_queryset(self):
        is_super = getattr(self.request.user, 'is_superuser', False) or getattr(self.request.user, 'is_admin_full', False)
        
        if is_super:
            # Super admin: all providers
            return AIProvider.objects.all().annotate(
                models_count=Count('models', filter=Q(models__is_active=True))
            )
        else:
            # Regular admin: only active providers
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
        # If super admin, see all providers (active and inactive)
        is_super = getattr(request.user, 'is_superuser', False) or getattr(request.user, 'is_admin_full', False)
        if is_super:
            return super().list(request, *args, **kwargs)
        
        return super().list(request, *args, **kwargs)
    
    def retrieve(self, request, *args, **kwargs):
        if not PermissionValidator.has_permission(request.user, 'ai.view'):
            raise PermissionDenied(AI_ERRORS.get('settings_not_authorized', 'شما دسترسی مشاهده Provider را ندارید'))
        return super().retrieve(request, *args, **kwargs)
    
    def perform_create(self, serializer):
        if not PermissionValidator.has_permission(self.request.user, 'ai.manage'):
            raise PermissionDenied(AI_ERRORS.get('settings_not_authorized', 'فقط سوپر ادمین می‌تواند Provider جدید اضافه کند'))
        serializer.save()
        # Clear cache
        AIProvider.clear_all_cache()
    
    def perform_update(self, serializer):
        if not PermissionValidator.has_permission(self.request.user, 'ai.manage'):
            raise PermissionDenied(AI_ERRORS.get('settings_not_authorized', 'فقط سوپر ادمین می‌تواند Provider را ویرایش کند'))
        serializer.save()
        # Clear cache
        AIProvider.clear_all_cache()
    
    def perform_destroy(self, instance):
        if not PermissionValidator.has_permission(self.request.user, 'ai.manage'):
            raise PermissionDenied(AI_ERRORS.get('settings_not_authorized', 'فقط سوپر ادمین می‌تواند Provider را حذف کند'))
        
        instance.is_active = False
        instance.save()
        # Clear cache
        AIProvider.clear_all_cache()
    
    @action(detail=True, methods=['post'], url_path='activate')
    def activate_provider(self, request, pk=None, id=None):
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
        # Check permission: ai.view or ai.manage
        has_view_permission = PermissionValidator.has_permission(request.user, 'ai.view')
        has_manage_permission = PermissionValidator.has_permission(request.user, 'ai.manage')
        
        if not (has_view_permission or has_manage_permission):
            raise PermissionDenied(AI_ERRORS.get('settings_not_authorized', 'شما دسترسی مشاهده Provider ها را ندارید'))
        
        # Use get_queryset which does filtering itself
        providers = self.get_queryset()
        
        # ✅ Serialize providers
        serializer = AIProviderListSerializer(providers, many=True)
        
        # Filter providers that have API key (shared or personal)
        available = []
        for p in serializer.data:
            # If has shared API key or allow_personal_keys, add it
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
            raise PermissionDenied(AI_ERRORS.get('settings_not_authorized', 'شما دسترسی مشاهده آمار را ندارید'))
        providers = self.get_queryset()
        return Response({
            'total_providers': providers.count(),
            'total_models': AIModel.objects.filter(provider__is_active=True, is_active=True).count(),
            'total_requests': sum(p.total_requests for p in providers),
        })


class AIModelViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['provider', 'is_active']
    search_fields = ['name', 'display_name', 'description', 'model_id']
    ordering_fields = ['name', 'sort_order', 'total_requests', 'created_at']
    ordering = ['provider__sort_order', 'sort_order', 'name']
    
    def get_queryset(self):
        # For admin panel, show all models (active and inactive)
        # Only provider needs to be active
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
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def list(self, request, *args, **kwargs):

        return super().list(request, *args, **kwargs)
    
    def retrieve(self, request, *args, **kwargs):

        return super().retrieve(request, *args, **kwargs)
    
    def perform_create(self, serializer):
        if not PermissionValidator.has_permission(self.request.user, 'ai.manage'):
            raise PermissionDenied(AI_ERRORS.get('settings_not_authorized', 'فقط سوپر ادمین می‌تواند Model جدید اضافه کند'))
        serializer.save()
        # Clear cache
        cache.delete_pattern("ai_models_*")
    
    def perform_update(self, serializer):
        if not PermissionValidator.has_permission(self.request.user, 'ai.manage'):
            raise PermissionDenied(AI_ERRORS.get('settings_not_authorized', 'فقط سوپر ادمین می‌تواند Model را ویرایش کند'))
        serializer.save()
        # Clear cache
        cache.delete_pattern("ai_models_*")
    
    @action(detail=False, methods=['get'])
    def by_capability(self, request):
        capability = request.query_params.get('capability')
        if not capability:
            return Response({"error": "capability parameter required"}, status=400)
        
        include_inactive = request.query_params.get('include_inactive', 'true').lower() == 'true'
        models = AIModel.get_models_by_capability(capability, include_inactive=include_inactive)
        
        is_super = getattr(request.user, 'is_superuser', False) or getattr(request.user, 'is_admin_full', False)
        if not is_super:

            models = [m for m in models if m.provider.is_active]
        
        serializer = AIModelListSerializer(models, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_provider(self, request):
        provider_slug = request.query_params.get('provider')
        if not provider_slug:
            return Response({"error": "provider parameter required"}, status=400)
        

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
    permission_classes = [IsAuthenticated]
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
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"✅ AI Settings CREATE - Request data: {request.data}")
        
        serializer = self.get_serializer(data=request.data)
        
        if not serializer.is_valid():
            logger.error(f"❌ Validation Error: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        provider_id = serializer.validated_data.get('provider_id')
        if provider_id:

            existing = AdminProviderSettings.objects.filter(
                admin=self.request.user,
                provider_id=provider_id
            ).first()
            
            if existing:

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
                response_serializer = AdminProviderSettingsSerializer(update_serializer.instance, context=self.get_serializer_context())
                return Response(response_serializer.data, status=status.HTTP_200_OK)
        
        self.perform_create(serializer)
        response_serializer = AdminProviderSettingsSerializer(serializer.instance, context=self.get_serializer_context())
        headers = self.get_success_headers(response_serializer.data)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
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
        return Response(response_serializer.data)
    
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
        return Response(serializer.data)
