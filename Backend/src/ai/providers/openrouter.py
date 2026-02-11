from typing import Optional, Dict, Any, List
from io import BytesIO
import httpx
import os
import json
import base64
import re
from unidecode import unidecode
from django.core.cache import cache
from .base import BaseProvider
from src.ai.messages.messages import AI_ERRORS, IMAGE_ERRORS, CONTENT_ERRORS, CHAT_ERRORS
from src.ai.utils.cache import AICacheKeys, AICacheManager

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

        selected_model = (config or {}).get('model') if config else None

        # Back-compat + service-driven behavior:
        # - New capability-based services pass the resolved model in `config['model']`.
        # - Existing configs may still provide capability-specific keys.
        self.chat_model = (
            config.get('chat_model')
            if config and config.get('chat_model')
            else selected_model or 'google/gemini-2.5-flash'
        )
        self.content_model = (
            config.get('content_model')
            if config and config.get('content_model')
            else selected_model or 'google/gemini-2.5-flash'
        )
        self.image_model = (
            config.get('image_model')
            if config and config.get('image_model')
            else selected_model or 'openai/dall-e-3'
        )

        self.http_referer = config.get('http_referer', '') if config else ''
        self.x_title = config.get('x_title', 'Corporate Admin Panel') if config else 'Corporate Admin Panel'
    
    def get_provider_name(self) -> str:
        return 'openrouter'
    
    def _get_headers(self, extra_headers: Optional[Dict[str, str]] = None) -> Dict[str, str]:
        if not self.api_key:
            raise ValueError("API key is required for OpenRouter")
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        
        if self.http_referer:
            headers["HTTP-Referer"] = self.http_referer
        else:
            headers["HTTP-Referer"] = "https://localhost:3000"
        
        if self.x_title:
            headers["X-Title"] = self.x_title
        
        if extra_headers:
            headers.update(extra_headers)
        
        return headers
    
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
    def get_available_models(cls, api_key: Optional[str] = None, provider_filter: Optional[str] = None, use_cache: bool = True) -> List[Dict[str, Any]]:
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
        
        url = f"{self.BASE_URL}/chat/completions"
        
        headers = self._get_headers()
        
        size = kwargs.get('size', '1024x1024')
        quality = kwargs.get('quality', 'standard')
        
        model_id = self.image_model
        
        payload = {
            "model": model_id,
            "messages": [
                {
                    "role": "user",
                    "content": f"Generate an image: {prompt}"
                }
            ],
            "max_tokens": 1000,
        }
        
        try:
            response = await self.client.post(url, json=payload, headers=headers)
            response.raise_for_status()
            
            data = response.json()
            
            if 'choices' in data and len(data['choices']) > 0:
                content = data['choices'][0]['message']['content']
                
                url_pattern = r'https?://[^\s]+'
                urls = re.findall(url_pattern, content)
                
                if urls:
                    image_url = urls[0]
                    return await self.download_image(image_url)
                else:
                    raise Exception(IMAGE_ERRORS["model_no_image_capability"])
            
            raise Exception(IMAGE_ERRORS["image_generation_failed"])
            
        except httpx.HTTPStatusError as e:
            error_msg = IMAGE_ERRORS["image_generation_failed"]
            try:
                error_data = e.response.json()
                if 'error' in error_data:
                    error_msg = error_data['error'].get('message', error_msg)
            except:
                pass
            raise Exception(IMAGE_ERRORS["image_generation_failed"].format(error=f"{error_msg}: {str(e)}"))
        except Exception as e:
            raise Exception(IMAGE_ERRORS["image_generation_failed"].format(error=str(e)))
    
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
            
        except httpx.HTTPStatusError as e:
            error_msg = CONTENT_ERRORS["content_generation_failed"]
            try:
                error_data = e.response.json()
                if 'error' in error_data:
                    error_msg = error_data['error'].get('message', error_msg)
            except:
                pass
            raise Exception(CONTENT_ERRORS["content_generation_failed"].format(error=f"{error_msg}: {str(e)}"))
        except Exception as e:
            raise Exception(CONTENT_ERRORS["content_generation_failed"].format(error=str(e)))
    
    async def generate_seo_content(self, topic: str, **kwargs) -> Dict[str, Any]:
        word_count = kwargs.get('word_count', 500)
        tone = kwargs.get('tone', 'professional')
        keywords = kwargs.get('keywords', [])
        
        keywords_str = ", ".join(keywords) if keywords else ""
        seo_prompt = f

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
                
                try:
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
                    slug = re.sub(r'[^a-z0-9]+', '-', unidecode(topic).lower()).strip('-')
                    
                    return {
                        "title": topic,
                        "meta_title": topic[:60],
                        "meta_description": f"AI-generated content about {topic}"[:160],
                        "h1": topic,
                        "content": f"<p>{content_str[:500]}</p>",
                        "keywords": [topic],
                        "word_count": len(content_str.split()),
                        "slug": slug
                    }

            raise Exception(CONTENT_ERRORS["content_generation_failed"])
            
        except json.JSONDecodeError as e:
            raise Exception(CONTENT_ERRORS["content_generation_failed"])
        except httpx.HTTPStatusError as e:
            error_msg = CONTENT_ERRORS["content_generation_failed"]
            try:
                error_data = e.response.json()
                if 'error' in error_data:
                    error_msg = error_data['error'].get('message', error_msg)
            except:
                pass
            raise Exception(CONTENT_ERRORS["content_generation_failed"].format(error=f"{error_msg}: {str(e)}"))
        except Exception as e:
            raise Exception(CONTENT_ERRORS["content_generation_failed"].format(error=str(e)))
    
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
            
        except httpx.HTTPStatusError as e:
            status_code = e.response.status_code
            error_msg = CHAT_ERRORS["chat_failed"]
            
            try:
                error_data = e.response.json()
                if 'error' in error_data:
                    error_msg = error_data['error'].get('message', error_msg)
            except:
                pass
            
            if status_code == 401:
                if 'User not found' in error_msg or 'Unauthorized' in str(e):
                    raise Exception(
                        CHAT_ERRORS["chat_failed"].format(error="Invalid API key")
                    )
                else:
                    raise Exception(
                        CHAT_ERRORS["chat_failed"].format(error=error_msg)
                    )
            elif status_code == 429:
                if 'quota' in error_msg.lower() or 'billing' in error_msg.lower():
                    raise Exception(
                        CHAT_ERRORS["chat_quota_exceeded"]
                    )
                else:
                    raise Exception(CHAT_ERRORS["chat_rate_limit"])
            elif status_code == 403:
                raise Exception(CHAT_ERRORS["chat_forbidden"])
            
            raise Exception(CHAT_ERRORS["chat_failed"].format(error=f"{error_msg}: {str(e)}"))
        except Exception as e:
            raise Exception(CHAT_ERRORS["chat_failed"].format(error=str(e)))

