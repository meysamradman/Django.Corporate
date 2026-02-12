from typing import Optional, Dict, Any, List
from io import BytesIO
import httpx
import base64
import os
import json
import re
from django.core.cache import cache
from .base import BaseProvider
from src.ai.messages.messages import AI_ERRORS
from src.ai.utils.cache import AICacheKeys
from src.ai.prompts.content import get_content_prompt, get_seo_prompt
from src.ai.prompts.chat import get_chat_system_message
from src.ai.prompts.image import get_image_prompt, enhance_image_prompt, get_negative_prompt
from src.ai.prompts.audio import get_audio_prompt, calculate_word_count, estimate_duration

class HuggingFaceProvider(BaseProvider):
    
    BASE_URL = os.getenv('HUGGINGFACE_API_BASE_URL', 'https://api-inference.huggingface.co')
    ROUTER_V1_BASE_URL = os.getenv('HUGGINGFACE_ROUTER_BASE_URL', 'https://router.huggingface.co/v1')
    
    TEXT_GENERATION_TASK = 'text-generation'
    
    def __init__(self, api_key: str, config: Optional[Dict[str, Any]] = None):
        super().__init__(api_key, config)
        self.image_model = config.get('image_model', 'stabilityai/stable-diffusion-xl-base-1.0') if config else 'stabilityai/stable-diffusion-xl-base-1.0'
        self.content_model = config.get('content_model', 'gpt2') if config else 'gpt2'
        self.client = httpx.AsyncClient(
            timeout=180.0,  # timeout کلی برای HuggingFace (نیاز به timeout بیشتر)
            limits=httpx.Limits(max_keepalive_connections=5, max_connections=10)
        )
    
    def get_timeout(self) -> float:
        return 180.0
    
    def get_provider_name(self) -> str:
        return 'huggingface'
    
    @staticmethod
    def get_available_models(
        api_key: Optional[str] = None,
        task_filter: Optional[str] = None,
        capability: Optional[str] = None,
        use_cache: bool = True,
    ):
        import logging
        logger = logging.getLogger(__name__)

        cache_suffix = capability or task_filter
        cache_key = AICacheKeys.provider_models('huggingface', cache_suffix)
        logger.info(
            f"[HuggingFace] Fetching models capability={capability}, task_filter={task_filter}, use_cache={use_cache}"
        )
        
        if use_cache:
            cached_models = cache.get(cache_key)
            if cached_models is not None:
                logger.info(f"[HuggingFace] Returning {len(cached_models)} cached models")
                return cached_models
        
        try:
            # For chat, use Hugging Face Router OpenAI-compatible API.
            # This avoids listing Hub models that are not runnable on the router.
            if capability == 'chat':
                url = f"{HuggingFaceProvider.ROUTER_V1_BASE_URL}/models"
                headers = {}
                if api_key:
                    headers['Authorization'] = f'Bearer {api_key}'

                with httpx.Client(timeout=30.0) as client:
                    response = client.get(url, headers=headers)
                    response.raise_for_status()
                    payload = response.json()

                models_data = []
                if isinstance(payload, dict):
                    if isinstance(payload.get('data'), list):
                        models_data = payload['data']
                    elif isinstance(payload.get('models'), list):
                        models_data = payload['models']

                models = []
                for model in models_data:
                    if not isinstance(model, dict):
                        continue
                    model_id = model.get('id') or model.get('name')
                    if not model_id:
                        continue
                    models.append({
                        'id': model_id,
                        'name': model.get('name', model_id),
                        'description': model.get('description', ''),
                        'pricing': model.get('pricing', {}),
                        'context_length': model.get('context_length') or model.get('context_window'),
                    })

                logger.info(f"[HuggingFace] Router returned {len(models)} chat models")
                if use_cache:
                    cache.set(cache_key, models, 6 * 60 * 60)
                return models
            
            url = "https://huggingface.co/api/models"
            
            # ✅ دریافت مدل‌های پرطرفدار
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
                
                # ✅ فیلتر task
                if task_filter:
                    if task != task_filter:
                        continue
                
                # ✅ فقط مدل‌هایی که inference status دارن
                inference_status = model.get('inference', 'cold')
                if inference_status not in ['warm', 'hot']:
                    logger.debug(f"[HuggingFace] Skipping {model_id} - inference={inference_status}")
                    continue
                
                models.append({
                    'id': model_id,
                    'name': model.get('modelId', model.get('id', model_id)),
                    'description': model.get('description', ''),
                    'task': task,
                    'downloads': model.get('downloads', 0),
                    'likes': model.get('likes', 0),
                    'tags': model.get('tags', []),
                    'inference': inference_status,  # 🔥 اضافه کردن inference status
                })
            
            logger.info(f"[HuggingFace] Successfully fetched {len(models)} models from API")
            
            if use_cache:
                cache.set(cache_key, models, 6 * 60 * 60)
            
            return models
            
        except Exception as e:
            logger.error(f"[HuggingFace] Error fetching models: {str(e)}")
            return []
    
    async def generate_image(self, prompt: str, **kwargs) -> BytesIO:
        # Use model from config (set by service) or fall back to image_model
        model_to_use = self.config.get('model') or kwargs.get('model') or self.image_model
        url = f"{self.BASE_URL}/models/{model_to_use}"
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        
        size = kwargs.get('size', '1024x1024')
        quality = kwargs.get('quality', 'standard')
        style = kwargs.get('style', 'realistic')
        
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
        
        # Use centralized image prompt enhancement from prompts module
        enhanced_prompt = enhance_image_prompt(prompt, style=style, add_quality=(quality == 'hd'))
        
        # Get negative prompt from prompts module
        negative_prompt = kwargs.get('negative_prompt') or get_negative_prompt(provider='huggingface')
        
        payload = {
            "inputs": enhanced_prompt,
            "parameters": {
                "width": width,
                "height": height,
                "num_inference_steps": num_inference_steps,
                "guidance_scale": guidance_scale,
                "negative_prompt": negative_prompt,
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
            raise Exception(AI_ERRORS["image_generation_timeout"])
        except httpx.TimeoutException:
            raise Exception(AI_ERRORS["connection_timeout"])
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
                raise Exception(AI_ERRORS["image_generation_timeout"])
            raise Exception(AI_ERRORS["image_generation_failed"].format(error=error_str))
    
    async def generate_content(self, prompt: str, **kwargs) -> str:
        # Use model from config (set by service) or fall back to content_model
        model_to_use = self.config.get('model') or kwargs.get('model') or self.content_model
        url = f"{self.BASE_URL}/models/{model_to_use}"
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        
        word_count = kwargs.get('word_count', 500)
        tone = kwargs.get('tone', 'professional')
        
        # Use centralized content prompt from prompts module
        content_prompt_template = get_content_prompt(provider='huggingface')
        full_prompt = content_prompt_template.format(
            topic=prompt,
            word_count=word_count,
            tone=tone
        )
        
        payload = {
            "inputs": full_prompt,
            "parameters": {
                "max_new_tokens": word_count * 2,
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
            
            if isinstance(data, list) and len(data) > 0:
                generated_text = data[0].get('generated_text', '')
                if generated_text:
                    if full_prompt in generated_text:
                        generated_text = generated_text.replace(full_prompt, '').strip()
                    return generated_text.strip()
            elif isinstance(data, dict):
                if 'generated_text' in data:
                    generated_text = data['generated_text']
                    if full_prompt in generated_text:
                        generated_text = generated_text.replace(full_prompt, '').strip()
                    return generated_text.strip()
            
            raise Exception(AI_ERRORS["content_generation_failed"].format(error="No content generated"))
            
        except httpx.ReadTimeout:
            raise Exception(AI_ERRORS["content_generation_timeout"])
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
                raise Exception(AI_ERRORS["model_not_found"])
            elif status_code == 503 or 'loading' in (error_msg or error_text).lower():
                raise Exception(AI_ERRORS["huggingface_model_loading"])
            else:
                error_detail = error_msg or error_text or f"HTTP {status_code}"
                raise Exception(AI_ERRORS["content_generation_failed"].format(error=error_detail))
        except Exception as e:
            raise Exception(AI_ERRORS["content_generation_failed"].format(error=str(e)))
    
    async def generate_seo_content(self, topic: str, **kwargs) -> Dict[str, Any]:
        word_count = kwargs.get('word_count', 500)
        tone = kwargs.get('tone', 'professional')
        keywords = kwargs.get('keywords', [])
        
        keywords_str = f", {', '.join(keywords)}" if keywords else ""
        
        # Use centralized SEO prompt from prompts module
        seo_prompt_template = get_seo_prompt(provider='huggingface')
        seo_prompt = seo_prompt_template.format(
            topic=topic,
            keywords_str=keywords_str,
            word_count=word_count
        )
        
        # Use model from config (set by service) or fall back to content_model
        model_to_use = self.config.get('model') or kwargs.get('model') or self.content_model
        url = f"{self.BASE_URL}/models/{model_to_use}"
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        
        payload = {
            "inputs": seo_prompt,
            "parameters": {
                "max_new_tokens": word_count * 3,
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
            
            generated_text = ""
            if isinstance(data, list) and len(data) > 0:
                generated_text = data[0].get('generated_text', '')
            elif isinstance(data, dict):
                generated_text = data.get('generated_text', '')
            
            if not generated_text:
                raise Exception(AI_ERRORS["content_generation_failed"].format(error="No content generated"))
            
            if seo_prompt in generated_text:
                generated_text = generated_text.replace(seo_prompt, '').strip()
            
            generated_text = generated_text.strip()
            if generated_text.startswith('```'):
                generated_text = re.sub(r'^```json\s*', '', generated_text)
                generated_text = re.sub(r'^```\s*', '', generated_text)
                generated_text = re.sub(r'\s*```$', '', generated_text)
            
            try:
                seo_data = json.loads(generated_text)
                return seo_data
            except json.JSONDecodeError:
                json_match = re.search(r'\{.*\}', generated_text, re.DOTALL)
                if json_match:
                    seo_data = json.loads(json_match.group())
                    return seo_data
                raise Exception(AI_ERRORS["json_parse_error"].format(error=""))
            
        except httpx.ReadTimeout:
            raise Exception(AI_ERRORS["content_generation_timeout"])
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
                raise Exception(AI_ERRORS["model_not_found"])
            elif status_code == 503 or 'loading' in (error_msg or error_text).lower():
                raise Exception(AI_ERRORS["huggingface_model_loading"])
            else:
                error_detail = error_msg or error_text or f"HTTP {status_code}"
                raise Exception(AI_ERRORS["content_generation_failed"].format(error=error_detail))
        except Exception as e:
            raise Exception(AI_ERRORS["content_generation_failed"].format(error=str(e)))
    
    async def chat(self, message: str, conversation_history: Optional[List[Dict[str, str]]] = None, **kwargs) -> str:
        # Use model from config (set by service) or fall back to content_model
        model_to_use = self.config.get('model') or kwargs.get('model') or self.content_model

        # Get system message based on persona
        persona = kwargs.get('persona', 'default')
        system_message = kwargs.get('system_message') or get_chat_system_message(persona=persona, provider='huggingface')

        # If an image is provided, keep using the HF inference task endpoint for now.
        # (Router chat is OpenAI-compatible, but multimodal support varies by model.)
        if kwargs.get('image'):
            url = f"{self.BASE_URL}/models/{model_to_use}"
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            }

            full_prompt = system_message + "\n\n"
            if conversation_history:
                for msg in conversation_history:
                    role = msg.get('role', 'user')
                    content = msg.get('content', '')
                    if role == 'user':
                        full_prompt += f"User: {content}\n"
                    elif role == 'assistant':
                        full_prompt += f"Assistant: {content}\n"

            full_prompt += f"User: {message}\nAssistant:"
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

            import base64
            image_file = kwargs['image']
            if hasattr(image_file, 'read'):
                image_content = image_file.read()
                if isinstance(image_content, str):
                    image_content = image_content.encode('utf-8')
                base64_image = base64.b64encode(image_content).decode('utf-8')
                payload['image'] = base64_image
                payload['images'] = [base64_image]
                if "<image>" not in full_prompt:
                    payload["inputs"] = f"User: <image>\n{message}\nAssistant:"
        else:
            url = f"{self.ROUTER_V1_BASE_URL}/chat/completions"
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            }

            messages: List[Dict[str, Any]] = []
            # Always add system message
            messages.append({"role": "system", "content": system_message})

            if conversation_history:
                for msg in conversation_history:
                    role = msg.get('role')
                    content = msg.get('content')
                    if role in ('user', 'assistant', 'system') and content:
                        messages.append({"role": role, "content": content})

            messages.append({"role": "user", "content": message})

            payload = {
                "model": model_to_use,
                "messages": messages,
                "max_tokens": kwargs.get('max_tokens', 2048),
                "temperature": kwargs.get('temperature', 0.7),
            }

        try:
            response = await self.client.post(url, json=payload, headers=headers)
            response.raise_for_status()
            
            data = response.json()

            # Router OpenAI-compatible response
            if isinstance(data, dict) and 'choices' in data:
                try:
                    content = data['choices'][0]['message'].get('content', '')
                    if content:
                        return content.strip()
                except Exception:
                    pass

            # HF inference (text-generation) response
            if isinstance(data, list) and len(data) > 0:
                generated_text = data[0].get('generated_text', '')
                if generated_text:
                    return generated_text.strip()
            elif isinstance(data, dict) and 'generated_text' in data:
                generated_text = data.get('generated_text', '')
                if generated_text:
                    return generated_text.strip()
            
            raise Exception(AI_ERRORS["chat_failed"].format(error="No response received"))
            
        except httpx.ReadTimeout:
            raise Exception(AI_ERRORS["chat_timeout"])
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
                raise Exception(AI_ERRORS["model_not_found"])
            elif status_code == 503 or 'loading' in (error_msg or error_text).lower():
                raise Exception(AI_ERRORS["huggingface_model_loading"])
            else:
                error_detail = error_msg or error_text or f"HTTP {status_code}"
                raise Exception(AI_ERRORS["chat_failed"].format(error=error_detail))
        except Exception as e:
            raise Exception(AI_ERRORS["chat_failed"].format(error=str(e)))
    
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

