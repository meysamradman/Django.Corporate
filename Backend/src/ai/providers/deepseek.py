from typing import Optional, Dict, Any
from io import BytesIO
import httpx
import json
import os
import re
from django.utils.text import slugify
from .base import BaseProvider
from src.ai.messages.messages import DEEPSEEK_PROMPTS, DEEPSEEK_ERRORS, DEEPSEEK_SYSTEM_MESSAGES, AI_SYSTEM_MESSAGES

class DeepSeekProvider(BaseProvider):
    
    BASE_URL = os.getenv('DEEPSEEK_API_BASE_URL', 'https://api.deepseek.com/v1')
    
    def __init__(self, api_key: str, config: Optional[Dict[str, Any]] = None):
        super().__init__(api_key, config)
        self.chat_model = config.get('chat_model', 'deepseek-chat') if config else 'deepseek-chat'
        self.content_model = config.get('content_model', 'deepseek-chat') if config else 'deepseek-chat'
    
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
        
        full_prompt = DEEPSEEK_PROMPTS['content_generation'].format(
            topic=prompt,
            word_count=word_count,
            tone=tone
        )
        
        payload = {
            "model": self.content_model,
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
            
            raise Exception(DEEPSEEK_ERRORS['no_response_received'])
            
        except httpx.HTTPStatusError as e:
            status_code = e.response.status_code
            try:
                error_data = e.response.json()
                error_msg = error_data.get('error', {}).get('message', '')
                
                if status_code == 429:
                    raise Exception(DEEPSEEK_ERRORS['rate_limit'])
                elif status_code == 401:
                    raise Exception(DEEPSEEK_ERRORS['invalid_api_key'])
                elif status_code == 403:
                    raise Exception(DEEPSEEK_ERRORS['api_access_denied'])
                
                raise Exception(DEEPSEEK_ERRORS['api_error'].format(error_msg=error_msg))
            except Exception as ex:
                if 'DeepSeek API error' in str(ex):
                    raise ex
                if status_code == 429:
                    raise Exception(DEEPSEEK_ERRORS['rate_limit_with_info'])
                raise Exception(DEEPSEEK_ERRORS['http_error'].format(status_code=status_code))
        except Exception as e:
            raise Exception(DEEPSEEK_ERRORS['content_generation_failed'].format(error=str(e)))
    
    async def generate_seo_content(self, topic: str, **kwargs) -> Dict[str, Any]:
        word_count = kwargs.get('word_count', 500)
        tone = kwargs.get('tone', 'professional')
        keywords = kwargs.get('keywords', [])
        
        keywords_str = ', '.join(keywords) if keywords else ''
        
        prompt = DEEPSEEK_PROMPTS['seo_content_generation'].format(
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
        
        payload = {
            "model": self.content_model,
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
                        raise Exception(DEEPSEEK_ERRORS['json_parse_error'].format(error="Invalid JSON format"))
                
                if 'slug' not in seo_data or not seo_data['slug']:
                    seo_data['slug'] = slugify(seo_data.get('title', topic))
                
                return seo_data
            
            raise Exception(DEEPSEEK_ERRORS['no_response_received'])
            
        except httpx.HTTPStatusError as e:
            status_code = e.response.status_code
            try:
                error_data = e.response.json()
                error_msg = error_data.get('error', {}).get('message', '')
                
                if status_code == 429:
                    raise Exception(DEEPSEEK_ERRORS['rate_limit_with_info'])
                elif status_code == 401:
                    raise Exception(DEEPSEEK_ERRORS['invalid_api_key'])
                elif status_code == 403:
                    raise Exception(DEEPSEEK_ERRORS['api_access_denied'])
                
                raise Exception(DEEPSEEK_ERRORS['api_error'].format(error_msg=error_msg))
            except Exception as ex:
                if 'DeepSeek API error' in str(ex):
                    raise ex
                if status_code == 429:
                    raise Exception(DEEPSEEK_ERRORS['rate_limit_error'])
                raise Exception(DEEPSEEK_ERRORS['http_error'].format(status_code=status_code))
        except json.JSONDecodeError as e:
            raise Exception(DEEPSEEK_ERRORS['json_parse_error'].format(error=str(e)))
        except Exception as e:
            raise Exception(DEEPSEEK_ERRORS['content_generation_failed'].format(error=str(e)))
    
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
            
            raise Exception(DEEPSEEK_ERRORS['no_response_received'])
            
        except httpx.HTTPStatusError as e:
            status_code = e.response.status_code
            try:
                error_data = e.response.json()
                error_msg = error_data.get('error', {}).get('message', '')
                
                if status_code == 429:
                    raise Exception(DEEPSEEK_ERRORS['rate_limit_with_info'])
                elif status_code == 401:
                    raise Exception(DEEPSEEK_ERRORS['invalid_api_key'])
                elif status_code == 403:
                    raise Exception(DEEPSEEK_ERRORS['api_access_denied'])
                
                raise Exception(DEEPSEEK_ERRORS['api_error'].format(error_msg=error_msg))
            except Exception as ex:
                if 'DeepSeek API error' in str(ex):
                    raise ex
                if status_code == 429:
                    raise Exception(DEEPSEEK_ERRORS['rate_limit_or_error'])
                raise Exception(DEEPSEEK_ERRORS['http_error'].format(status_code=status_code))
        except Exception as e:
            raise Exception(DEEPSEEK_ERRORS['chat_error'].format(error=str(e)))
    
    def validate_api_key(self) -> bool:
        try:
            url = f"{self.BASE_URL}/models"
            headers = {"Authorization": f"Bearer {self.api_key}"}
            
            with httpx.Client(timeout=10.0) as client:
                response = client.get(url, headers=headers)
                return response.status_code == 200
        except:
            return False

