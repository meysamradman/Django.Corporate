from typing import Optional, Dict, Any
from io import BytesIO
import httpx
import base64
import os
import json
import re
from .base import BaseProvider
from src.ai.messages.messages import AI_ERRORS, AI_SYSTEM_MESSAGES, OPENAI_ERRORS, OPENAI_PROMPTS

class OpenAIProvider(BaseProvider):
    
    BASE_URL = os.getenv('OPENAI_API_BASE_URL', 'https://api.openai.com/v1')
    
    def __init__(self, api_key: str, config: Optional[Dict[str, Any]] = None):
        super().__init__(api_key, config)
        self.image_model = config.get('image_model', 'dall-e-3') if config else 'dall-e-3'
        self.content_model = config.get('content_model', 'gpt-4o-mini') if config else 'gpt-4o-mini'
    
    def get_provider_name(self) -> str:
        return 'openai'
    
    async def generate_image(self, prompt: str, **kwargs) -> BytesIO:
        url = f"{self.BASE_URL}/images/generations"
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        
        size = kwargs.get('size', '1024x1024')
        quality = kwargs.get('quality', 'standard')
        n = kwargs.get('n', 1)
        
        payload = {
            "model": self.image_model,
            "prompt": prompt,
            "n": min(n, 1) if self.image_model == 'dall-e-3' else min(n, 10),
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
            
            raise Exception(AI_ERRORS["openai_invalid_response"])
            
        except httpx.HTTPStatusError as e:
            error_msg = AI_ERRORS["image_generation_http_error"].format(
                status_code=e.response.status_code,
                detail=""
            )
            try:
                error_data = e.response.json()
                error_detail = error_data.get('error', {}).get('message', '')
                
                if 'billing' in error_detail.lower() or 'limit' in error_detail.lower() or 'hard limit' in error_detail.lower():
                    error_msg = AI_ERRORS["openai_billing_limit"]
                else:
                    error_msg = AI_ERRORS["image_generation_http_error"].format(
                        status_code=e.response.status_code,
                        detail=error_detail if error_detail else str(e.response.text)
                    )
            except:
                error_msg = AI_ERRORS["image_generation_http_error"].format(
                    status_code=e.response.status_code,
                    detail=str(e.response.text)
                )
            raise Exception(error_msg)
        except Exception as e:
            raise Exception(AI_ERRORS["image_generation_failed"].format(error=str(e)))
    
    async def generate_content(self, prompt: str, **kwargs) -> str:
        url = f"{self.BASE_URL}/chat/completions"
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        
        word_count = kwargs.get('word_count', 500)
        tone = kwargs.get('tone', 'professional')
        
        full_prompt = f
        
        payload = {
            "model": self.content_model,
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
            
            raise Exception(OPENAI_ERRORS['no_content_generated'])
            
        except httpx.HTTPStatusError as e:
            try:
                error_data = e.response.json()
                error_msg = error_data.get('error', {}).get('message', '')
                raise Exception(OPENAI_ERRORS['api_error'].format(error_msg=error_msg))
            except:
                raise Exception(OPENAI_ERRORS['http_error'].format(status_code=e.response.status_code))
        except Exception as e:
            raise Exception(OPENAI_ERRORS['content_generation_failed'].format(error=str(e)))
    
    async def generate_seo_content(self, topic: str, **kwargs) -> Dict[str, Any]:
        word_count = kwargs.get('word_count', 500)
        tone = kwargs.get('tone', 'professional')
        keywords = kwargs.get('keywords', [])
        
        keywords_str = f", {', '.join(keywords)}" if keywords else ""
        
        seo_prompt = OPENAI_PROMPTS['seo_content_generation'].format(
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
                    raise Exception(OPENAI_ERRORS['json_parse_error'])
            
            raise Exception(OPENAI_ERRORS['no_content_generated'])
            
        except httpx.HTTPStatusError as e:
            status_code = e.response.status_code
            try:
                error_data = e.response.json()
                error_msg = error_data.get('error', {}).get('message', '')
                
                if status_code == 429:
                    if 'quota' in error_msg.lower() or 'billing' in error_msg.lower():
                        raise Exception(OPENAI_ERRORS['billing_limit'])
                    else:
                        raise Exception(OPENAI_ERRORS['rate_limit'])
                elif status_code == 401:
                    raise Exception(OPENAI_ERRORS['invalid_api_key'])
                elif status_code == 403:
                    raise Exception(OPENAI_ERRORS['api_access_denied'])
                
                raise Exception(OPENAI_ERRORS['api_error'].format(error_msg=error_msg))
            except Exception as ex:
                if status_code == 429:
                    raise Exception(OPENAI_ERRORS['rate_limit_or_billing'])
                raise Exception(OPENAI_ERRORS['http_error'].format(status_code=status_code))
        except json.JSONDecodeError as e:
            raise Exception(OPENAI_ERRORS['json_parse_error'])
        except Exception as e:
            raise Exception(OPENAI_ERRORS['content_generation_failed'].format(error=str(e)))
    
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
            
            raise Exception(OPENAI_ERRORS['no_response_received'])
            
        except httpx.HTTPStatusError as e:
            status_code = e.response.status_code
            try:
                error_data = e.response.json()
                error_msg = error_data.get('error', {}).get('message', '')
                
                if status_code == 429:
                    if 'quota' in error_msg.lower() or 'billing' in error_msg.lower():
                        raise Exception(OPENAI_ERRORS['billing_limit'])
                    else:
                        raise Exception(OPENAI_ERRORS['rate_limit'])
                elif status_code == 401:
                    raise Exception(OPENAI_ERRORS['invalid_api_key'])
                elif status_code == 403:
                    raise Exception(OPENAI_ERRORS['api_access_denied'])
                
                raise Exception(OPENAI_ERRORS['api_error'].format(error_msg=error_msg))
            except Exception as ex:
                if status_code == 429:
                    raise Exception(OPENAI_ERRORS['rate_limit_or_billing'])
                raise Exception(OPENAI_ERRORS['http_error'].format(status_code=status_code))
        except Exception as e:
            raise Exception(OPENAI_ERRORS['chat_error'].format(error=str(e)))
    
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
                        raise Exception(OPENAI_ERRORS['billing_limit'])
                    else:
                        raise Exception(OPENAI_ERRORS['rate_limit'])
                elif status_code == 401:
                    raise Exception(OPENAI_ERRORS['invalid_api_key'])
                elif status_code == 403:
                    raise Exception(OPENAI_ERRORS['api_access_denied'])
                
                raise Exception(OPENAI_ERRORS['api_error'].format(error_msg=error_msg))
            except Exception as ex:
                if status_code == 429:
                    raise Exception(OPENAI_ERRORS['rate_limit_or_billing'])
                raise Exception(OPENAI_ERRORS['http_error'].format(status_code=status_code))
        except Exception as e:
            raise Exception(OPENAI_ERRORS['audio_generation_error'].format(error=str(e)))
    
    def validate_api_key(self) -> bool:
        try:
            url = f"{self.BASE_URL}/models"
            headers = {"Authorization": f"Bearer {self.api_key}"}
            
            with httpx.Client(timeout=10.0) as client:
                response = client.get(url, headers=headers)
                return response.status_code == 200
        except:
            return False

