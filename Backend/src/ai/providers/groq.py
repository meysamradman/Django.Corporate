from typing import Optional, Dict, Any, List
from io import BytesIO
import httpx
import json
import os
from .base import BaseProvider
from src.ai.utils.cache import AICacheKeys
from src.ai.messages.messages import GROQ_ERRORS, GROQ_PROMPTS


class GroqProvider(BaseProvider):
    
    BASE_URL = os.getenv('GROQ_API_BASE_URL', 'https://api.groq.com/openai/v1')
    
    def __init__(self, api_key: str, config: Optional[Dict[str, Any]] = None):
        super().__init__(api_key, config)
        self.chat_model = config.get('chat_model', 'llama-3.1-8b-instant') if config else 'llama-3.1-8b-instant'
        self.content_model = config.get('content_model', 'llama-3.1-8b-instant') if config else 'llama-3.1-8b-instant'
    
    def get_provider_name(self) -> str:
        return 'groq'
    
    def _get_headers(self) -> Dict[str, str]:
        if not self.api_key:
            raise ValueError("API key is required for Groq")
        
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
    
    def validate_api_key(self) -> bool:
        try:
            if not self.api_key or not self.api_key.strip():
                return False
            
            url = f"{self.BASE_URL}/models"
            headers = self._get_headers()
            
            with httpx.Client(timeout=5.0) as client:
                response = client.get(url, headers=headers)
                return response.status_code == 200
        except Exception:
            return False
    
    @classmethod
    def get_available_models(cls, api_key: Optional[str] = None, use_cache: bool = True) -> List[Dict[str, Any]]:
        from django.core.cache import cache
        
        cache_key = AICacheKeys.provider_models('groq', None)
        
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
                        
                        if model.get('object') == 'model':
                            models.append({
                                'id': model_id,
                                'name': model_name,
                                'description': model.get('description', ''),
                                'context_length': model.get('context_length', 0),
                                'pricing': model.get('pricing', {}),
                            })
                
                models.sort(key=lambda x: x['context_length'], reverse=True)
                
                if use_cache:
                    cache.set(cache_key, models, 6 * 60 * 60)
                
                return models
        except httpx.HTTPStatusError as e:
            if e.response.status_code in [401, 403]:
                return cls._get_default_models()
            else:
                return cls._get_default_models()
        except Exception:
            return cls._get_default_models()
    
    @staticmethod
    def _get_default_models() -> List[Dict[str, Any]]:
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
    
    async def generate_image(self, prompt: str, **kwargs) -> BytesIO:
        raise NotImplementedError("Groq does not support image generation")
    
    async def generate_content(self, prompt: str, **kwargs) -> str:
        url = f"{self.BASE_URL}/chat/completions"
        
        headers = self._get_headers()
        
        word_count = kwargs.get('word_count', 500)
        tone = kwargs.get('tone', 'professional')
        
        full_prompt = f"""Please write a professional and SEO-optimized content in Persian (Farsi) language.

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
            
            raise Exception(GROQ_ERRORS["no_response_received"])
            
        except httpx.HTTPStatusError as e:
            status_code = e.response.status_code
            error_msg = GROQ_ERRORS["content_generation_error"]
            
            try:
                error_data = e.response.json()
                error_msg = error_data.get('error', {}).get('message', error_msg)
            except:
                pass
            
            if status_code == 429:
                raise Exception(GROQ_ERRORS["rate_limit"])
            elif status_code == 401:
                raise Exception(GROQ_ERRORS["invalid_api_key"])
            elif status_code == 403:
                raise Exception(GROQ_ERRORS["api_access_denied"])
            
            raise Exception(GROQ_ERRORS["api_error"].format(error_msg=error_msg))
        except Exception as e:
            raise Exception(GROQ_ERRORS["content_generation_failed"].format(error=str(e)))
    
    async def generate_seo_content(self, topic: str, **kwargs) -> Dict[str, Any]:
        import re
        from django.utils.text import slugify
        
        word_count = kwargs.get('word_count', 500)
        tone = kwargs.get('tone', 'professional')
        keywords = kwargs.get('keywords', [])
        
        keywords_str = ', '.join(keywords) if keywords else 'طبیعی و مرتبط'
        
        prompt = GROQ_PROMPTS["seo_content_generation"].format(
            topic=topic,
            word_count=word_count,
            tone=tone,
            keywords_str=keywords_str
        )
        
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
            
            raise Exception(GROQ_ERRORS["no_response_received"])
            
        except httpx.HTTPStatusError as e:
            status_code = e.response.status_code
            error_msg = GROQ_ERRORS["content_generation_error"]
            
            try:
                error_data = e.response.json()
                error_msg = error_data.get('error', {}).get('message', error_msg)
            except:
                pass
            
            if status_code == 429:
                raise Exception(GROQ_ERRORS["rate_limit"])
            elif status_code == 401:
                raise Exception(GROQ_ERRORS["invalid_api_key"])
            elif status_code == 403:
                raise Exception(GROQ_ERRORS["api_access_denied"])
            
            raise Exception(GROQ_ERRORS["api_error"].format(error_msg=error_msg))
        except json.JSONDecodeError as e:
            raise Exception(GROQ_ERRORS["json_parse_error"].format(error=str(e)))
        except Exception as e:
            raise Exception(GROQ_ERRORS["content_generation_failed"].format(error=str(e)))
    
    # Chat method
    async def chat(self, message: str, conversation_history: Optional[List[Dict[str, str]]] = None, **kwargs) -> str:
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
            
            raise Exception(GROQ_ERRORS["no_response_received"])
            
        except httpx.HTTPStatusError as e:
            status_code = e.response.status_code
            error_msg = GROQ_ERRORS["chat_error"].format(error="")
            
            try:
                error_data = e.response.json()
                error_msg = error_data.get('error', {}).get('message', error_msg)
            except:
                pass
            
            if status_code == 429:
                raise Exception(GROQ_ERRORS["rate_limit"])
            elif status_code == 401:
                raise Exception(GROQ_ERRORS["invalid_api_key"])
            elif status_code == 403:
                raise Exception(GROQ_ERRORS["api_access_denied"])
            
            raise Exception(GROQ_ERRORS["api_error"].format(error_msg=error_msg))
        except Exception as e:
            raise Exception(GROQ_ERRORS["chat_error"].format(error=str(e)))

