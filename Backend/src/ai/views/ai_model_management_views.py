from rest_framework import status, viewsets
from rest_framework.decorators import action
from django.core.cache import cache

from src.core.responses.response import APIResponse
from src.ai.models import AIProvider, AICapabilityModel
from src.ai.messages.messages import AI_ERRORS
from src.user.access_control import ai_permission
from src.ai.providers.capabilities import get_default_model


class AIModelManagementViewSet(viewsets.ViewSet):
    """Capability-based AI configuration.

    Product rule (2026-02): Admin selects PROVIDER per capability.
    Model selection is not exposed; backend resolves a default model_id.

    Frontend compatibility:
    - POST select-model exists but delegates to select-provider.
    """

    permission_classes = [ai_permission]

    @action(detail=False, methods=['get'], url_path='active-capabilities')
    def active_capabilities(self, request):
        result = {}
        for capability in ['chat', 'content', 'image', 'audio']:
            cm = AICapabilityModel.objects.get_active(capability)
            if not cm:
                result[capability] = {
                    'capability': capability,
                    'is_active': False,
                    'provider_slug': None,
                    'provider_display': None,
                    'model_id': None,
                    'display_name': None,
                }
                continue

            result[capability] = {
                'capability': capability,
                'is_active': True,
                'provider_slug': cm.provider.slug,
                'provider_display': cm.provider.display_name,
                'model_id': cm.model_id,
                'display_name': cm.display_name or cm.model_id,
            }

        return APIResponse.success(message='Active capability models', data=result)

    def list(self, request):
        """
        Stub to prevent 404 if frontend tries to list models.
        Returns active capabilities structure or empty list.
        """
        return self.active_capabilities(request)

    @action(detail=False, methods=['post'], url_path='select-model')
    def select_model(self, request):
        """Legacy endpoint kept for compatibility.

        The request may include model_id/model_name, but we ignore it.
        """
        return self.select_provider(request)

    @action(detail=False, methods=['post'], url_path='select-provider')
    def select_provider(self, request):
        provider_slug = (request.data.get('provider') or '').strip().lower()
        capability = (request.data.get('capability') or '').strip().lower()

        if not provider_slug or not capability:
            return APIResponse.error(
                message='Missing required fields: provider, capability',
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        try:
            provider = AIProvider.objects.get(slug=provider_slug, is_active=True)
        except AIProvider.DoesNotExist:
            return APIResponse.error(
                message=AI_ERRORS.get('provider_not_found_or_inactive', 'Provider not found or inactive').format(
                    provider_name=provider_slug
                ),
                status_code=status.HTTP_404_NOT_FOUND,
            )

        # 1. Try to get default model from provider configuration (DB)
        default_model_id = None
        if provider.capabilities:
            cap_config = provider.capabilities.get(capability)
            if isinstance(cap_config, dict):
                default_model_id = cap_config.get('default_model')

        # 2. Fallback to hardcoded defaults in capabilities.py
        if not default_model_id:
            default_model_id = get_default_model(provider_slug, capability)

        # 3. Fallback to first static model
        if not default_model_id:
            static_models = provider.get_static_models(capability)
            if static_models:
                default_model_id = static_models[0]
            else:
                return APIResponse.error(
                    message=f'No hardcoded default model for provider={provider_slug} capability={capability}',
                    status_code=status.HTTP_400_BAD_REQUEST,
                )

        obj, _ = AICapabilityModel.objects.update_or_create(
            capability=capability,
            provider=provider,
            defaults={
                'model_id': default_model_id,
                'display_name': default_model_id,
                'config': {},
                'sort_order': 0,
                'is_active': True,
            },
        )

        if not obj.is_active:
            obj.is_active = True
            obj.save(update_fields=['is_active', 'updated_at'])

        cache.delete(f'active_capability_model_{capability}')

        return APIResponse.success(
            message='Provider selected successfully',
            data={
                'capability': capability,
                'provider_slug': provider.slug,
                'provider_display': provider.display_name,
                'model_id': obj.model_id,
                'display_name': obj.display_name,
                'is_active': True,
            },
            status_code=status.HTTP_200_OK,
        )
