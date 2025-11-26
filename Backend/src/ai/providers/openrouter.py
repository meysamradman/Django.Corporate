from typing import Optional, Dict, Any, List
from io import BytesIO
import httpx
import os
import json
import base64
import logging
from .base import BaseProvider
from src.ai.messages.messages import AI_ERRORS

logger = logging.getLogger(__name__)


class OpenRouterModelCache:
    """
    Utility class for managing OpenRouter models cache
    Provides methods to clear cache when needed (e.g., when admin updates settings)
    """
    
    @staticmethod
    def clear_all():
        """Clear all OpenRouter models cache"""
        from django.core.cache import cache
        try:
            # Clear all provider filters
            cache.delete_many([
                'openrouter_models_all',
                'openrouter_models_google',
                'openrouter_models_openai',
                'openrouter_models_anthropic',
                'openrouter_models_meta',
                'openrouter_models_mistral',
            ])
            logger.info("[OpenRouter Cache] Cleared all OpenRouter models cache")
            print("[OpenRouter Cache] Cleared all OpenRouter models cache")
            return True
        except Exception as e:
            logger.error(f"[OpenRouter Cache] Error clearing cache: {str(e)}")
            print(f"[OpenRouter Cache] Error clearing cache: {str(e)}")
            return False
    
    @staticmethod
    def clear_provider(provider_filter: Optional[str] = None):
        """Clear cache for specific provider filter"""
        from django.core.cache import cache
        cache_key = f'openrouter_models_{provider_filter or "all"}'
        cache.delete(cache_key)
        logger.info(f"[OpenRouter Cache] Cleared cache for provider: {provider_filter or 'all'}")
        print(f"[OpenRouter Cache] Cleared cache for provider: {provider_filter or 'all'}")


class OpenRouterProvider(BaseProvider):
    """
    Provider for OpenRouter API - Unified interface for 60+ providers and 500+ models
    Supports chat, content generation, and image generation (depending on model)
    OpenAI-compatible API format
    """
    
    BASE_URL = os.getenv('OPENROUTER_API_BASE_URL', 'https://openrouter.ai/api/v1')
    
    def __init__(self, api_key: str, config: Optional[Dict[str, Any]] = None):
        super().__init__(api_key, config)
        
        # Log API key status
        api_key_preview = api_key[:10] + "..." if api_key and len(api_key) > 10 else "None"
        print(f"[OpenRouter Provider] Initializing with API key preview: {api_key_preview}")
        print(f"[OpenRouter Provider] Config: {config}")
        
        # Default models - can be overridden in config
        # Using valid OpenRouter model IDs from https://openrouter.ai/models?arch=Gemini
        # Popular models: gemini-2.5-flash, gemini-2.5-flash-lite, gemini-2.5-pro, gemini-3-pro-preview
        self.chat_model = config.get('chat_model', 'google/gemini-2.5-flash') if config else 'google/gemini-2.5-flash'
        self.content_model = config.get('content_model', 'google/gemini-2.5-flash') if config else 'google/gemini-2.5-flash'
        self.image_model = config.get('image_model', 'openai/dall-e-3') if config else 'openai/dall-e-3'
        # OpenRouter specific headers
        self.http_referer = config.get('http_referer', '') if config else ''
        self.x_title = config.get('x_title', 'Corporate Admin Panel') if config else 'Corporate Admin Panel'
        
        print(f"[OpenRouter Provider] Chat model: {self.chat_model}")
        print(f"[OpenRouter Provider] HTTP-Referer: {self.http_referer}")
        print(f"[OpenRouter Provider] X-Title: {self.x_title}")
    
    def get_provider_name(self) -> str:
        return 'openrouter'
    
    def _get_headers(self, extra_headers: Optional[Dict[str, str]] = None) -> Dict[str, str]:
        """Get headers for OpenRouter API requests"""
        if not self.api_key:
            print(f"[OpenRouter Provider] WARNING: API key is None or empty!")
            raise ValueError("API key is required for OpenRouter")
        
        # Check API key format
        if not self.api_key.startswith('sk-or-'):
            print(f"[OpenRouter Provider] WARNING: API key doesn't start with 'sk-or-': {self.api_key[:20]}...")
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        
        # Add optional headers only if they're not empty
        if self.http_referer:
            headers["HTTP-Referer"] = self.http_referer
        else:
            # OpenRouter recommends setting HTTP-Referer
            headers["HTTP-Referer"] = "https://localhost:3000"
        
        if self.x_title:
            headers["X-Title"] = self.x_title
        
        if extra_headers:
            headers.update(extra_headers)
        
        return headers
    
    def validate_api_key(self) -> bool:
        """Validate API key by making a test request"""
        try:
            # Check if key format is correct (OpenRouter API keys start with 'sk-or-')
            if not self.api_key or not self.api_key.startswith('sk-or-'):
                return False
            
            # Make a simple test request to validate the key (with shorter timeout)
            url = f"{self.BASE_URL}/models"
            headers = self._get_headers()
            
            # Use sync client for validation with shorter timeout to avoid hanging
            import httpx
            with httpx.Client(timeout=5.0) as client:
                response = client.get(url, headers=headers)
                return response.status_code == 200
        except (httpx.TimeoutException, httpx.RequestError, Exception):
            # Return False on any error to prevent hanging
            return False
    
    @classmethod
    def get_available_models(cls, api_key: str, provider_filter: Optional[str] = None, use_cache: bool = True) -> List[Dict[str, Any]]:
        """
        Get list of available models from OpenRouter API with Redis caching
        
        Args:
            api_key: OpenRouter API key
            provider_filter: Filter by provider (e.g., 'google', 'openai', 'anthropic')
            use_cache: Whether to use Redis cache (default: True)
        
        Returns:
            List of available models with their details
        
        Cache Strategy:
            - Cache timeout: 6 hours (models don't change frequently)
            - Cache key: 'openrouter_models_{provider_filter}'
            - Clear cache: Manual via admin or automatic after 6 hours
        """
        from django.core.cache import cache
        
        # Generate cache key
        cache_key = f'openrouter_models_{provider_filter or "all"}'
        
        # Try to get from cache first
        if use_cache:
            cached_models = cache.get(cache_key)
            if cached_models is not None:
                logger.info(f"[OpenRouter Provider] Returning {len(cached_models)} models from cache (key: {cache_key})")
                print(f"[OpenRouter Provider] Cache HIT: Returning {len(cached_models)} models from cache")
                return cached_models
            else:
                print(f"[OpenRouter Provider] Cache MISS: Fetching models from OpenRouter API")
        
        try:
            url = f"{cls.BASE_URL}/models"
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            }
            
            # Make request to get models list
            import httpx
            logger.info(f"[OpenRouter Provider] Fetching models list from OpenRouter API...")
            print(f"[OpenRouter Provider] Fetching models list from OpenRouter API...")
            
            with httpx.Client(timeout=10.0) as client:
                response = client.get(url, headers=headers)
                response.raise_for_status()
                data = response.json()
                
                models = []
                if 'data' in data:
                    for model in data['data']:
                        model_id = model.get('id', '')
                        model_name = model.get('name', model_id)
                        
                        # Filter by provider if specified (e.g., 'google/gemini' -> 'google')
                        if provider_filter:
                            if not model_id.startswith(f"{provider_filter}/"):
                                continue
                        
                        # Only include chat models (exclude image-only, embedding-only, etc.)
                        # Check if model supports chat/completions
                        pricing = model.get('pricing', {})
                        if not pricing:  # Skip models without pricing (usually not available)
                            continue
                        
                        # Include model if it has prompt/completion pricing (chat models)
                        if 'prompt' in pricing or 'completion' in pricing:
                            models.append({
                                'id': model_id,
                                'name': model_name,
                                'description': model.get('description', ''),
                                'context_length': model.get('context_length', 0),
                                'pricing': pricing,
                                'architecture': model.get('architecture', {}),
                            })
                
                # Sort by popularity (context length as proxy, or alphabetically)
                models.sort(key=lambda x: (x['context_length'], x['name']), reverse=True)
                
                logger.info(f"[OpenRouter Provider] Fetched {len(models)} models from API")
                print(f"[OpenRouter Provider] Fetched {len(models)} models from API")
                
                # Cache the results for 6 hours (21600 seconds)
                if use_cache:
                    cache.set(cache_key, models, 21600)  # 6 hours
                    logger.info(f"[OpenRouter Provider] Cached {len(models)} models (key: {cache_key}, TTL: 6 hours)")
                    print(f"[OpenRouter Provider] Cached {len(models)} models for 6 hours")
                
                return models
        except Exception as e:
            logger.error(f"[OpenRouter Provider] Error getting available models: {str(e)}", exc_info=True)
            print(f"[OpenRouter Provider] Error getting available models: {str(e)}")
            return []
    
    # Image generation (supports DALL-E models via OpenRouter)
    async def generate_image(self, prompt: str, **kwargs) -> BytesIO:
        """Generate image using OpenRouter (supports DALL-E models)"""
        # Check if model supports image generation
        if not any(img_model in self.image_model.lower() for img_model in ['dall-e', 'stability', 'flux', 'midjourney']):
            raise NotImplementedError("این مدل از تولید تصویر پشتیبانی نمی‌کند. لطفاً یک مدل تصویر (مثل openai/dall-e-3) انتخاب کنید.")
        
        print(f"[OpenRouter Provider] Generating image with model: {self.image_model}")
        print(f"[OpenRouter Provider] Prompt: {prompt[:100]}...")
        
        # ✅ OpenRouter uses CHAT COMPLETIONS endpoint for DALL-E (not /images/generations)
        # The model routing is handled by OpenRouter based on the model ID
        url = f"{self.BASE_URL}/chat/completions"
        
        headers = self._get_headers()
        
        size = kwargs.get('size', '1024x1024')
        quality = kwargs.get('quality', 'standard')
        
        # ✅ Use full model ID with provider prefix for OpenRouter
        model_id = self.image_model  # Keep full ID like "openai/dall-e-3"
        
        print(f"[OpenRouter Provider] Using full model ID: {model_id}")
        
        # ✅ OpenRouter expects chat format even for image generation
        # The image generation happens through chat with special prompt format
        payload = {
            "model": model_id,
            "messages": [
                {
                    "role": "user",
                    "content": f"Generate an image: {prompt}"
                }
            ],
            # Image-specific parameters (if supported by the model)
            "max_tokens": 1000,
        }
        
        print(f"[OpenRouter Provider] Request payload: {json.dumps(payload, ensure_ascii=False)}")
        
        try:
            response = await self.client.post(url, json=payload, headers=headers)
            response.raise_for_status()
            
            data = response.json()
            
            print(f"[OpenRouter Provider] Response status: {response.status_code}")
            print(f"[OpenRouter Provider] Response data keys: {list(data.keys())}")
            
            # ✅ OpenRouter returns image URL in the chat response
            if 'choices' in data and len(data['choices']) > 0:
                content = data['choices'][0]['message']['content']
                print(f"[OpenRouter Provider] Response content: {content[:200]}...")
                
                # Check if content contains image URL (DALL-E returns URL in response)
                # Format: The image URL might be in markdown or plain text
                import re
                url_pattern = r'https?://[^\s]+'
                urls = re.findall(url_pattern, content)
                
                if urls:
                    image_url = urls[0]
                    print(f"[OpenRouter Provider] Downloading image from URL: {image_url[:50]}...")
                    return await self.download_image(image_url)
                else:
                    # If no URL found, the model might not support image generation
                    raise Exception(f"مدل {model_id} از تولید تصویر پشتیبانی نمی‌کند. پاسخ: {content[:200]}")
            
            raise Exception("پاسخ نامعتبر از API دریافت شد")
            
        except httpx.HTTPStatusError as e:
            error_msg = "خطا در تولید تصویر"
            print(f"[OpenRouter Provider] HTTP Error: {e.response.status_code}")
            print(f"[OpenRouter Provider] Response body: {e.response.text[:500]}")
            try:
                error_data = e.response.json()
                if 'error' in error_data:
                    error_msg = error_data['error'].get('message', error_msg)
                print(f"[OpenRouter Provider] Error from API: {error_msg}")
            except:
                pass
            raise Exception(f"{error_msg}: {str(e)}")
        except Exception as e:
            print(f"[OpenRouter Provider] Exception: {str(e)}")
            raise Exception(f"خطا در تولید تصویر: {str(e)}")
    
    # Content generation
    async def generate_content(self, prompt: str, **kwargs) -> str:
        """Generate content using OpenRouter"""
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
            
            raise Exception("پاسخ نامعتبر از API دریافت شد")
            
        except httpx.HTTPStatusError as e:
            error_msg = "خطا در تولید محتوا"
            try:
                error_data = e.response.json()
                if 'error' in error_data:
                    error_msg = error_data['error'].get('message', error_msg)
            except:
                pass
            raise Exception(f"{error_msg}: {str(e)}")
        except Exception as e:
            raise Exception(f"خطا در تولید محتوا: {str(e)}")
    
    # SEO content generation
    async def generate_seo_content(self, topic: str, **kwargs) -> Dict[str, Any]:
        """Generate SEO-optimized content using OpenRouter"""
        word_count = kwargs.get('word_count', 500)
        tone = kwargs.get('tone', 'professional')
        keywords = kwargs.get('keywords', [])
        
        # Build SEO prompt
        keywords_str = ", ".join(keywords) if keywords else ""
        seo_prompt = f"""یک محتوای SEO بهینه با مشخصات زیر ایجاد کن:

موضوع: {topic}
تعداد کلمات: حدود {word_count} کلمه
سبک: {tone}
کلمات کلیدی: {keywords_str if keywords_str else "خودت انتخاب کن"}

خروجی باید شامل موارد زیر باشد:
1. عنوان اصلی (title) - جذاب و SEO-friendly
2. متا عنوان (meta_title) - حداکثر 60 کاراکتر
3. متا توضیحات (meta_description) - حداکثر 160 کاراکتر
4. عنوان H1
5. محتوای اصلی با تگ‌های HTML (p, h2, h3)
6. کلمات کلیدی مرتبط
7. تعداد کلمات

خروجی را به صورت JSON با ساختار زیر برگردان:
{{
    "title": "...",
    "meta_title": "...",
    "meta_description": "...",
    "h1": "...",
    "content": "<p>...</p><h2>...</h2><p>...</p>",
    "keywords": ["...", "..."],
    "word_count": ...,
    "slug": "..."
}}"""

        url = f"{self.BASE_URL}/chat/completions"
        
        headers = self._get_headers()
        
        payload = {
            "model": self.content_model,
            "messages": [
                {
                    "role": "system",
                    "content": "شما یک متخصص SEO و تولید محتوا هستید. همیشه پاسخ‌های خود را به صورت JSON معتبر برگردانید."
                },
                {
                    "role": "user",
                    "content": seo_prompt
                }
            ],
            "temperature": kwargs.get('temperature', 0.7),
            # ✅ محاسبه max_tokens بر اساس word_count (تقریباً 1.3x برای فارسی + HTML)
            "max_tokens": kwargs.get('max_tokens', int(word_count * 1.5)),
        }
        
        # ✅ FIX: response_format فقط برای مدل‌های خاص (OpenAI) کار می‌کنه
        # برخی مدل‌ها مثل Grok این رو ساپورت نمی‌کنن و timeout میشن
        if 'gpt' in self.content_model.lower() or 'openai' in self.content_model.lower():
            payload["response_format"] = {"type": "json_object"}
        
        print(f"[OpenRouter Provider] Generating SEO content with model: {self.content_model}")
        print(f"[OpenRouter Provider] Max tokens: {payload['max_tokens']}")
        
        try:
            response = await self.client.post(url, json=payload, headers=headers)
            response.raise_for_status()
            
            data = response.json()
            
            if 'choices' in data and len(data['choices']) > 0:
                content_str = data['choices'][0]['message']['content'].strip()
                
                # Try to parse JSON response
                try:
                    # Try to extract JSON from markdown code blocks if present
                    if '```json' in content_str:
                        json_start = content_str.find('```json') + 7
                        json_end = content_str.find('```', json_start)
                        content_str = content_str[json_start:json_end].strip()
                    elif '```' in content_str:
                        json_start = content_str.find('```') + 3
                        json_end = content_str.find('```', json_start)
                        content_str = content_str[json_start:json_end].strip()
                    
                    seo_data = json.loads(content_str)
                    return seo_data
                except json.JSONDecodeError as e:
                    # Fallback: Create simple structure from text
                    from unidecode import unidecode
                    import re
                    
                    slug = re.sub(r'[^a-z0-9]+', '-', unidecode(topic).lower()).strip('-')
                    
                    return {
                        "title": topic,
                        "meta_title": topic[:60],
                        "meta_description": f"محتوای تولید شده توسط هوش مصنوعی در مورد {topic}"[:160],
                        "h1": topic,
                        "content": f"<p>{content_str[:500]}</p>",
                        "keywords": [topic],
                        "word_count": len(content_str.split()),
                        "slug": slug
                    }

            raise Exception("پاسخ نامعتبر از API دریافت شد")
            
        except json.JSONDecodeError as e:
            raise Exception(f"خطا در پارس کردن پاسخ JSON: {str(e)}")
        except httpx.HTTPStatusError as e:
            error_msg = "خطا در تولید محتوای SEO"
            try:
                error_data = e.response.json()
                if 'error' in error_data:
                    error_msg = error_data['error'].get('message', error_msg)
            except:
                pass
            raise Exception(f"{error_msg}: {str(e)}")
        except Exception as e:
            raise Exception(f"خطا در تولید محتوای SEO: {str(e)}")
    
    # Chat method
    async def chat(self, message: str, conversation_history: Optional[List[Dict[str, str]]] = None, **kwargs) -> str:
        """Chat with AI using OpenRouter"""
        url = f"{self.BASE_URL}/chat/completions"
        
        headers = self._get_headers()
        
        # Log request details (without exposing full API key)
        api_key_length = len(self.api_key) if self.api_key else 0
        api_key_preview = self.api_key[:15] + "..." if self.api_key and len(self.api_key) > 15 else "None"
        auth_header_preview = headers.get('Authorization', '')[:25] + "..." if headers.get('Authorization') else "None"
        logger.info(f"[OpenRouter Provider] Making chat request - API key length: {api_key_length}, preview: {api_key_preview}")
        print(f"[OpenRouter Provider] Making chat request")
        print(f"[OpenRouter Provider] API key length: {api_key_length}, preview: {api_key_preview}")
        print(f"[OpenRouter Provider] Authorization header preview: {auth_header_preview}")
        print(f"[OpenRouter Provider] All headers keys: {list(headers.keys())}")
        print(f"[OpenRouter Provider] HTTP-Referer: {headers.get('HTTP-Referer', 'None')}")
        print(f"[OpenRouter Provider] X-Title: {headers.get('X-Title', 'None')}")
        
        messages = []
        
        # Add system message if provided
        if kwargs.get('system_message'):
            messages.append({
                "role": "system",
                "content": kwargs['system_message']
            })
        
        # Add conversation history
        if conversation_history:
            for msg in conversation_history:
                messages.append({
                    "role": msg.get('role', 'user'),
                    "content": msg.get('content', '')
                })
        
        # Add current message
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
        
        logger.info(f"[OpenRouter Provider] Request URL: {url}, Model: {payload['model']}, Messages: {len(payload['messages'])}")
        print(f"[OpenRouter Provider] Request URL: {url}")
        print(f"[OpenRouter Provider] Model: {payload['model']}")
        print(f"[OpenRouter Provider] Messages count: {len(payload['messages'])}")
        
        try:
            response = await self.client.post(url, json=payload, headers=headers)
            logger.info(f"[OpenRouter Provider] Response status: {response.status_code}")
            print(f"[OpenRouter Provider] Response status: {response.status_code}")
            
            # Log response body for debugging
            try:
                response_body = response.json()
                logger.info(f"[OpenRouter Provider] Response body: {response_body}")
                print(f"[OpenRouter Provider] Response body: {response_body}")
            except:
                logger.warning(f"[OpenRouter Provider] Could not parse response as JSON")
                print(f"[OpenRouter Provider] Could not parse response as JSON")
            
            response.raise_for_status()
            
            data = response.json()
            
            if 'choices' in data and len(data['choices']) > 0:
                return data['choices'][0]['message']['content'].strip()
            
            raise Exception("پاسخ نامعتبر از API دریافت شد")
            
        except httpx.HTTPStatusError as e:
            status_code = e.response.status_code
            error_msg = "خطا در چت"
            error_details = {}
            
            try:
                error_data = e.response.json()
                print(f"[OpenRouter Provider] Error response: {error_data}")
                if 'error' in error_data:
                    error_msg = error_data['error'].get('message', error_msg)
                    error_details = error_data['error']
            except:
                print(f"[OpenRouter Provider] Could not parse error response")
                pass
            
            # Better error messages for common OpenRouter errors
            if status_code == 401:
                if 'User not found' in error_msg or 'Unauthorized' in str(e):
                    raise Exception(
                        "خطای OpenRouter API: API Key نامعتبر است. لطفاً API Key خود را در تنظیمات بررسی کنید."
                    )
                else:
                    raise Exception(
                        f"خطای OpenRouter API: API Key نامعتبر است. ({error_msg})"
                    )
            elif status_code == 429:
                if 'quota' in error_msg.lower() or 'billing' in error_msg.lower():
                    raise Exception(
                        "خطای OpenRouter API: اعتبار حساب شما تمام شده است. لطفاً به https://openrouter.ai/account/billing مراجعه کنید."
                    )
                else:
                    raise Exception("خطای OpenRouter API: تعداد درخواست‌ها زیاد است. لطفاً چند لحظه صبر کنید.")
            elif status_code == 403:
                raise Exception("خطای OpenRouter API: دسترسی به API محدود شده است.")
            
            raise Exception(f"{error_msg}: {str(e)}")
        except Exception as e:
            raise Exception(f"خطا در چت: {str(e)}")

