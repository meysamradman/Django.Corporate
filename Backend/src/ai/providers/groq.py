from typing import Optional, Dict, Any, List
from io import BytesIO
import httpx
import json
import os
import logging
from .base import BaseProvider
from src.ai.utils.cache import AICacheKeys

logger = logging.getLogger(__name__)


class GroqProvider(BaseProvider):
    """
    Provider for Groq API - Fast and free AI models
    Supports chat and content generation
    Groq uses OpenAI-compatible API format
    """
    
    BASE_URL = os.getenv('GROQ_API_BASE_URL', 'https://api.groq.com/openai/v1')
    
    def __init__(self, api_key: str, config: Optional[Dict[str, Any]] = None):
        super().__init__(api_key, config)
        # Default models - Groq offers fast models
        # ✅ Updated: llama-3.1-70b-versatile deprecated, using llama-3.1-8b-instant (fast and reliable)
        self.chat_model = config.get('chat_model', 'llama-3.1-8b-instant') if config else 'llama-3.1-8b-instant'
        self.content_model = config.get('content_model', 'llama-3.1-8b-instant') if config else 'llama-3.1-8b-instant'
        
        logger.info(f"[Groq Provider] Initialized with model: {self.chat_model}")
    
    def get_provider_name(self) -> str:
        return 'groq'
    
    def _get_headers(self) -> Dict[str, str]:
        """Get headers for Groq API requests"""
        if not self.api_key:
            raise ValueError("API key is required for Groq")
        
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
    
    def validate_api_key(self) -> bool:
        """Validate API key by making a test request"""
        try:
            if not self.api_key or not self.api_key.strip():
                return False
            
            # Groq API keys typically start with 'gsk_'
            if not self.api_key.startswith('gsk_'):
                logger.warning(f"[Groq Provider] API key doesn't start with 'gsk_': {self.api_key[:20]}...")
            
            # Make a simple test request to validate the key
            url = f"{self.BASE_URL}/models"
            headers = self._get_headers()
            
            # Use sync client for validation with shorter timeout
            with httpx.Client(timeout=5.0) as client:
                response = client.get(url, headers=headers)
                return response.status_code == 200
        except Exception as e:
            logger.error(f"[Groq Provider] Error validating API key: {str(e)}")
            return False
    
    @classmethod
    def get_available_models(cls, api_key: Optional[str] = None, use_cache: bool = True) -> List[Dict[str, Any]]:
        """
        Get list of available models from Groq API
        
        Args:
            api_key: Groq API key (optional - if not provided, returns default models)
            use_cache: Whether to use cache (default: True)
        
        Returns:
            List of available models with their details
        """
        from django.core.cache import cache
        
        # ✅ Use standardized cache key from AICacheKeys
        cache_key = AICacheKeys.provider_models('groq', None)
        
        # Try cache first
        if use_cache:
            cached_models = cache.get(cache_key)
            if cached_models is not None:
                logger.info(f"[Groq Provider] Returning {len(cached_models)} models from cache")
                return cached_models
        
        try:
            url = f"{cls.BASE_URL}/models"
            headers = {
                "Content-Type": "application/json",
            }
            
            if api_key and api_key.strip():
                headers["Authorization"] = f"Bearer {api_key}"
            
            # Make request to get models list
            with httpx.Client(timeout=10.0) as client:
                response = client.get(url, headers=headers)
                response.raise_for_status()
                data = response.json()
                
                models = []
                if 'data' in data:
                    for model in data['data']:
                        model_id = model.get('id', '')
                        model_name = model.get('name', model_id)
                        
                        # Only include chat models (exclude deprecated or unavailable)
                        if model.get('object') == 'model':
                            models.append({
                                'id': model_id,
                                'name': model_name,
                                'description': model.get('description', ''),
                                'context_length': model.get('context_length', 0),
                                'pricing': model.get('pricing', {}),
                            })
                
                # Sort by popularity (context length as proxy)
                models.sort(key=lambda x: x['context_length'], reverse=True)
                
                logger.info(f"[Groq Provider] Fetched {len(models)} models from API")
                
                # Cache for 6 hours
                if use_cache:
                    cache.set(cache_key, models, 6 * 60 * 60)  # 6 hours
                
                return models
        except httpx.HTTPStatusError as e:
            if e.response.status_code in [401, 403]:
                logger.warning(f"[Groq Provider] API key required (status: {e.response.status_code})")
                # Return default models if API key is not available
                return cls._get_default_models()
            else:
                logger.error(f"[Groq Provider] HTTP error getting models: {e.response.status_code}")
                return cls._get_default_models()
        except Exception as e:
            logger.error(f"[Groq Provider] Error getting available models: {str(e)}", exc_info=True)
            return cls._get_default_models()
    
    @staticmethod
    def _get_default_models() -> List[Dict[str, Any]]:
        """Get default Groq models (when API is not accessible)"""
        return [
            {
                'id': 'llama-3.3-70b-versatile',
                'name': 'Llama 3.3 70B Versatile',
                'description': 'Fast and versatile model for general tasks (Latest)',
                'context_length': 131072,
            },
            {
                'id': 'llama-3.1-8b-instant',
                'name': 'Llama 3.1 8B Instant',
                'description': 'Ultra-fast model for quick responses',
                'context_length': 131072,
            },
            {
                'id': 'mixtral-8x7b-32768',
                'name': 'Mixtral 8x7B',
                'description': 'High-quality multilingual model',
                'context_length': 32768,
            },
            {
                'id': 'gemma2-9b-it',
                'name': 'Gemma2 9B IT',
                'description': 'Instruction-tuned model for chat (Latest)',
                'context_length': 8192,
            },
        ]
    
    # Image generation (not supported by Groq)
    async def generate_image(self, prompt: str, **kwargs) -> BytesIO:
        """Generate image with Groq - not supported"""
        raise NotImplementedError("Groq does not support image generation")
    
    # Content generation
    async def generate_content(self, prompt: str, **kwargs) -> str:
        """Generate content using Groq"""
        url = f"{self.BASE_URL}/chat/completions"
        
        headers = self._get_headers()
        
        word_count = kwargs.get('word_count', 500)
        tone = kwargs.get('tone', 'professional')
        
        full_prompt = f"""لطفاً یک محتوای حرفه‌ای و سئو شده به زبان فارسی بنویسید.

موضوع: {prompt}

ملاحظات:
- طول محتوا: حدود {word_count} کلمه
- سبک: {tone}
- محتوا باید برای SEO بهینه باشد
- استفاده از کلمات کلیدی طبیعی
- ساختار منطقی و خوانا

محتوا را به صورت متن ساده بدون فرمت خاص بنویسید."""
        
        payload = {
            "model": self.content_model,
            "messages": [
                {
                    "role": "system",
                    "content": "شما یک نویسنده حرفه‌ای و متخصص SEO هستید که به زبان فارسی می‌نویسید."
                },
                {
                    "role": "user",
                    "content": full_prompt
                }
            ],
            "temperature": kwargs.get('temperature', 0.7),
            "max_tokens": kwargs.get('max_tokens', word_count * 2),
        }
        
        try:
            response = await self.client.post(url, json=payload, headers=headers)
            response.raise_for_status()
            
            data = response.json()
            if 'choices' in data and len(data['choices']) > 0:
                content = data['choices'][0]['message']['content']
                return content.strip()
            
            raise Exception("هیچ پاسخی دریافت نشد")
            
        except httpx.HTTPStatusError as e:
            status_code = e.response.status_code
            error_msg = "خطا در تولید محتوا"
            
            try:
                error_data = e.response.json()
                error_msg = error_data.get('error', {}).get('message', error_msg)
            except:
                pass
            
            if status_code == 429:
                raise Exception("خطای Groq API: تعداد درخواست‌ها زیاد است. لطفاً چند لحظه صبر کنید.")
            elif status_code == 401:
                raise Exception("خطای Groq API: API Key نامعتبر است.")
            elif status_code == 403:
                raise Exception("خطای Groq API: دسترسی به API محدود شده است.")
            
            raise Exception(f"خطای Groq API: {error_msg}")
        except Exception as e:
            raise Exception(f"خطا در تولید محتوا: {str(e)}")
    
    async def generate_seo_content(self, topic: str, **kwargs) -> Dict[str, Any]:
        """Generate SEO-optimized content using Groq"""
        import re
        from django.utils.text import slugify
        
        word_count = kwargs.get('word_count', 500)
        tone = kwargs.get('tone', 'professional')
        keywords = kwargs.get('keywords', [])
        
        keywords_str = ', '.join(keywords) if keywords else ''
        
        prompt = f"""لطفاً یک محتوای حرفه‌ای و سئو شده به زبان فارسی برای موضوع "{topic}" بنویسید.

ملاحظات:
- طول محتوا: حدود {word_count} کلمه
- سبک: {tone}
- محتوا باید برای SEO بهینه باشد
- استفاده از کلمات کلیدی: {keywords_str if keywords_str else 'طبیعی و مرتبط'}
- ساختار منطقی و خوانا
- محتوا باید شامل تگ‌های HTML <h2> و <h3> باشد

لطفاً پاسخ را به صورت JSON با فرمت زیر برگردانید:
{{
    "title": "عنوان اصلی (H1)",
    "meta_title": "عنوان متا برای SEO (50-60 کاراکتر)",
    "meta_description": "توضیحات متا برای SEO (150-160 کاراکتر)",
    "slug": "slug-url-friendly",
    "h1": "عنوان اصلی",
    "h2_list": ["عنوان H2 اول", "عنوان H2 دوم", ...],
    "h3_list": ["عنوان H3 اول", "عنوان H3 دوم", ...],
    "content": "<p>در دنیای امروز، [موضوع] یکی از مهم‌ترین عوامل موفقیت است. محتوای کامل باید با تگ‌های HTML باشد.</p>\\n\\n<h2>عنوان H2 اول</h2>\\n<p>محتوا مربوط به بخش اول که شامل کلمات کلیدی طبیعی است.</p>\\n\\n<h3>عنوان H3 اول</h3>\\n<p>محتوا مربوط به زیربخش H3 با جزئیات بیشتر.</p>\\n\\n<h2>عنوان H2 دوم</h2>\\n<p>محتوا مربوط به بخش دوم که بهینه شده برای SEO است.</p>",
    "keywords": ["کلمه کلیدی 1", "کلمه کلیدی 2", ...]
}}

مهم: حتماً تگ‌های <h2> و <h3> را در داخل فیلد "content" قرار دهید و مطمئن شوید که h2_list و h3_list با تگ‌های موجود در content مطابقت دارند."""
        
        url = f"{self.BASE_URL}/chat/completions"
        
        headers = self._get_headers()
        
        payload = {
            "model": self.content_model,
            "messages": [
                {
                    "role": "system",
                    "content": "شما یک متخصص SEO و نویسنده حرفه‌ای هستید. همیشه پاسخ را به صورت JSON معتبر برگردانید."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.7,
            "max_tokens": word_count * 3,  # More tokens for structured output
            "response_format": {"type": "json_object"}  # Force JSON output
        }
        
        try:
            response = await self.client.post(url, json=payload, headers=headers)
            response.raise_for_status()
            
            data = response.json()
            if 'choices' in data and len(data['choices']) > 0:
                content = data['choices'][0]['message']['content']
                
                # Parse JSON response
                try:
                    seo_data = json.loads(content)
                except json.JSONDecodeError:
                    # Try to extract JSON from markdown code blocks
                    json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', content, re.DOTALL)
                    if json_match:
                        seo_data = json.loads(json_match.group(1))
                    else:
                        raise Exception("پاسخ در فرمت JSON معتبر نیست")
                
                # Ensure all required fields
                if 'slug' not in seo_data or not seo_data['slug']:
                    seo_data['slug'] = slugify(seo_data.get('title', topic))
                
                return seo_data
            
            raise Exception("هیچ پاسخی دریافت نشد")
            
        except httpx.HTTPStatusError as e:
            status_code = e.response.status_code
            error_msg = "خطا در تولید محتوا"
            
            try:
                error_data = e.response.json()
                error_msg = error_data.get('error', {}).get('message', error_msg)
            except:
                pass
            
            if status_code == 429:
                raise Exception("خطای Groq API: تعداد درخواست‌ها زیاد است. لطفاً چند لحظه صبر کنید.")
            elif status_code == 401:
                raise Exception("خطای Groq API: API Key نامعتبر است.")
            elif status_code == 403:
                raise Exception("خطای Groq API: دسترسی به API محدود شده است.")
            
            raise Exception(f"خطای Groq API: {error_msg}")
        except json.JSONDecodeError as e:
            raise Exception(f"خطا در تجزیه پاسخ JSON: {str(e)}")
        except Exception as e:
            raise Exception(f"خطا در تولید محتوا: {str(e)}")
    
    # Chat method
    async def chat(self, message: str, conversation_history: Optional[List[Dict[str, str]]] = None, **kwargs) -> str:
        """Chat with Groq AI - supports conversation history"""
        url = f"{self.BASE_URL}/chat/completions"
        
        headers = self._get_headers()
        
        # Build messages array
        messages = []
        
        # Add system message (optional)
        system_message = kwargs.get('system_message', 'شما یک دستیار هوشمند و مفید هستید که به زبان فارسی پاسخ می‌دهید.')
        if system_message:
            messages.append({"role": "system", "content": system_message})
        
        # Add conversation history if provided
        if conversation_history:
            for msg in conversation_history:
                role = msg.get('role', 'user')
                content = msg.get('content', '')
                if role in ['user', 'assistant']:
                    messages.append({"role": role, "content": content})
        
        # Add current message
        messages.append({"role": "user", "content": message})
        
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
                reply = data['choices'][0]['message']['content']
                return reply.strip()
            
            raise Exception("هیچ پاسخی دریافت نشد")
            
        except httpx.HTTPStatusError as e:
            status_code = e.response.status_code
            error_msg = "خطا در چت"
            
            try:
                error_data = e.response.json()
                error_msg = error_data.get('error', {}).get('message', error_msg)
            except:
                pass
            
            if status_code == 429:
                raise Exception("خطای Groq API: تعداد درخواست‌ها زیاد است. لطفاً چند لحظه صبر کنید.")
            elif status_code == 401:
                raise Exception("خطای Groq API: API Key نامعتبر است.")
            elif status_code == 403:
                raise Exception("خطای Groq API: دسترسی به API محدود شده است.")
            
            raise Exception(f"خطای Groq API: {error_msg}")
        except Exception as e:
            raise Exception(f"خطا در چت: {str(e)}")

