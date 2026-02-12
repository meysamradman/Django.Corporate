from typing import Optional, Dict, Any
from io import BytesIO
import httpx
import base64
import os
import json
import re
from .base import BaseProvider
from src.ai.messages.messages import AI_ERRORS, AI_SYSTEM_MESSAGES
from src.ai.prompts.content import get_content_prompt, get_seo_prompt
from src.ai.prompts.chat import get_chat_system_message
from src.ai.prompts.image import get_image_prompt, enhance_image_prompt, get_negative_prompt
from src.ai.prompts.audio import get_audio_prompt, calculate_word_count, estimate_duration

class OpenAIProvider(BaseProvider):
    
    BASE_URL = os.getenv('OPENAI_API_BASE_URL', 'https://api.openai.com/v1')
    
    def __init__(self, api_key: str, config: Optional[Dict[str, Any]] = None):
        super().__init__(api_key, config)
        self.image_model = config.get('image_model', 'dall-e-3') if config else 'dall-e-3'
        self.content_model = config.get('content_model', 'gpt-4o-mini') if config else 'gpt-4o-mini'
    
    def get_provider_name(self) -> str:
        return 'openai'
    
    async def generate_image(self, prompt: str, **kwargs) -> BytesIO:
        # Use model from config or kwargs, fall back to image_model
        model_to_use = self.config.get('model') or kwargs.get('model') or self.image_model
        url = f"{self.BASE_URL}/images/generations"
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        
        size = kwargs.get('size', '1024x1024')
        quality = kwargs.get('quality', 'standard')
        style = kwargs.get('style', 'realistic')
        n = kwargs.get('n', 1)
        
        # Use centralized image prompt enhancement from prompts module
        # For DALL-E, enhance based on quality level
        enhanced_prompt = enhance_image_prompt(prompt, style=style, add_quality=(quality == 'hd'))
        
        payload = {
            "model": model_to_use,
            "prompt": enhanced_prompt,
            "n": min(n, 1) if model_to_use == 'dall-e-3' else min(n, 10),
            "size": size,
            "quality": quality,
            "response_format": "url"
        }
        
        try:
            response = await self.client.post(url, json=payload, headers=headers)
            response.raise_for_status()
            
            data = response.json()
            
            if 'data' in data and len(data['data']) > 0:
                image_url = data['data'][0].get('url')
                if image_url:
                    return await self.download_image(image_url)
            
            if 'data' in data and len(data['data']) > 0:
                image_b64 = data['data'][0].get('b64_json')
                if image_b64:
                    return BytesIO(base64.b64decode(image_b64))
            
            raise Exception(AI_ERRORS["image_generation_failed"])
            
        except httpx.HTTPStatusError as e:
            error_msg = AI_ERRORS["image_generation_http_error"]
            try:
                error_data = e.response.json()
                error_detail = error_data.get('error', {}).get('message', '')
                
                if 'billing' in error_detail.lower() or 'limit' in error_detail.lower() or 'hard limit' in error_detail.lower():
                    error_msg = AI_ERRORS["image_quota_exceeded"]
                else:
                    error_msg = AI_ERRORS["image_generation_http_error"]
            except:
                error_msg = AI_ERRORS["image_generation_http_error"]
            raise Exception(error_msg)
        except Exception as e:
            raise Exception(AI_ERRORS["image_generation_failed"])
    
    async def generate_content(self, prompt: str, **kwargs) -> str:
        # Use model from config or kwargs, fall back to content_model
        model_to_use = self.config.get('model') or kwargs.get('model') or self.content_model
        url = f"{self.BASE_URL}/chat/completions"
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        
        word_count = kwargs.get('word_count', 500)
        tone = kwargs.get('tone', 'professional')
        
        # دریافت prompt از ماژول prompts
        content_prompt_template = get_content_prompt(provider='openai')
        full_prompt = content_prompt_template.format(
            topic=prompt,
            word_count=word_count,
            tone=tone
        )
        
        payload = {
            "model": model_to_use,
            "messages": [
                {"role": "system", "content": "You are an expert SEO content writer writing in Persian (Farsi)."},
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
            try:
                error_data = e.response.json()
                error_msg = error_data.get('error', {}).get('message', '')
                raise Exception(AI_ERRORS["content_generation_failed"])
            except:
                raise Exception(AI_ERRORS["content_generation_failed"])
        except Exception as e:
            raise Exception(AI_ERRORS["content_generation_failed"])
    
    async def generate_seo_content(self, topic: str, **kwargs) -> Dict[str, Any]:
        word_count = kwargs.get('word_count', 500)
        tone = kwargs.get('tone', 'professional')
        keywords = kwargs.get('keywords', [])
        
        keywords_str = f", {', '.join(keywords)}" if keywords else ""
        
        # دریافت prompt از ماژول prompts
        seo_prompt_template = get_seo_prompt(provider='openai')
        seo_prompt = seo_prompt_template.format(
            topic=topic,
            keywords_str=keywords_str,
            word_count=word_count
        )
        
        url = f"{self.BASE_URL}/chat/completions"
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        
        payload = {
            "model": self.content_model,
            "messages": [
                {"role": "system", "content": "You are an expert SEO content writer. Always respond with valid JSON only, no additional text."},
                {"role": "user", "content": seo_prompt}
            ],
            "temperature": 0.7,
            "max_tokens": 4000,
            "response_format": {"type": "json_object"}
        }
        
        try:
            response = await self.client.post(url, json=payload, headers=headers)
            response.raise_for_status()
            
            data = response.json()
            if 'choices' in data and len(data['choices']) > 0:
                content_text = data['choices'][0]['message']['content']
                
                try:
                    seo_data = json.loads(content_text)
                    return seo_data
                except json.JSONDecodeError:
                    json_match = re.search(r'\{.*\}', content_text, re.DOTALL)
                    if json_match:
                        seo_data = json.loads(json_match.group())
                        return seo_data
                    raise Exception(AI_ERRORS["invalid_json"])
            
            raise Exception(AI_ERRORS["content_generation_failed"])
            
        except httpx.HTTPStatusError as e:
            status_code = e.response.status_code
            try:
                error_data = e.response.json()
                error_msg = error_data.get('error', {}).get('message', '')
                
                if status_code == 429:
                    if 'quota' in error_msg.lower() or 'billing' in error_msg.lower():
                        raise Exception(AI_ERRORS["generic_quota_exceeded"])
                    else:
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
            else:
                base64_image = "" # Handle error or fallback

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
        
        payload = {
            "model": kwargs.get('model', self.content_model),
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
                    if 'quota' in error_msg.lower() or 'billing' in error_msg.lower():
                        raise Exception(AI_ERRORS["generic_quota_exceeded"])
                    else:
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
    
    async def text_to_speech(self, text: str, **kwargs) -> BytesIO:
        url = f"{self.BASE_URL}/audio/speech"
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        
        model = kwargs.get('model', 'tts-1')
        voice = kwargs.get('voice', 'alloy')
        response_format = kwargs.get('response_format', 'mp3')
        speed = kwargs.get('speed', 1.0)
        
        payload = {
            "model": model,
            "input": text,
            "voice": voice,
            "response_format": response_format,
            "speed": speed,
        }
        
        try:
            response = await self.client.post(url, json=payload, headers=headers)
            response.raise_for_status()
            
            return BytesIO(response.content)
            
        except httpx.HTTPStatusError as e:
            status_code = e.response.status_code
            try:
                error_data = e.response.json()
                error_msg = error_data.get('error', {}).get('message', '')
                
                if status_code == 429:
                    if 'quota' in error_msg.lower() or 'billing' in error_msg.lower():
                        raise Exception(AI_ERRORS["generic_quota_exceeded"])
                    else:
                        raise Exception(AI_ERRORS["generic_rate_limit"])
                elif status_code == 401:
                    raise Exception(AI_ERRORS["generic_api_key_invalid"])
                elif status_code == 403:
                    raise Exception(AI_ERRORS["provider_not_authorized"])
                
                raise Exception(AI_ERRORS["audio_generation_failed"])
            except Exception as ex:
                if status_code == 429:
                    raise Exception(AI_ERRORS["generic_rate_limit"])
                raise Exception(AI_ERRORS["audio_generation_failed"])
        except Exception as e:
            raise Exception(AI_ERRORS["audio_generation_failed"])
    
    def validate_api_key(self) -> bool:
        try:
            url = f"{self.BASE_URL}/models"
            headers = {"Authorization": f"Bearer {self.api_key}"}
            
            with httpx.Client(timeout=10.0) as client:
                response = client.get(url, headers=headers)
                return response.status_code == 200
        except:
            return False

