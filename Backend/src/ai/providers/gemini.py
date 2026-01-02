from typing import Optional, Dict, Any
from io import BytesIO
import httpx
import os
import json
import re
from .base import BaseProvider
from src.ai.messages.messages import AI_ERRORS, GEMINI_ERRORS, GEMINI_PROMPTS


class GeminiProvider(BaseProvider):
    
    BASE_URL = os.getenv('GEMINI_API_BASE_URL', 'https://generativelanguage.googleapis.com/v1beta')
    
    def __init__(self, api_key: str, config: Optional[Dict[str, Any]] = None):
        super().__init__(api_key, config)
        self.model = config.get('model', 'gemini-1.5-flash') if config else 'gemini-1.5-flash'
    
    def get_provider_name(self) -> str:
        return 'gemini'
    
    async def generate_image(self, prompt: str, **kwargs) -> BytesIO:
        raise NotImplementedError(AI_ERRORS["gemini_not_implemented"])
    
    async def generate_content(self, prompt: str, **kwargs) -> str:
        url = f"{self.BASE_URL}/models/{self.model}:generateContent"
        params = {'key': self.api_key}
        
        word_count = kwargs.get('word_count', 500)
        tone = kwargs.get('tone', 'professional')
        language = kwargs.get('language', 'fa')
        
        full_prompt = GEMINI_PROMPTS["content_generation"].format(
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
            
            raise Exception(GEMINI_ERRORS["no_content_generated"])
            
        except httpx.HTTPStatusError as e:
            status_code = e.response.status_code
            error_msg = ""
            error_text = ""
            
            try:
                error_data = e.response.json()
                error_msg = error_data.get('error', {}).get('message', '')
                if not error_msg:
                    error_msg = error_data.get('message', '')
            except (json.JSONDecodeError, ValueError, AttributeError):
                try:
                    error_text = e.response.text[:500] if hasattr(e.response, 'text') and e.response.text else ""
                except:
                    error_text = ""
            
            if status_code == 403:
                error_detail = error_msg or error_text or "Access denied"
                error_lower = error_detail.lower()
                
                if 'api key' in error_lower or 'permission' in error_lower or 'forbidden' in error_lower or 'api_key_not_valid' in error_lower or not error_detail or status_code == 403:
                    error_detail_formatted = error_detail if error_detail != 'Access denied' else '403 Forbidden'
                    raise Exception(GEMINI_ERRORS["api_access_denied_detailed"].format(error_detail=error_detail_formatted))
                else:
                    raise Exception(GEMINI_ERRORS["api_access_denied_simple"].format(error_detail=error_detail))
            elif status_code == 400:
                error_detail = error_msg or error_text or "Invalid request"
                raise Exception(GEMINI_ERRORS["invalid_request"].format(error_detail=error_detail))
            elif status_code == 429:
                raise Exception(GEMINI_ERRORS["rate_limit"])
            elif status_code == 401:
                raise Exception(GEMINI_ERRORS["invalid_api_key"])
            
            if error_msg:
                raise Exception(GEMINI_ERRORS["http_error_with_message"].format(error_message=error_msg))
            elif error_text:
                raise Exception(GEMINI_ERRORS["http_error_with_detail"].format(status_code=status_code, error_detail=error_text[:200]))
            else:
                raise Exception(GEMINI_ERRORS["http_error"].format(status_code=status_code))
        except Exception as e:
            raise Exception(GEMINI_ERRORS["content_generation_error"].format(error=str(e)))
    
    async def generate_seo_content(self, topic: str, **kwargs) -> Dict[str, Any]:
        word_count = kwargs.get('word_count', 500)
        tone = kwargs.get('tone', 'professional')
        keywords = kwargs.get('keywords', [])
        
        keywords_str = f", {', '.join(keywords)}" if keywords else ""
        
        seo_prompt = GEMINI_PROMPTS["seo_content_generation"].format(
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
                
                content_text = content_text.strip()
                if content_text.startswith('```'):
                    content_text = re.sub(r'^```json\s*', '', content_text)
                    content_text = re.sub(r'^```\s*', '', content_text)
                    content_text = re.sub(r'\s*```$', '', content_text)
                
                try:
                    seo_data = json.loads(content_text)
                    return seo_data
                except json.JSONDecodeError:
                    json_match = re.search(r'\{.*\}', content_text, re.DOTALL)
                    if json_match:
                        seo_data = json.loads(json_match.group())
                        return seo_data
                    raise Exception(GEMINI_ERRORS["json_parse_error"])
            
            raise Exception(GEMINI_ERRORS["no_content_generated"])
            
        except httpx.HTTPStatusError as e:
            status_code = e.response.status_code
            error_msg = ""
            error_text = ""
            
            try:
                error_data = e.response.json()
                error_msg = error_data.get('error', {}).get('message', '')
                if not error_msg:
                    error_msg = error_data.get('message', '')
            except (json.JSONDecodeError, ValueError, AttributeError):
                try:
                    error_text = e.response.text[:500] if hasattr(e.response, 'text') and e.response.text else ""
                except:
                    error_text = ""
            
            if status_code == 403:
                error_detail = error_msg or error_text or "Access denied"
                error_lower = error_detail.lower()
                
                if 'api key' in error_lower or 'permission' in error_lower or 'forbidden' in error_lower or 'api_key_not_valid' in error_lower or not error_detail or status_code == 403:
                    error_detail_formatted = error_detail if error_detail != 'Access denied' else '403 Forbidden'
                    raise Exception(GEMINI_ERRORS["api_access_denied_detailed"].format(error_detail=error_detail_formatted))
                else:
                    raise Exception(GEMINI_ERRORS["api_access_denied_simple"].format(error_detail=error_detail))
            elif status_code == 400:
                error_detail = error_msg or error_text or "Invalid request"
                raise Exception(GEMINI_ERRORS["invalid_request"].format(error_detail=error_detail))
            elif status_code == 429:
                raise Exception(GEMINI_ERRORS["rate_limit"])
            elif status_code == 401:
                raise Exception(GEMINI_ERRORS["invalid_api_key"])
            
            if error_msg:
                raise Exception(GEMINI_ERRORS["http_error_with_message"].format(error_message=error_msg))
            elif error_text:
                raise Exception(GEMINI_ERRORS["http_error_with_detail"].format(status_code=status_code, error_detail=error_text[:200]))
            else:
                raise Exception(GEMINI_ERRORS["http_error"].format(status_code=status_code))
        except json.JSONDecodeError as e:
            raise Exception(GEMINI_ERRORS["json_parse_error"])
        except Exception as e:
            raise Exception(GEMINI_ERRORS["content_generation_error"].format(error=str(e)))
    
    async def chat(self, message: str, conversation_history: Optional[list] = None, **kwargs) -> str:
        url = f"{self.BASE_URL}/models/{self.model}:generateContent"
        params = {'key': self.api_key}
        
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
                # Gemini expects raw bytes for blob in 'inline_data'? 
                # Actually, correct format for Gemini API (REST) is inlineData with base64
                if isinstance(image_content, str):
                    image_content = image_content.encode('utf-8')
                base64_image = base64.b64encode(image_content).decode('utf-8')
                
                # Determine mime type
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
            
            raise Exception(GEMINI_ERRORS["no_response_received"])
            
        except httpx.ReadTimeout:
            raise Exception(GEMINI_ERRORS["response_timeout"])
        except httpx.HTTPStatusError as e:
            status_code = e.response.status_code
            error_msg = ""
            error_text = ""
            
            try:
                error_data = e.response.json()
                error_msg = error_data.get('error', {}).get('message', '')
                if not error_msg:
                    error_msg = error_data.get('message', '')
            except (json.JSONDecodeError, ValueError, AttributeError):
                try:
                    error_text = e.response.text[:500] if hasattr(e.response, 'text') and e.response.text else ""
                except:
                    error_text = ""
            
            if status_code == 403:
                raise Exception(GEMINI_ERRORS["api_access_denied_simple"].format(error_detail=error_msg or error_text or "403 Forbidden"))
            elif status_code == 429:
                raise Exception(GEMINI_ERRORS["chat_rate_limit"])
            elif status_code == 401:
                raise Exception(GEMINI_ERRORS["invalid_api_key_simple"])
            else:
                error_detail = error_msg or error_text or f"HTTP {status_code}"
                raise Exception(GEMINI_ERRORS["http_error_with_message"].format(error_message=error_detail))
        except Exception as e:
            raise Exception(GEMINI_ERRORS["chat_error"].format(error=str(e)))
    
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

