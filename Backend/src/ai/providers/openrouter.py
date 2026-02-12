from typing import Optional, Dict, Any, List
from io import BytesIO
import httpx
import os
import base64
from django.core.cache import cache
from .base import BaseProvider
from .capabilities import get_default_model
from src.ai.messages.messages import AI_ERRORS, IMAGE_ERRORS, CONTENT_ERRORS, CHAT_ERRORS
from src.ai.utils.cache import AICacheKeys, AICacheManager
from src.ai.prompts.content import get_content_prompt, get_seo_prompt
from src.ai.prompts.chat import get_chat_system_message
from src.ai.prompts.image import get_image_prompt, enhance_image_prompt, get_negative_prompt
from src.ai.prompts.audio import get_audio_prompt, calculate_word_count, estimate_duration

class OpenRouterModelCache:
    
    @staticmethod
    def clear_all():
        try:
            AICacheManager.invalidate_models_by_provider('openrouter')
            cache.delete_many([
                AICacheKeys.provider_models('openrouter', 'all'),
                AICacheKeys.provider_models('openrouter', 'google'),
                AICacheKeys.provider_models('openrouter', 'openai'),
                AICacheKeys.provider_models('openrouter', 'anthropic'),
                AICacheKeys.provider_models('openrouter', 'meta'),
                AICacheKeys.provider_models('openrouter', 'mistral'),
            ])
            return True
        except Exception:
            return False
    
    @staticmethod
    def clear_provider(provider_filter: Optional[str] = None):
        cache_key = AICacheKeys.provider_models('openrouter', provider_filter)
        cache.delete(cache_key)

class OpenRouterProvider(BaseProvider):
    
    BASE_URL = os.getenv('OPENROUTER_API_BASE_URL', 'https://openrouter.ai/api/v1')
    
    def __init__(self, api_key: str, config: Optional[Dict[str, Any]] = None):
        super().__init__(api_key, config)

        cfg = config or {}
        selected_model = cfg.get('model')

        # Back-compat + service-driven behavior:
        # - New capability-based services pass the resolved model in `config['model']`.
        # - Existing configs may still provide capability-specific keys.
        self.chat_model = (
            cfg.get('chat_model')
            or selected_model
            or get_default_model('openrouter', 'chat')
        )
        self.content_model = (
            cfg.get('content_model')
            or selected_model
            or get_default_model('openrouter', 'content')
        )
        self.image_model = (
            cfg.get('image_model')
            or selected_model
            or get_default_model('openrouter', 'image')
        )

        self.http_referer = cfg.get('http_referer', '')
        self.x_title = cfg.get('x_title', 'Corporate Admin Panel')
    
    def get_provider_name(self) -> str:
        return 'openrouter'
    
    def _get_headers(self, extra_headers: Optional[Dict[str, str]] = None) -> Dict[str, str]:
        if not self.api_key:
            raise ValueError("API key is required for OpenRouter")
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        
        # Use HTTP-Referer from config or environment variable
        # This is important for security and proper tracking in production
        if self.http_referer:
            headers["HTTP-Referer"] = self.http_referer
        else:
            # Get from environment variable or use default
            default_referer = os.getenv('FRONTEND_URL', 'http://localhost:3000')
            headers["HTTP-Referer"] = default_referer
        
        if self.x_title:
            headers["X-Title"] = self.x_title
        
        if extra_headers:
            headers.update(extra_headers)
        
        return headers

    @staticmethod
    def _map_http_error_message(status_code: int, detail_message: str, fallback_key: str) -> str:
        detail_lower = (detail_message or '').lower()

        if status_code == 401:
            return AI_ERRORS["generic_api_key_invalid"]

        if status_code == 403:
            return AI_ERRORS["provider_access_blocked"]

        if status_code == 402 or 'payment required' in detail_lower or 'paid' in detail_lower or 'pricing' in detail_lower:
            return AI_ERRORS["provider_model_paid_required"]

        if status_code == 429:
            if 'quota' in detail_lower or 'billing' in detail_lower or 'credit' in detail_lower or 'limit' in detail_lower:
                return AI_ERRORS["provider_limit_exceeded"]
            return AI_ERRORS["generic_rate_limit"]

        if status_code == 400 and (
            'not a valid model id' in detail_lower or
            ('model' in detail_lower and 'not found' in detail_lower) or
            ('model' in detail_lower and 'invalid' in detail_lower)
        ):
            return AI_ERRORS["generic_model_not_found"]

        if status_code == 404:
            if (
                'not a valid model id' in detail_lower or
                ('model' in detail_lower and 'not found' in detail_lower) or
                ('model' in detail_lower and 'invalid' in detail_lower)
            ):
                return AI_ERRORS["generic_model_not_found"]
            return AI_ERRORS["provider_not_available"]

        if 'api is disabled' in detail_lower or 'api disabled' in detail_lower or 'service disabled' in detail_lower or 'not active' in detail_lower:
            return AI_ERRORS["provider_api_inactive"]

        return AI_ERRORS.get(fallback_key, AI_ERRORS["generic_provider_error"])
    
    def validate_api_key(self) -> bool:
        try:
            if not self.api_key or not self.api_key.startswith('sk-or-'):
                return False
            
            url = f"{self.BASE_URL}/models"
            headers = self._get_headers()
            
            with httpx.Client(timeout=5.0) as client:
                response = client.get(url, headers=headers)
                return response.status_code == 200
        except (httpx.TimeoutException, httpx.RequestError, Exception):
            return False
    
    @classmethod
    def get_available_models(
        cls,
        api_key: Optional[str] = None,
        provider_filter: Optional[str] = None,
        use_cache: bool = True,
    ) -> List[Dict[str, Any]]:
        cache_key = AICacheKeys.provider_models('openrouter', provider_filter)
        
        if use_cache:
            cached_models = cache.get(cache_key)
            if cached_models is not None:
                return cached_models
        
        try:
            url = f"{cls.BASE_URL}/models"
            headers = {
                "Content-Type": "application/json",
            }
            
            if api_key and api_key.strip():
                headers["Authorization"] = f"Bearer {api_key}"
            
            with httpx.Client(timeout=10.0) as client:
                response = client.get(url, headers=headers)
                response.raise_for_status()
                data = response.json()
                
                models = []
                if 'data' in data:
                    for model in data['data']:
                        model_id = model.get('id', '')
                        model_name = model.get('name', model_id)
                        
                        if provider_filter:
                            if not model_id.startswith(f"{provider_filter}/"):
                                continue
                        
                        pricing = model.get('pricing', {})
                        if not pricing:
                            continue
                        
                        if 'prompt' in pricing or 'completion' in pricing:
                            models.append({
                                'id': model_id,
                                'name': model_name,
                                'description': model.get('description', ''),
                                'context_length': model.get('context_length', 0),
                                'pricing': pricing,
                                'architecture': model.get('architecture', {}),
                            })
                
                models.sort(key=lambda x: (x['context_length'], x['name']), reverse=True)
                
                if use_cache:
                    cache.set(cache_key, models, 21600)
                
                return models
        except httpx.HTTPStatusError as e:
            if e.response.status_code in [401, 403]:
                if use_cache:
                    cached_models = cache.get(cache_key)
                    if cached_models:
                        return cached_models
                return []
            else:
                raise
        except Exception as e:
            if use_cache:
                cached_models = cache.get(cache_key)
                if cached_models:
                    return cached_models
            return []
    
    async def generate_image(self, prompt: str, **kwargs) -> BytesIO:
        if not any(img_model in self.image_model.lower() for img_model in ['dall-e', 'stability', 'flux', 'midjourney']):
            raise NotImplementedError(IMAGE_ERRORS["model_no_image_capability"])

        # OpenRouter exposes OpenAI-compatible endpoints; image generation is via /images/generations.
        url = f"{self.BASE_URL}/images/generations"

        headers = self._get_headers()

        size = kwargs.get('size', '1024x1024')
        quality = kwargs.get('quality', 'standard')
        style = kwargs.get('style', 'realistic')
        n = kwargs.get('n', 1)

        model_id = self.image_model
        
        # Use centralized image prompt enhancement from prompts module
        enhanced_prompt = enhance_image_prompt(prompt, style=style, add_quality=(quality == 'hd'))

        payload = {
            "model": model_id,
            "prompt": enhanced_prompt,
            "n": n,
            "size": size,
            "quality": quality,
        }
        if style and style in ['natural', 'vivid']:  # OpenRouter/DALL-E specific styles
            payload["style"] = style

        try:
            response = await self.client.post(url, json=payload, headers=headers)
            response.raise_for_status()

            data = response.json()

            images = data.get('data') if isinstance(data, dict) else None
            if isinstance(images, list) and len(images) > 0:
                first = images[0] if isinstance(images[0], dict) else {}
                image_url = first.get('url')
                b64_json = first.get('b64_json')

                if b64_json:
                    import base64
                    return BytesIO(base64.b64decode(b64_json))
                if image_url:
                    return await self.download_image(image_url)

                raise Exception(AI_ERRORS["invalid_response"])

        except httpx.TimeoutException:
            raise Exception(AI_ERRORS["generic_timeout"])

        except httpx.HTTPStatusError as e:
            status_code = getattr(e.response, 'status_code', None)
            detail = None
            try:
                error_data = e.response.json()
                if isinstance(error_data, dict):
                    if isinstance(error_data.get('error'), dict):
                        detail = error_data['error'].get('message')
                    detail = detail or error_data.get('detail') or error_data.get('message')
            except Exception:
                detail = None

            detail_str = (detail or '').strip()
            detail_lower = detail_str.lower()

            if status_code in (401, 403):
                raise Exception(IMAGE_ERRORS["api_key_invalid"])

            if status_code == 429:
                raise Exception(IMAGE_ERRORS["image_rate_limit"])

            if status_code == 400 and (
                'not a valid model id' in detail_lower or
                ('model' in detail_lower and 'valid' in detail_lower)
            ):
                raise Exception(IMAGE_ERRORS["model_not_found"])

            # Do not leak raw upstream error details in admin-panel toasts.
            raise Exception(IMAGE_ERRORS["image_generation_failed_simple"])

        except Exception as e:
            # Preserve already-localized messages; otherwise use a safe Persian fallback.
            msg = str(e).strip()
            if msg in IMAGE_ERRORS.values():
                raise Exception(msg)

            msg_lower = msg.lower()
            if 'timeout' in msg_lower:
                raise Exception(IMAGE_ERRORS["image_timeout"])
            if 'rate limit' in msg_lower or 'too many requests' in msg_lower or '429' in msg_lower:
                raise Exception(IMAGE_ERRORS["image_rate_limit"])
            if 'quota' in msg_lower or 'billing' in msg_lower or 'credit' in msg_lower:
                raise Exception(IMAGE_ERRORS["image_quota_exceeded"])

            raise Exception(IMAGE_ERRORS["image_generation_failed_simple"])
    
    async def generate_content(self, prompt: str, **kwargs) -> str:
        url = f"{self.BASE_URL}/chat/completions"
        
        headers = self._get_headers()
        
        payload = {
            "model": self.content_model,
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": kwargs.get('temperature', 0.7),
            "max_tokens": kwargs.get('max_tokens', 2048),
        }
        
        if kwargs.get('system_message'):
            payload["messages"].insert(0, {
                "role": "system",
                "content": kwargs['system_message']
            })
        
        try:
            response = await self.client.post(url, json=payload, headers=headers)
            response.raise_for_status()
            
            data = response.json()
            
            if 'choices' in data and len(data['choices']) > 0:
                return data['choices'][0]['message']['content'].strip()
            
            raise Exception(CONTENT_ERRORS["content_generation_failed"])
            
        except httpx.TimeoutException:
            raise Exception(AI_ERRORS["generic_timeout"])
        except httpx.RequestError:
            raise Exception(AI_ERRORS["provider_server_unreachable"])
        except httpx.HTTPStatusError as e:
            error_msg = CONTENT_ERRORS["content_generation_failed"]
            status_code = getattr(e.response, 'status_code', 0)
            try:
                error_data = e.response.json()
                if 'error' in error_data:
                    error_msg = error_data['error'].get('message', error_msg)
            except Exception:
                pass
            mapped = self._map_http_error_message(status_code, error_msg, 'content_generation_failed')
            raise Exception(mapped)
        except Exception as e:
            msg = str(e).strip()
            if msg in AI_ERRORS.values() or msg in CONTENT_ERRORS.values():
                raise Exception(msg)
            raise Exception(CONTENT_ERRORS["content_generation_failed"])
    
    async def generate_seo_content(self, topic: str, **kwargs) -> Dict[str, Any]:
        word_count = kwargs.get('word_count', 500)
        tone = kwargs.get('tone', 'professional')
        keywords = kwargs.get('keywords', [])
        
        keywords_str = f", {', '.join(keywords)}" if keywords else ""
        
        # دریافت prompt از ماژول prompts
        seo_prompt_template = get_seo_prompt(provider='openrouter')
        seo_prompt = seo_prompt_template.format(
            topic=topic,
            keywords_str=keywords_str,
            word_count=word_count
        )

        url = f"{self.BASE_URL}/chat/completions"
        
        headers = self._get_headers()
        
        payload = {
            "model": self.content_model,
            "messages": [
                {
                    "role": "system",
                    "content": "You are an SEO and content generation specialist. Always return valid JSON responses."
                },
                {
                    "role": "user",
                    "content": seo_prompt
                }
            ],
            "temperature": kwargs.get('temperature', 0.7),
            "max_tokens": kwargs.get('max_tokens', int(word_count * 1.5)),
        }
        
        if 'gpt' in self.content_model.lower() or 'openai' in self.content_model.lower():
            payload["response_format"] = {"type": "json_object"}
        
        try:
            response = await self.client.post(url, json=payload, headers=headers)
            response.raise_for_status()
            
            data = response.json()
            
            if 'choices' in data and len(data['choices']) > 0:
                content_str = data['choices'][0]['message']['content'].strip()

                seo_data = self.extract_json_payload(content_str)
                if seo_data is not None:
                    return seo_data
                raise Exception(AI_ERRORS["invalid_json"])

            raise Exception(CONTENT_ERRORS["content_generation_failed"])
            
        except httpx.TimeoutException:
            raise Exception(AI_ERRORS["generic_timeout"])
        except httpx.RequestError:
            raise Exception(AI_ERRORS["provider_server_unreachable"])
        except httpx.HTTPStatusError as e:
            error_msg = CONTENT_ERRORS["content_generation_failed"]
            status_code = getattr(e.response, 'status_code', 0)

            try:
                error_data = e.response.json()
                if 'error' in error_data:
                    error_msg = error_data['error'].get('message', error_msg)
            except Exception:
                pass

            mapped = self._map_http_error_message(status_code, error_msg, 'content_generation_failed')
            raise Exception(mapped)
        except Exception as e:
            msg = str(e).strip()
            if msg == AI_ERRORS["invalid_json"]:
                raise Exception(AI_ERRORS["invalid_json"])
            if msg in AI_ERRORS.values() or msg in CONTENT_ERRORS.values():
                raise Exception(msg)
            raise Exception(CONTENT_ERRORS["content_generation_failed"])
    
    async def chat(self, message: str, conversation_history: Optional[List[Dict[str, str]]] = None, **kwargs) -> str:
        url = f"{self.BASE_URL}/chat/completions"
        
        headers = self._get_headers()
        
        messages = []
        
        if kwargs.get('system_message'):
            messages.append({
                "role": "system",
                "content": kwargs['system_message']
            })
        
        if conversation_history:
            for msg in conversation_history:
                messages.append({
                    "role": msg.get('role', 'user'),
                    "content": msg.get('content', '')
                })
        
        if kwargs.get('image'):
            import base64
            image_file = kwargs['image']
            if hasattr(image_file, 'read'):
                image_content = image_file.read()
                if isinstance(image_content, str):
                    image_content = image_content.encode('utf-8')
                base64_image = base64.b64encode(image_content).decode('utf-8')
                
                content = [
                    {"type": "text", "text": message},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{base64_image}"
                        }
                    }
                ]
                messages.append({"role": "user", "content": content})
            else:
                 messages.append({"role": "user", "content": message})
        else:
            messages.append({
                "role": "user",
                "content": message
            })
        
        payload = {
            "model": kwargs.get('model', self.chat_model),
            "messages": messages,
            "temperature": kwargs.get('temperature', 0.7),
            "max_tokens": kwargs.get('max_tokens', 2048),
        }
        
        try:
            response = await self.client.post(url, json=payload, headers=headers)
            response.raise_for_status()
            
            data = response.json()
            
            if 'choices' in data and len(data['choices']) > 0:
                return data['choices'][0]['message']['content'].strip()
            
            raise Exception(CHAT_ERRORS["chat_failed"])
            
        except httpx.TimeoutException:
            raise Exception(AI_ERRORS["generic_timeout"])
        except httpx.RequestError:
            raise Exception(AI_ERRORS["provider_server_unreachable"])
        except httpx.HTTPStatusError as e:
            status_code = e.response.status_code
            error_msg = CHAT_ERRORS["chat_failed"]
            
            try:
                error_data = e.response.json()
                if 'error' in error_data:
                    error_msg = error_data['error'].get('message', error_msg)
            except:
                pass
            
            mapped = self._map_http_error_message(status_code, error_msg, 'chat_failed')
            raise Exception(mapped)
        except Exception as e:
            msg = str(e).strip()
            if msg in AI_ERRORS.values() or msg in CHAT_ERRORS.values():
                raise Exception(msg)
            raise Exception(CHAT_ERRORS["chat_failed"])

