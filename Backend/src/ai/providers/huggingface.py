from typing import Optional, Dict, Any, List
from io import BytesIO
import httpx
import base64
import os
import json
import re
from .base import BaseProvider
from src.ai.messages.messages import AI_ERRORS
from src.ai.utils.cache import AICacheKeys


class HuggingFaceProvider(BaseProvider):
    
    BASE_URL = os.getenv('HUGGINGFACE_API_BASE_URL', 'https://router.huggingface.co/hf-inference')
    
    TEXT_GENERATION_TASK = 'text-generation'
    
    def __init__(self, api_key: str, config: Optional[Dict[str, Any]] = None):
        super().__init__(api_key, config)
        self.image_model = config.get('image_model', 'stabilityai/stable-diffusion-xl-base-1.0') if config else 'stabilityai/stable-diffusion-xl-base-1.0'
        self.content_model = config.get('content_model', 'gpt2') if config else 'gpt2'
        self.client = httpx.AsyncClient(
            timeout=httpx.Timeout(180.0, connect=10.0, read=180.0),
            limits=httpx.Limits(max_keepalive_connections=5, max_connections=10)
        )
    
    def get_timeout(self) -> httpx.Timeout:
        return httpx.Timeout(180.0, connect=10.0, read=180.0)
    
    def get_provider_name(self) -> str:
        return 'huggingface'
    
    @staticmethod
    def get_available_models(api_key: Optional[str] = None, task_filter: Optional[str] = None, use_cache: bool = True):
        from django.core.cache import cache
        
        cache_key = AICacheKeys.provider_models('huggingface', task_filter)
        
        if use_cache:
            cached_models = cache.get(cache_key)
            if cached_models is not None:
                return cached_models
        
        try:
            import httpx
            
            url = "https://huggingface.co/api/models"
            
            params = {
                'sort': 'downloads',
                'direction': '-1',
                'limit': 100,
            }
            
            if task_filter:
                params['pipeline_tag'] = task_filter
            
            headers = {}
            if api_key:
                headers['Authorization'] = f'Bearer {api_key}'
            
            with httpx.Client(timeout=30.0) as client:
                response = client.get(url, params=params, headers=headers)
                response.raise_for_status()
                models_data = response.json()
            
            if not isinstance(models_data, list):
                if isinstance(models_data, dict) and 'data' in models_data:
                    models_data = models_data['data']
                else:
                    return []
            
            models = []
            for model in models_data:
                if not isinstance(model, dict):
                    continue
                    
                model_id = model.get('id', '')
                task = model.get('pipeline_tag', '')
                
                if task_filter:
                    if task != task_filter:
                        continue
                
                models.append({
                    'id': model_id,
                    'name': model.get('modelId', model.get('id', model_id)),
                    'description': model.get('description', ''),
                    'task': task,
                    'downloads': model.get('downloads', 0),
                    'likes': model.get('likes', 0),
                    'tags': model.get('tags', []),
                })
            
            if use_cache:
                cache.set(cache_key, models, 6 * 60 * 60)
            
            return models
            
        except Exception:
            return []
    
    async def generate_image(self, prompt: str, **kwargs) -> BytesIO:
        url = f"{self.BASE_URL}/models/{self.image_model}"
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        
        size = kwargs.get('size', '1024x1024')
        quality = kwargs.get('quality', 'standard')
        
        width, height = 1024, 1024
        if 'x' in size:
            try:
                w, h = map(int, size.split('x'))
                width = max(512, min(1024, (w // 64) * 64))
                height = max(512, min(1024, (h // 64) * 64))
            except:
                pass
        
        if quality == 'hd':
            num_inference_steps = kwargs.get('num_inference_steps', 75)
            guidance_scale = kwargs.get('guidance_scale', 8.0)
        else:
            num_inference_steps = kwargs.get('num_inference_steps', 50)
            guidance_scale = kwargs.get('guidance_scale', 7.5)
        
        enhanced_prompt = prompt
        if 'high quality' not in enhanced_prompt.lower() and 'detailed' not in enhanced_prompt.lower():
            if quality == 'hd':
                enhanced_prompt = f"{enhanced_prompt}, ultra high quality, highly detailed, professional photography, 4k, masterpiece"
            else:
                enhanced_prompt = f"{enhanced_prompt}, high quality, detailed, professional photography"
        
        payload = {
            "inputs": enhanced_prompt,
            "parameters": {
                "width": width,
                "height": height,
                "num_inference_steps": num_inference_steps,
                "guidance_scale": guidance_scale,
                "negative_prompt": kwargs.get('negative_prompt', 'blurry, low quality, distorted, deformed, ugly, bad anatomy, worst quality'),
            }
        }
        
        try:
            response = await self.client.post(
                url,
                json=payload,
                headers=headers
            )
            
            response.raise_for_status()
            
            if response.headers.get('content-type', '').startswith('image/'):
                return BytesIO(response.content)
            
            try:
                result = response.json()
                if isinstance(result, dict) and 'image' in result:
                    image_b64 = result['image']
                    if image_b64.startswith('data:image'):
                        image_b64 = image_b64.split(',')[1]
                    return BytesIO(base64.b64decode(image_b64))
            except:
                pass
            
            return BytesIO(response.content)
            
        except httpx.ReadTimeout:
            raise Exception(AI_ERRORS.get("image_generation_timeout", "Image generation timeout"))
        except httpx.TimeoutException:
            raise Exception(AI_ERRORS.get("connection_timeout", "Connection timeout"))
        except httpx.HTTPStatusError as e:
            try:
                error_data = e.response.json()
                error_detail = error_data.get('error', '')
                
                if 'loading' in str(error_detail).lower() or e.response.status_code == 503:
                    error_msg = AI_ERRORS["huggingface_model_loading"]
                else:
                    error_msg = AI_ERRORS["image_generation_http_error"].format(
                        status_code=e.response.status_code,
                        detail=error_detail if error_detail else str(e)
                    )
            except:
                error_msg = AI_ERRORS["image_generation_http_error"].format(
                    status_code=e.response.status_code,
                    detail=str(e)
                )
            raise Exception(error_msg)
        except Exception as e:
            error_str = str(e)
            if 'ReadTimeout' in error_str or 'timeout' in error_str.lower():
                raise Exception(AI_ERRORS.get("image_generation_timeout", "Image generation timeout"))
            raise Exception(AI_ERRORS["image_generation_failed"].format(error=error_str))
    
    # Content generation methods
    async def generate_content(self, prompt: str, **kwargs) -> str:
        # Use new endpoint: https://router.huggingface.co/hf-inference/models/{model_id}
        url = f"{self.BASE_URL}/models/{self.content_model}"
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        
        word_count = kwargs.get('word_count', 500)
        tone = kwargs.get('tone', 'professional')
        
        full_prompt = HUGGINGFACE_ERRORS["content_generation_prompt"].format(
            topic=prompt,
            word_count=word_count,
            tone=tone
        )
        
        payload = {
            "inputs": full_prompt,
            "parameters": {
                "max_new_tokens": word_count * 2,  # Approximate token count
                "temperature": 0.7,
                "top_p": 0.9,
                "return_full_text": False,
                "do_sample": True,
            }
        }
        
        try:
            response = await self.client.post(url, json=payload, headers=headers)
            response.raise_for_status()
            
            data = response.json()
            
            # Handle different response formats
            if isinstance(data, list) and len(data) > 0:
                generated_text = data[0].get('generated_text', '')
                if generated_text:
                    # Remove the original prompt if it's included
                    if full_prompt in generated_text:
                        generated_text = generated_text.replace(full_prompt, '').strip()
                    return generated_text.strip()
            elif isinstance(data, dict):
                if 'generated_text' in data:
                    generated_text = data['generated_text']
                    if full_prompt in generated_text:
                        generated_text = generated_text.replace(full_prompt, '').strip()
                    return generated_text.strip()
            
            raise Exception(AI_ERRORS.get("content_generation_failed", "No content generated"))
            
        except httpx.ReadTimeout:
            raise Exception(AI_ERRORS.get("content_generation_timeout", "Content generation timeout"))
        except httpx.HTTPStatusError as e:
            status_code = e.response.status_code
            error_msg = ""
            error_text = ""
            
            try:
                error_data = e.response.json()
                error_msg = error_data.get('error', '')
                if not error_msg:
                    error_msg = error_data.get('message', '')
            except (json.JSONDecodeError, ValueError, AttributeError):
                try:
                    error_text = e.response.text[:500] if hasattr(e.response, 'text') and e.response.text else ""
                except:
                    error_text = ""
            
            if status_code == 404:
                raise Exception(AI_ERRORS.get("model_not_found", "Model not found").format(model=self.content_model))
            elif status_code == 503 or 'loading' in (error_msg or error_text).lower():
                raise Exception(AI_ERRORS.get("huggingface_model_loading", "Model is loading"))
            else:
                error_detail = error_msg or error_text or f"HTTP {status_code}"
                raise Exception(AI_ERRORS.get("content_generation_failed", "Content generation failed").format(error=error_detail))
        except Exception as e:
            raise Exception(AI_ERRORS.get("content_generation_failed", "Content generation failed").format(error=str(e)))
    
    async def generate_seo_content(self, topic: str, **kwargs) -> Dict[str, Any]:
        word_count = kwargs.get('word_count', 500)
        tone = kwargs.get('tone', 'professional')
        keywords = kwargs.get('keywords', [])
        
        keywords_str = ', '.join(keywords) if keywords else ''
        
        # Build comprehensive prompt for SEO content
        seo_prompt = f"""Write a complete SEO-optimized article in Persian (Farsi) in JSON format.

Topic: {topic}
Keywords: {keywords_str if keywords_str else 'none specified'}
Word count: approximately {word_count} words
Tone: {tone}

Return ONLY a valid JSON object with this exact structure (no markdown, no extra text):
{{
  "title": "SEO-optimized title (50-60 characters)",
  "meta_description": "Meta description (150-160 characters)",
  "slug": "url-friendly-slug",
  "h1": "Main heading",
  "h2_list": ["Heading 2 - 1", "Heading 2 - 2", "Heading 2 - 3"],
  "h3_list": ["Heading 3 - 1.1", "Heading 3 - 1.2", "Heading 3 - 2.1"],
  "content": "Full content with HTML <h2> and <h3> tags matching h2_list and h3_list. Content should be around {word_count} words and include the keywords naturally.",
  "keywords": ["keyword1", "keyword2", "keyword3"]
}}

Important:
- The content field MUST include <h2> and <h3> tags that match the headings in h2_list and h3_list
- All text must be in Persian (Farsi)
- Ensure the h2_list and h3_list headings appear in the content field as HTML tags
- Content should be SEO-optimized and natural

Return ONLY the JSON object, nothing else."""
        
        url = f"{self.BASE_URL}/models/{self.content_model}"
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        
        payload = {
            "inputs": seo_prompt,
            "parameters": {
                "max_new_tokens": word_count * 3,  # More tokens for structured output
                "temperature": 0.7,
                "top_p": 0.9,
                "return_full_text": False,
                "do_sample": True,
            }
        }
        
        try:
            response = await self.client.post(url, json=payload, headers=headers)
            response.raise_for_status()
            
            data = response.json()
            
            # Extract generated text
            generated_text = ""
            if isinstance(data, list) and len(data) > 0:
                generated_text = data[0].get('generated_text', '')
            elif isinstance(data, dict):
                generated_text = data.get('generated_text', '')
            
            if not generated_text:
                raise Exception(AI_ERRORS.get("content_generation_failed", "No content generated"))
            
            # Remove prompt if included
            if seo_prompt in generated_text:
                generated_text = generated_text.replace(seo_prompt, '').strip()
            
            # Clean and extract JSON
            generated_text = generated_text.strip()
            if generated_text.startswith('```'):
                generated_text = re.sub(r'^```json\s*', '', generated_text)
                generated_text = re.sub(r'^```\s*', '', generated_text)
                generated_text = re.sub(r'\s*```$', '', generated_text)
            
            # Try to parse JSON
            try:
                seo_data = json.loads(generated_text)
                return seo_data
            except json.JSONDecodeError:
                # Try to extract JSON from text
                json_match = re.search(r'\{.*\}', generated_text, re.DOTALL)
                if json_match:
                    seo_data = json.loads(json_match.group())
                    return seo_data
                raise Exception(AI_ERRORS.get("json_parse_error", "JSON parse error"))
            
        except httpx.ReadTimeout:
            raise Exception(AI_ERRORS.get("content_generation_timeout", "Content generation timeout"))
        except httpx.HTTPStatusError as e:
            status_code = e.response.status_code
            error_msg = ""
            error_text = ""
            
            try:
                error_data = e.response.json()
                error_msg = error_data.get('error', '')
                if not error_msg:
                    error_msg = error_data.get('message', '')
            except (json.JSONDecodeError, ValueError, AttributeError):
                try:
                    error_text = e.response.text[:500] if hasattr(e.response, 'text') and e.response.text else ""
                except:
                    error_text = ""
            
            if status_code == 404:
                raise Exception(AI_ERRORS.get("model_not_found", "Model not found").format(model=self.content_model))
            elif status_code == 503 or 'loading' in (error_msg or error_text).lower():
                raise Exception(AI_ERRORS.get("huggingface_model_loading", "Model is loading"))
            else:
                error_detail = error_msg or error_text or f"HTTP {status_code}"
                raise Exception(AI_ERRORS.get("content_generation_failed", "Content generation failed").format(error=error_detail))
        except Exception as e:
            raise Exception(AI_ERRORS.get("content_generation_failed", "Content generation failed").format(error=str(e)))
    
    # Chat method
    async def chat(self, message: str, conversation_history: Optional[List[Dict[str, str]]] = None, **kwargs) -> str:
        url = f"{self.BASE_URL}/models/{self.content_model}"
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        
        # Build prompt from conversation history and current message
        system_message = kwargs.get('system_message') or 'You are a helpful AI assistant.'
        
        # Build full prompt with conversation history
        full_prompt = system_message + "\n\n"
        
        if conversation_history:
            for msg in conversation_history:
                role = msg.get('role', 'user')
                content = msg.get('content', '')
                if role == 'user':
                    full_prompt += f"کاربر: {content}\n"
                elif role == 'assistant':
                    full_prompt += f"دستیار: {content}\n"
        
        # Add current message
        full_prompt += f"کاربر: {message}\nدستیار:"
        
        payload = {
            "inputs": full_prompt,
            "parameters": {
                "max_new_tokens": kwargs.get('max_tokens', 2048),
                "temperature": kwargs.get('temperature', 0.7),
                "top_p": 0.9,
                "return_full_text": False,
                "do_sample": True,
            }
        }
        
        try:
            response = await self.client.post(url, json=payload, headers=headers)
            response.raise_for_status()
            
            data = response.json()
            
            # Handle different response formats
            if isinstance(data, list) and len(data) > 0:
                generated_text = data[0].get('generated_text', '')
                if generated_text:
                    # Remove the original prompt if it's included
                    if full_prompt in generated_text:
                        generated_text = generated_text.replace(full_prompt, '').strip()
                    return generated_text.strip()
            elif isinstance(data, dict):
                if 'generated_text' in data:
                    generated_text = data['generated_text']
                    if full_prompt in generated_text:
                        generated_text = generated_text.replace(full_prompt, '').strip()
                    return generated_text.strip()
            
            raise Exception(AI_ERRORS.get("chat_failed", "No response received"))
            
        except httpx.ReadTimeout:
            raise Exception(AI_ERRORS.get("chat_timeout", "Chat timeout"))
        except httpx.HTTPStatusError as e:
            status_code = e.response.status_code
            error_msg = ""
            error_text = ""
            
            try:
                error_data = e.response.json()
                error_msg = error_data.get('error', '')
                if not error_msg:
                    error_msg = error_data.get('message', '')
            except (json.JSONDecodeError, ValueError, AttributeError):
                try:
                    error_text = e.response.text[:500] if hasattr(e.response, 'text') and e.response.text else ""
                except:
                    error_text = ""
            
            if status_code == 404:
                raise Exception(AI_ERRORS.get("model_not_found", "Model not found").format(model=self.content_model))
            elif status_code == 503 or 'loading' in (error_msg or error_text).lower():
                raise Exception(AI_ERRORS.get("huggingface_model_loading", "Model is loading"))
            else:
                error_detail = error_msg or error_text or f"HTTP {status_code}"
                raise Exception(AI_ERRORS.get("chat_failed", "Chat failed").format(error=error_detail))
        except Exception as e:
            raise Exception(AI_ERRORS.get("chat_failed", "Chat failed").format(error=str(e)))
    
    def validate_api_key(self) -> bool:
        try:
            url = f"{self.BASE_URL}/models/stabilityai/stable-diffusion-xl-base-1.0"
            headers = {"Authorization": f"Bearer {self.api_key}"}
            
            with httpx.Client(timeout=5.0) as client:
                response = client.head(url, headers=headers)
                if response.status_code not in [401, 403]:
                    return True
                return False
        except:
            return True

