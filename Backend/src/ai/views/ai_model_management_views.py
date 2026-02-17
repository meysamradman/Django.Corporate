from rest_framework import status, viewsets
from rest_framework.decorators import action
import importlib
import inspect

from src.core.responses.response import APIResponse
from src.core.cache import CacheService
from src.ai.models import AIProvider, AICapabilityModel
from src.ai.messages.messages import AI_ERRORS, AI_SUCCESS
from src.user.access_control import ai_permission, PermissionRequiredMixin
from src.ai.providers.capabilities import get_default_model, get_available_models as get_capability_models, get_provider_capabilities, supports_feature
from src.ai.utils.cache import AICacheKeys


class AIModelManagementViewSet(PermissionRequiredMixin, viewsets.ViewSet):
    """Capability-based AI configuration.

    Product rule (2026-02): Admin selects PROVIDER per capability.
    Model selection is not exposed; backend resolves a default model_id.

    Frontend compatibility:
    - POST select-model exists but delegates to select-provider.
    """

    permission_classes = [ai_permission]
    permission_map = {
        'list': 'ai.models.manage',
        'active_capabilities': 'ai.models.manage',
        'browse_models': 'ai.models.manage',
        'select_model': 'ai.models.manage',
        'select_provider': 'ai.models.manage',
    }
    permission_denied_message = AI_ERRORS.get('settings_not_authorized')

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

        if provider_slug:
            if not supports_feature(provider_slug, capability):
                return APIResponse.success(data=[])

            # Product rule: capabilities.py is the primary source of selectable models.
            static_models = get_capability_models(provider_slug, capability) or []
            if static_models == 'dynamic':
                static_models = []
            if static_models:
                static_data = [
                    {
                        "id": model_id,
                        "name": model_id,
                        "provider_slug": provider_slug,
                        "is_active": True,
                    }
                    for model_id in static_models
                    if not provider_filter or provider_filter.lower() in model_id.lower()
                ]
                return APIResponse.success(data=static_data)

            # Unified dynamic model browsing for all providers.
            try:
                provider = AIProvider.objects.get(slug=provider_slug, is_active=True)
            except AIProvider.DoesNotExist:
                return APIResponse.success(data=[])

            provider_caps = get_provider_capabilities(provider_slug)
            if provider_caps.get('has_dynamic_models', False):
                dynamic = self._get_dynamic_models(
                    provider=provider,
                    capability=capability,
                    task_filter=task_filter,
                    provider_filter=provider_filter,
                )
                if dynamic is not None:
                    return APIResponse.success(data=dynamic)

        # Fallback: Return static models if available for the provider
        if provider_slug:
            try:
                static_models = get_capability_models(provider_slug, capability) or []
                if static_models == 'dynamic':
                    static_models = []
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

    def _get_provider_api_key(self, provider: AIProvider) -> str | None:
        try:
            if provider.shared_api_key:
                return provider.get_shared_api_key()
        except Exception:
            pass
        return None

    def _get_dynamic_models(self, provider: AIProvider, capability: str, task_filter: str | None, provider_filter: str | None):
        if not provider.provider_class:
            return None

        try:
            module_path, class_name = provider.provider_class.rsplit('.', 1)
            module = importlib.import_module(module_path)
            provider_cls = getattr(module, class_name)
        except Exception:
            return None

        list_fn = getattr(provider_cls, 'get_available_models', None)
        if not callable(list_fn):
            return None

        kwargs = {}
        try:
            sig = inspect.signature(list_fn)
            params = sig.parameters
        except Exception:
            params = {}

        api_key = self._get_provider_api_key(provider)
        if 'api_key' in params and api_key:
            kwargs['api_key'] = api_key
        if 'capability' in params:
            kwargs['capability'] = capability
        if 'task_filter' in params and task_filter:
            kwargs['task_filter'] = task_filter
        if 'provider_filter' in params and provider_filter:
            kwargs['provider_filter'] = provider_filter
        if 'use_cache' in params:
            kwargs['use_cache'] = True

        try:
            models = list_fn(**kwargs)
        except Exception:
            return None

        if not isinstance(models, list):
            return []

        normalized = []
        for item in models:
            if isinstance(item, dict):
                model_id = item.get('id')
                if not model_id:
                    continue
                model_name = item.get('name', model_id)
            else:
                model_id = str(item)
                model_name = model_id

            if provider_filter and provider_filter.lower() not in model_id.lower():
                continue

            normalized.append({
                "id": model_id,
                "name": model_name,
                "provider_slug": provider.slug,
                "is_active": True,
            })

        return normalized

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

        if not default_model_id and requested_model_id and provider.has_dynamic_models(capability):
            default_model_id = requested_model_id

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

        CacheService.delete(AICacheKeys.active_capability_model(capability))

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
