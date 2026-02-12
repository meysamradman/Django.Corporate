from rest_framework import status, viewsets
from rest_framework.decorators import action
from django.core.cache import cache

from src.core.responses.response import APIResponse
from src.ai.models import AIProvider, AICapabilityModel
from src.ai.messages.messages import AI_ERRORS, AI_SUCCESS
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

        return APIResponse.success(
            message=AI_SUCCESS.get("active_capabilities_retrieved"),
            data=result,
        )


    @action(detail=False, methods=['get'], url_path='browse-models')
    def browse_models(self, request):
        """
        Dynamically fetch available models from providers that support listings (e.g. OpenRouter/HuggingFace).
        Also returns static hardcoded models for standard providers if requested.
        """
        provider_slug = request.query_params.get('provider')
        capability = request.query_params.get('capability')
        task_filter = request.query_params.get('task_filter')
        provider_filter = request.query_params.get('provider_filter')

        if not capability:
            return APIResponse.error(
                message=AI_ERRORS.get("capability_required"),
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        if provider_slug == 'openrouter':
            from src.ai.providers.openrouter import OpenRouterProvider
            try:
                provider_obj = AIProvider.objects.filter(slug='openrouter').first()
                api_key = None
                if provider_obj and provider_obj.api_key:
                    api_key = provider_obj.api_key

                client = OpenRouterProvider(api_key=api_key or None)
                # Defer to provider implementation if available
                if hasattr(client, 'list_models'):
                    raw = client.list_models(capability=capability)
                else:
                    import httpx
                    url = "https://openrouter.ai/api/v1/models"
                    resp = httpx.get(url, timeout=10.0)
                    raw = resp.json().get('data', []) if resp.status_code == 200 else []

                filtered = []
                for m in raw:
                    model_id = m.get('id') if isinstance(m, dict) else str(m)
                    name = m.get('name', model_id) if isinstance(m, dict) else model_id
                    if provider_filter and provider_filter.lower() not in model_id.lower():
                        continue
                    filtered.append({
                        "id": model_id,
                        "name": name,
                        "provider_slug": "openrouter",
                        "is_active": True,
                    })

                return APIResponse.success(data=filtered)
            except Exception:
                pass

        # Fallback: Return static models if available for the provider
        if provider_slug:
            try:
                pv = AIProvider.objects.get(slug=provider_slug)
                static_models = pv.get_static_models(capability)
                if static_models:
                    data = [{
                        "id": m,
                        "name": m,
                        "provider_slug": provider_slug,
                        "is_active": True,
                    } for m in static_models]
                    return APIResponse.success(data=data)
            except Exception:
                pass

        return APIResponse.success(data=[])

    def list(self, request):
        return self.active_capabilities(request)

    @action(detail=False, methods=['post'], url_path='select-model')
    def select_model(self, request):
        return self.select_provider(request)

    @action(detail=False, methods=['post'], url_path='select-provider')
    def select_provider(self, request):
        provider_slug = (request.data.get('provider') or '').strip().lower()
        capability = (request.data.get('capability') or '').strip().lower()
        requested_model_id = (request.data.get('model_id') or '').strip()

        if not provider_slug or not capability:
            return APIResponse.error(
                message=AI_ERRORS.get("validation_error"),
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        try:
            provider = AIProvider.objects.get(slug=provider_slug, is_active=True)
        except AIProvider.DoesNotExist:
            return APIResponse.error(
                message=AI_ERRORS.get('provider_not_found_or_inactive').format(provider_name=provider_slug),
                status_code=status.HTTP_404_NOT_FOUND,
            )

        default_model_id = None

        if provider.capabilities and capability in provider.capabilities:
            cap_config = provider.capabilities.get(capability)
            if isinstance(cap_config, dict):
                allowed = cap_config.get('models', [])
                if requested_model_id and requested_model_id in allowed:
                    default_model_id = requested_model_id
                if not default_model_id:
                    default_model_id = cap_config.get('default_model')

        if not default_model_id:
            if requested_model_id:
                try:
                    static_list = provider.get_static_models(capability)
                    if requested_model_id in static_list:
                        default_model_id = requested_model_id
                except Exception:
                    pass

        if not default_model_id:
            default_model_id = get_default_model(provider_slug, capability)

        if not default_model_id:
            try:
                static_models = provider.get_static_models(capability)
                if static_models:
                    default_model_id = static_models[0]
            except Exception:
                pass

        if not default_model_id:
            error_msg = AI_ERRORS.get("no_active_model")
            return APIResponse.error(
                message=error_msg,
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

        cache.delete(f'active_capability_model_{capability}')

        return APIResponse.success(
            message=AI_SUCCESS.get("provider_selected"),
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
