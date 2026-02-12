from typing import Optional, Dict, Any
from io import BytesIO
import httpx
import os
from .base import BaseProvider
from .capabilities import get_default_model
from src.ai.messages.messages import AI_ERRORS
from src.ai.prompts.content import get_content_prompt, get_seo_prompt
from src.ai.prompts.chat import get_chat_system_message
from src.ai.prompts.image import get_image_prompt, enhance_image_prompt, get_negative_prompt
from src.ai.prompts.audio import get_audio_prompt, calculate_word_count, estimate_duration

class GeminiProvider(BaseProvider):
    
    BASE_URL = os.getenv('GEMINI_API_BASE_URL', 'https://generativelanguage.googleapis.com/v1beta')
    
    def __init__(self, api_key: str, config: Optional[Dict[str, Any]] = None):
        super().__init__(api_key, config)
        cfg = config or {}
        self.model = cfg.get('model') or get_default_model('google', 'content')
    
    def get_provider_name(self) -> str:
        return 'gemini'
    
    async def generate_image(self, prompt: str, **kwargs) -> BytesIO:
        raise NotImplementedError(AI_ERRORS["gemini_not_implemented"])
    
    async def generate_content(self, prompt: str, **kwargs) -> str:
        # Use model from config or kwargs, fall back to self.model
        model_to_use = self.config.get('model') or kwargs.get('model') or self.model
        url = f"{self.BASE_URL}/models/{model_to_use}:generateContent"
        params = {'key': self.api_key}
        
        word_count = kwargs.get('word_count', 500)
        tone = kwargs.get('tone', 'professional')
        language = kwargs.get('language', 'fa')
        
        # دریافت prompt از ماژول prompts
        content_prompt_template = get_content_prompt(provider='gemini')
        full_prompt = content_prompt_template.format(
            topic=prompt,
            word_count=word_count,
            tone=tone
        )
        
        payload = {
            "contents": [{
                "parts": [{
                    "text": full_prompt
                }]
            }],
            "generationConfig": {
                "temperature": 0.7,
                "topK": 40,
                "topP": 0.95,
                "maxOutputTokens": word_count * 2,
            }
        }
        
        try:
            response = await self.client.post(url, params=params, json=payload)
            response.raise_for_status()
            
            data = response.json()
            if 'candidates' in data and len(data['candidates']) > 0:
                content = data['candidates'][0]['content']['parts'][0]['text']
                return content.strip()
            
            raise Exception(AI_ERRORS["content_generation_failed"])
            
        except httpx.HTTPStatusError as e:
            self.raise_mapped_http_error(e, "content_generation_failed")
        except Exception as e:
            raise Exception(AI_ERRORS["content_generation_failed"])
    
    async def generate_seo_content(self, topic: str, **kwargs) -> Dict[str, Any]:
        word_count = kwargs.get('word_count', 500)
        tone = kwargs.get('tone', 'professional')
        keywords = kwargs.get('keywords', [])
        
        keywords_str = f", {', '.join(keywords)}" if keywords else ""
        
        # دریافت prompt از ماژول prompts
        seo_prompt_template = get_seo_prompt(provider='gemini')
        seo_prompt = seo_prompt_template.format(
            topic=topic,
            keywords_str=keywords_str,
            word_count=word_count
        )
        
        url = f"{self.BASE_URL}/models/{self.model}:generateContent"
        params = {'key': self.api_key}
        
        payload = {
            "contents": [{
                "parts": [{
                    "text": seo_prompt
                }]
            }],
            "generationConfig": {
                "temperature": 0.7,
                "topK": 40,
                "topP": 0.95,
                "maxOutputTokens": 4000,
                "responseMimeType": "application/json"
            }
        }
        
        try:
            response = await self.client.post(url, params=params, json=payload)
            response.raise_for_status()
            
            data = response.json()
            if 'candidates' in data and len(data['candidates']) > 0:
                content_text = data['candidates'][0]['content']['parts'][0]['text']

                seo_data = self.extract_json_payload(content_text)
                if seo_data is not None:
                    return seo_data
                raise Exception(AI_ERRORS["invalid_json"])
            
            raise Exception(AI_ERRORS["content_generation_failed"])
            
        except httpx.HTTPStatusError as e:
            self.raise_mapped_http_error(e, "content_generation_failed")
        except Exception as e:
            if str(e).strip() == AI_ERRORS["invalid_json"]:
                raise Exception(AI_ERRORS["invalid_json"])
            raise Exception(AI_ERRORS["content_generation_failed"])
    
    async def chat(self, message: str, conversation_history: Optional[list] = None, **kwargs) -> str:
        # Use model from config or kwargs, fall back to self.model
        model_to_use = self.config.get('model') or kwargs.get('model') or self.model
        url = f"{self.BASE_URL}/models/{model_to_use}:generateContent"
        params = {'key': self.api_key}
        
        # Get system message based on persona
        persona = kwargs.get('persona', 'default')
        system_message = get_chat_system_message(persona=persona, provider='gemini')
        
        contents = []
        
        if conversation_history:
            for msg in conversation_history:
                role = msg.get('role', 'user')
                content = msg.get('content', '')
                if role == 'user':
                    contents.append({
                        "role": "user",
                        "parts": [{"text": content}]
                    })
                elif role == 'assistant':
                    contents.append({
                        "role": "model",
                        "parts": [{"text": content}]
                    })
        
        user_parts = [{"text": message}]
        
        if kwargs.get('image'):
            import base64
            image_file = kwargs['image']
            if hasattr(image_file, 'read'):
                image_content = image_file.read()
                if isinstance(image_content, str):
                    image_content = image_content.encode('utf-8')
                base64_image = base64.b64encode(image_content).decode('utf-8')
                
                mime_type = "image/jpeg"
                if hasattr(image_file, 'content_type'):
                    mime_type = image_file.content_type
                elif hasattr(image_file, 'name'):
                    if image_file.name.lower().endswith('.png'):
                        mime_type = "image/png"
                    elif image_file.name.lower().endswith('.webp'):
                        mime_type = "image/webp"

                user_parts.append({
                    "inline_data": {
                        "mime_type": mime_type,
                        "data": base64_image
                    }
                })

        contents.append({
            "role": "user",
            "parts": user_parts
        })
        
        payload = {
            "contents": contents,
            "systemInstruction": {
                "parts": [{"text": system_message}]
            },
            "generationConfig": {
                "temperature": kwargs.get('temperature', 0.7),
                "topK": 40,
                "topP": 0.95,
                "maxOutputTokens": kwargs.get('max_tokens', 2048),
            }
        }
        
        try:
            response = await self.client.post(url, params=params, json=payload)
            response.raise_for_status()
            
            data = response.json()
            if 'candidates' in data and len(data['candidates']) > 0:
                reply = data['candidates'][0]['content']['parts'][0]['text']
                return reply.strip()
            
            raise Exception(AI_ERRORS["chat_failed"])
            
        except httpx.ReadTimeout:
            raise Exception(AI_ERRORS["generic_timeout"])
        except httpx.HTTPStatusError as e:
            self.raise_mapped_http_error(e, "chat_failed")
        except Exception as e:
            raise Exception(AI_ERRORS["chat_failed"])
    
    def validate_api_key(self) -> bool:
        try:
            url = f"{self.BASE_URL}/models"
            params = {'key': self.api_key}
            
            with httpx.Client(timeout=10.0) as client:
                response = client.get(url, params=params)
                
                if response.status_code == 200:
                    return True
                elif response.status_code == 400:
                    try:
                        error_data = response.json()
                        error_msg = error_data.get('error', {}).get('message', '')
                        if 'API_KEY_INVALID' in error_msg or 'API key not valid' in error_msg:
                            return False
                    except:
                        pass
                    return False
                elif response.status_code == 403:
                    return True
                else:
                    return False
        except httpx.TimeoutException:
            return True
        except httpx.RequestError as e:
            return True
        except Exception as e:
            return False

