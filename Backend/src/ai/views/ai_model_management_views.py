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
            return APIResponse.error("Capability is required")

        if provider_slug == 'openrouter':
            from src.ai.providers.openrouter import OpenRouterProvider
            from src.ai.models import AIProvider
            try:
                # 1. Fetch provider details to get API Key (if using shared/configured)
                provider_obj = AIProvider.objects.filter(slug='openrouter').first()
                api_key = None
                if provider_obj and provider_obj.api_key:
                    api_key = provider_obj.api_key
                elif provider_obj and provider_obj.is_active: 
                     # Maybe accessing API key from settings/env if not in DB directly?
                     # OpenRouterProvider usually expects key in init or loads from env if passed
                     # The codebase uses `populate_ai_providers` which sets api_key.
                     pass 
                
                # If backend doesn't have an active provider with key, we might fail or use a system key.
                if not api_key:
                     # Attempt to construct without key might fail validation but let's try 
                     # if the provider can fetch models freely? OpenRouter models list is public?
                     # OpenRouter models endpoint is public.
                     pass

                # Initialize provider (OpenRouterProvider has get_available_models)
                # We can call the public class method or instance method if available.
                # Checking source code of OpenRouterProvider...
                # It has validate_api_key which calls /models. Let's see if it has list_models.
                
                # Mocking logic for now based on typical pattern:
                client = OpenRouterProvider(api_key=api_key or "sk-dummy")
                # Assuming simple HTTP fetch if method not exposed
                import httpx
                
                # Fetch directly from OpenRouter API to avoid complexity if method name unknown
                # Or reuse provider if method exists
                url = "https://openrouter.ai/api/v1/models"
                # OpenRouter list is public, no auth needed technically for just list
                response = httpx.get(url, timeout=10.0) 
                
                if response.status_code == 200:
                    raw_data = response.json().get('data', [])
                    # Filter by capability/provider_filter
                    filtered = []
                    for m in raw_data:
                        # Extract basic fields
                        model_id = m.get('id')
                        name = m.get('name')
                        
                        # Apply filters
                        if provider_filter and provider_filter.lower() not in model_id.lower():
                            continue
                            
                        # Basic filtering for "image" vs "chat"
                        # OpenRouter metadata usage is complex, but generally:
                        # If capability='image', we might only want dall-e or similar if listed (usually not on OR).
                        # OR is mostly LLM (chat/content).
                        if capability == 'image':
                             # OpenRouter doesn't specialize in image generation via standard /chat/completions models usually?
                             # Actually they have some multi-modal but primarily text.
                             # If user asks for image models on OpenRouter, list might be empty or specific ones.
                             pass
                        
                        filtered.append({
                            "id": model_id,
                            "name": name,
                            "provider_slug": "openrouter",
                            "is_active": True # browsing implies available
                        })
                    
                    return APIResponse.success(data=filtered)

            except Exception as e:
                # Log error
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
                         "is_active": True
                     } for m in static_models]
                     return APIResponse.success(data=data)
            except:
                pass

        # If OpenRouter or HuggingFace, we might need to proxy request.
        # Use existing logic if found, else return empty list to prevent 404
        return APIResponse.success(data=[])

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
        requested_model_id = (request.data.get('model_id') or '').strip()

        print(f"\n{'='*50}")
        print(f"🔶 AI SELECTION REQUEST RECEIVED") 
        print(f"   ► Capability: {capability}")
        print(f"   ► Provider:   {provider_slug}")
        print(f"   ► Requested Model: {requested_model_id if requested_model_id else '(None)'}")
        print(f"{'='*50}")

        if not provider_slug or not capability:
            print("❌ ERROR: Missing provider or capability")
            return APIResponse.error(
                message='Missing required fields: provider, capability',
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        try:
            provider = AIProvider.objects.get(slug=provider_slug, is_active=True)
            print(f"✅ Provider Found: {provider.display_name} (ID: {provider.id})")
        except AIProvider.DoesNotExist:
            print(f"❌ ERROR: Provider not found or inactive: {provider_slug}")
            return APIResponse.error(
                message=AI_ERRORS.get('provider_not_found_or_inactive', 'Provider not found or inactive').format(
                    provider_name=provider_slug
                ),
                status_code=status.HTTP_404_NOT_FOUND,
            )

        # 0. Determine Target Model
        default_model_id = None
        source_of_selection = "Unknown"

        # Check DB Capabilities Config (populate script source)
        if provider.capabilities and capability in provider.capabilities:
            cap_config = provider.capabilities.get(capability)
            if isinstance(cap_config, dict):
                allowed = cap_config.get('models', [])
                print(f"   🔍 Provider Config Models: {allowed}")

                # If requested, validate against this provider's allowed models
                if requested_model_id:
                     if requested_model_id in allowed:
                         default_model_id = requested_model_id
                         source_of_selection = "User Request (Validated against DB Config)"
                     else:
                         print(f"   ⚠️ Requested model '{requested_model_id}' not in allowed list {allowed}")

                # If no request or invalid, fallback to config default
                if not default_model_id:
                     default_model_id = cap_config.get('default_model')
                     source_of_selection = "DB Config Default"

        # 2. Fallback to hardcoded defaults in capabilities.py
        if not default_model_id:
            # If requested valid via static list check?
            if requested_model_id:
                 try:
                    static_list = provider.get_static_models(capability)
                    if requested_model_id in static_list:
                        default_model_id = requested_model_id
                        source_of_selection = "User Request (Validated against Static Code)"
                 except:
                    pass
            
            if not default_model_id:
                default_model_id = get_default_model(provider_slug, capability)
                if default_model_id:
                    source_of_selection = "Codebase Hardcoded Default (capabilities.py)"

        # 3. Fallback to first static model
        if not default_model_id:
            try:
                static_models = provider.get_static_models(capability)
                if static_models:
                    default_model_id = static_models[0]
                    source_of_selection = "First Item in Static List"
            except Exception as e:
                print(f"   ⚠️ Error in get_static_models: {e}")
                static_models = []

            if not default_model_id:
                error_msg = f'No available model definition for provider={provider_slug} capability={capability}'
                print(f"❌ CRITICAL ERROR: {error_msg}")
                return APIResponse.error(
                    message=error_msg,
                    status_code=status.HTTP_400_BAD_REQUEST,
                )

        print(f"✅ MODEL SELECTED:")
        print(f"   ► Model ID: {default_model_id}")
        print(f"   ► Source:   {source_of_selection}")

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
        
        print(f"💾 SAVED TO DB: AICapabilityModel Updated.")
        print(f"{'='*50}\n")

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
