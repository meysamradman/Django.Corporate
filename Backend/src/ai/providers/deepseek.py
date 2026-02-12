from typing import Optional, Dict, Any
from io import BytesIO
import httpx
import json
import os
import re
from django.utils.text import slugify
from .base import BaseProvider
from src.ai.messages.messages import AI_ERRORS, DEEPSEEK_SYSTEM_MESSAGES, AI_SYSTEM_MESSAGES
from src.ai.prompts.content import get_content_prompt, get_seo_prompt
from src.ai.prompts.chat import get_chat_system_message
from src.ai.prompts.image import get_image_prompt, enhance_image_prompt, get_negative_prompt
from src.ai.prompts.audio import get_audio_prompt, calculate_word_count, estimate_duration

class DeepSeekProvider(BaseProvider):
    
    BASE_URL = os.getenv('DEEPSEEK_API_BASE_URL', 'https://api.deepseek.com/v1')
    
    def __init__(self, api_key: str, config: Optional[Dict[str, Any]] = None):
        super().__init__(api_key, config)
        # Product rule: services set config['model'] based on capability defaults.
        # Keep backward compatibility with older config keys.
        model_override = (config or {}).get('model')
        self.chat_model = (config or {}).get('chat_model') or model_override or 'deepseek-chat'
        self.content_model = (config or {}).get('content_model') or model_override or 'deepseek-chat'
    
    def get_provider_name(self) -> str:
        return 'deepseek'
    
    async def generate_image(self, prompt: str, **kwargs) -> BytesIO:
        raise NotImplementedError("DeepSeek does not support image generation")
    
    async def generate_content(self, prompt: str, **kwargs) -> str:
        url = f"{self.BASE_URL}/chat/completions"
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        
        word_count = kwargs.get('word_count', 500)
        tone = kwargs.get('tone', 'professional')
        
        # دریافت prompt از ماژول prompts
        content_prompt_template = get_content_prompt(provider='deepseek')
        full_prompt = content_prompt_template.format(
            topic=prompt,
            word_count=word_count,
            tone=tone
        )
        
        model_to_use = self.config.get('model') or kwargs.get('model') or self.content_model

        payload = {
            "model": model_to_use,
            "messages": [
                {"role": "system", "content": DEEPSEEK_SYSTEM_MESSAGES['content_writer']},
                {"role": "user", "content": full_prompt}
            ],
            "temperature": 0.7,
            "max_tokens": word_count * 2,
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
            try:
                error_data = e.response.json()
                error_msg = error_data.get('error', {}).get('message', '')
                
                if status_code == 429:
                    raise Exception(AI_ERRORS["generic_rate_limit"])
                elif status_code == 401:
                    raise Exception(AI_ERRORS["generic_api_key_invalid"])
                elif status_code == 403:
                    raise Exception(AI_ERRORS["provider_not_authorized"])
                
                raise Exception(AI_ERRORS["content_generation_failed"])
            except Exception as ex:
                if status_code == 429:
                    raise Exception(AI_ERRORS["generic_rate_limit"])
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
            keywords_str=f"\n- Keywords: {keywords_str}" if keywords_str else ""
        )
        
        url = f"{self.BASE_URL}/chat/completions"
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        
        model_to_use = self.config.get('model') or kwargs.get('model') or self.content_model

        payload = {
            "model": model_to_use,
            "messages": [
                {"role": "system", "content": DEEPSEEK_SYSTEM_MESSAGES['seo_expert']},
                {"role": "user", "content": prompt}
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
            try:
                error_data = e.response.json()
                error_msg = error_data.get('error', {}).get('message', '')
                
                if status_code == 429:
                    raise Exception(AI_ERRORS["generic_rate_limit"])
                elif status_code == 401:
                    raise Exception(AI_ERRORS["generic_api_key_invalid"])
                elif status_code == 403:
                    raise Exception(AI_ERRORS["provider_not_authorized"])
                
                raise Exception(AI_ERRORS["content_generation_failed"])
            except Exception as ex:
                if status_code == 429:
                    raise Exception(AI_ERRORS["generic_rate_limit"])
                raise Exception(AI_ERRORS["content_generation_failed"])
        except json.JSONDecodeError as e:
            raise Exception(AI_ERRORS["invalid_json"])
        except Exception as e:
            raise Exception(AI_ERRORS["content_generation_failed"])
    
    async def chat(self, message: str, conversation_history: Optional[list] = None, **kwargs) -> str:
        url = f"{self.BASE_URL}/chat/completions"
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        
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
        
        model_to_use = self.config.get('model') or kwargs.get('model') or self.chat_model

        payload = {
            "model": model_to_use,
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
            try:
                error_data = e.response.json()
                error_msg = error_data.get('error', {}).get('message', '')
                
                if status_code == 429:
                    raise Exception(AI_ERRORS["generic_rate_limit"])
                elif status_code == 401:
                    raise Exception(AI_ERRORS["generic_api_key_invalid"])
                elif status_code == 403:
                    raise Exception(AI_ERRORS["provider_not_authorized"])
                
                raise Exception(AI_ERRORS["chat_failed"])
            except Exception as ex:
                if status_code == 429:
                    raise Exception(AI_ERRORS["generic_rate_limit"])
                raise Exception(AI_ERRORS["chat_failed"])
        except Exception as e:
            raise Exception(AI_ERRORS["chat_failed"])
    
    def validate_api_key(self) -> bool:
        try:
            url = f"{self.BASE_URL}/models"
            headers = {"Authorization": f"Bearer {self.api_key}"}
            
            with httpx.Client(timeout=10.0) as client:
                response = client.get(url, headers=headers)
                return response.status_code == 200
        except:
            return False

