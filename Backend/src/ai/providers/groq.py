from typing import Optional, Dict, Any, List
from io import BytesIO
import httpx
import json
import os
from django.core.cache import cache
from .base import BaseProvider
from src.ai.utils.cache import AICacheKeys
from src.ai.messages.messages import AI_ERRORS, AI_SYSTEM_MESSAGES, DEEPSEEK_SYSTEM_MESSAGES
from src.ai.prompts.content import get_content_prompt, get_seo_prompt
from src.ai.prompts.chat import get_chat_system_message
from src.ai.prompts.image import get_image_prompt, enhance_image_prompt, get_negative_prompt
from src.ai.prompts.audio import get_audio_prompt, calculate_word_count, estimate_duration

class GroqProvider(BaseProvider):
    
    BASE_URL = os.getenv('GROQ_API_BASE_URL', 'https://api.groq.com/openai/v1')
    
    def __init__(self, api_key: str, config: Optional[Dict[str, Any]] = None):
        super().__init__(api_key, config)
        selected_model = (config or {}).get('model') if config else None

        # Back-compat + service-driven behavior:
        # - New capability-based services pass the resolved model in `config['model']`.
        # - Existing configs may still provide capability-specific keys.
        self.chat_model = (
            config.get('chat_model')
            if config and config.get('chat_model')
            else selected_model or 'llama-3.1-8b-instant'
        )
        self.content_model = (
            config.get('content_model')
            if config and config.get('content_model')
            else selected_model or 'llama-3.1-8b-instant'
        )
    
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
        
        # دریافت prompt از ماژول prompts
        content_prompt_template = get_content_prompt(provider='groq')
        full_prompt = content_prompt_template.format(
            topic=prompt,
            word_count=word_count,
            tone=tone
        )
        
        payload = {
            "model": self.content_model,
            "messages": [
                {
                    "role": "system",
                    "content": DEEPSEEK_SYSTEM_MESSAGES['content_writer']
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
            
            raise Exception(AI_ERRORS["content_generation_failed"])
            
        except httpx.HTTPStatusError as e:
            status_code = e.response.status_code
            error_msg = AI_ERRORS["content_generation_failed"]
            
            try:
                error_data = e.response.json()
                error_msg = error_data.get('error', {}).get('message', error_msg)
            except:
                pass
            
            if status_code == 429:
                raise Exception(AI_ERRORS["generic_rate_limit"])
            elif status_code == 401:
                raise Exception(AI_ERRORS["generic_api_key_invalid"])
            elif status_code == 403:
                raise Exception(AI_ERRORS["provider_not_authorized"])
            
            raise Exception(AI_ERRORS["content_generation_failed"])
        except Exception as e:
            raise Exception(AI_ERRORS["content_generation_failed"])
    
    async def generate_seo_content(self, topic: str, **kwargs) -> Dict[str, Any]:
        
        word_count = kwargs.get('word_count', 500)
        tone = kwargs.get('tone', 'professional')
        keywords = kwargs.get('keywords', [])
        
        keywords_str = ', '.join(keywords) if keywords else ''
        
        prompt = self.SEO_PROMPT.format(
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
                    "content": DEEPSEEK_SYSTEM_MESSAGES['seo_expert']
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.7,
            "max_tokens": word_count * 3,
            "response_format": {"type": "json_object"}
        }
        
        try:
            response = await self.client.post(url, json=payload, headers=headers)
            response.raise_for_status()
            
            data = response.json()
            if 'choices' in data and len(data['choices']) > 0:
                content = data['choices'][0]['message']['content']
                
                try:
                    seo_data = json.loads(content)
                except json.JSONDecodeError:
                    json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', content, re.DOTALL)
                    if json_match:
                        seo_data = json.loads(json_match.group(1))
                    else:
                        raise Exception(AI_ERRORS["invalid_json"])
                
                if 'slug' not in seo_data or not seo_data['slug']:
                    seo_data['slug'] = slugify(seo_data.get('title', topic))
                
                return seo_data
            
            raise Exception(AI_ERRORS["content_generation_failed"])
            
        except httpx.HTTPStatusError as e:
            status_code = e.response.status_code
            error_msg = AI_ERRORS["content_generation_failed"]
            
            try:
                error_data = e.response.json()
                error_msg = error_data.get('error', {}).get('message', error_msg)
            except:
                pass
            
            if status_code == 429:
                raise Exception(AI_ERRORS["generic_rate_limit"])
            elif status_code == 401:
                raise Exception(AI_ERRORS["generic_api_key_invalid"])
            elif status_code == 403:
                raise Exception(AI_ERRORS["provider_not_authorized"])
            
            raise Exception(AI_ERRORS["content_generation_failed"])
        except json.JSONDecodeError as e:
            raise Exception(AI_ERRORS["invalid_json"])
        except Exception as e:
            raise Exception(AI_ERRORS["content_generation_failed"])
    
    async def chat(self, message: str, conversation_history: Optional[List[Dict[str, str]]] = None, **kwargs) -> str:
        url = f"{self.BASE_URL}/chat/completions"
        
        headers = self._get_headers()
        
        messages = []
        
        system_message = kwargs.get('system_message', AI_SYSTEM_MESSAGES['default_chat'])
        if system_message:
            messages.append({"role": "system", "content": system_message})
        
        if conversation_history:
            for msg in conversation_history:
                role = msg.get('role', 'user')
                content = msg.get('content', '')
                if role in ['user', 'assistant']:
                    messages.append({"role": role, "content": content})
        
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
            
            raise Exception(AI_ERRORS["chat_failed"])
            
        except httpx.HTTPStatusError as e:
            status_code = e.response.status_code
            error_msg = AI_ERRORS["chat_failed"]
            
            try:
                error_data = e.response.json()
                error_msg = error_data.get('error', {}).get('message', error_msg)
            except:
                pass
            
            if status_code == 429:
                raise Exception(AI_ERRORS["generic_rate_limit"])
            elif status_code == 401:
                raise Exception(AI_ERRORS["generic_api_key_invalid"])
            elif status_code == 403:
                raise Exception(AI_ERRORS["provider_not_authorized"])
            
            raise Exception(AI_ERRORS["chat_failed"])
        except Exception as e:
            raise Exception(AI_ERRORS["chat_failed"])

