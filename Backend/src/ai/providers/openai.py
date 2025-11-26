from typing import Optional, Dict, Any
from io import BytesIO
import httpx
import base64
import os
import json
import re
from .base import BaseProvider
from src.ai.messages.messages import AI_ERRORS


class OpenAIProvider(BaseProvider):
    """Provider for OpenAI API - supports both DALL-E (image) and GPT (content) generation"""
    
    BASE_URL = os.getenv('OPENAI_API_BASE_URL', 'https://api.openai.com/v1')
    
    def __init__(self, api_key: str, config: Optional[Dict[str, Any]] = None):
        super().__init__(api_key, config)
        # Default to DALL-E for image, but can be overridden
        self.image_model = config.get('image_model', 'dall-e-3') if config else 'dall-e-3'
        self.content_model = config.get('content_model', 'gpt-4o-mini') if config else 'gpt-4o-mini'
    
    def get_provider_name(self) -> str:
        return 'openai'
    
    # Image generation (DALL-E)
    async def generate_image(self, prompt: str, **kwargs) -> BytesIO:
        """Generate image with DALL-E"""
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
    
    # Content generation (GPT)
    async def generate_content(self, prompt: str, **kwargs) -> str:
        """Generate content using OpenAI GPT"""
        url = f"{self.BASE_URL}/chat/completions"
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        
        word_count = kwargs.get('word_count', 500)
        tone = kwargs.get('tone', 'professional')
        
        full_prompt = f"""Write a professional SEO-optimized content in Persian (Farsi) language.

Topic: {prompt}

Requirements:
- Word count: approximately {word_count} words
- Style: {tone}
- Content should be SEO optimized
- Natural keyword usage
- Logical and readable structure

Write the content as plain text without special formatting."""
        
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
            
            raise Exception("No content generated")
            
        except httpx.HTTPStatusError as e:
            try:
                error_data = e.response.json()
                error_msg = error_data.get('error', {}).get('message', '')
                raise Exception(f"خطای OpenAI API: {error_msg}")
            except:
                raise Exception(f"خطای HTTP {e.response.status_code}")
        except Exception as e:
            raise Exception(f"خطا در تولید محتوا: {str(e)}")
    
    async def generate_seo_content(self, topic: str, **kwargs) -> Dict[str, Any]:
        """Generate SEO-optimized structured content"""
        word_count = kwargs.get('word_count', 500)
        tone = kwargs.get('tone', 'professional')
        keywords = kwargs.get('keywords', [])
        
        keywords_str = f"، {', '.join(keywords)}" if keywords else ""
        
        seo_prompt = f"""لطفاً یک محتوای وبلاگ حرفه‌ای و کاملاً سئو شده به زبان فارسی برای موضوع زیر بنویسید:

موضوع: {topic}{keywords_str}

نیاز دارم به فرمت JSON دقیق زیر:
{{
    "title": "عنوان اصلی (H1) - حداکثر 60 کاراکتر، جذاب و شامل کلمه کلیدی",
    "meta_title": "عنوان متا SEO - دقیقاً 50-60 کاراکتر، شامل کلمه کلیدی اصلی",
    "meta_description": "توضیحات متا SEO - دقیقاً 150-160 کاراکتر، جذاب و شامل کلمه کلیدی",
    "slug": "url-friendly-slug",
    "h1": "عنوان اصلی (H1) - باید دقیقاً همان title باشد",
    "h2_list": ["عنوان H2 اول که در محتوا استفاده می‌شود", "عنوان H2 دوم", "حداقل 2-3 عنوان H2"],
    "h3_list": ["عنوان H3 اول که در محتوا استفاده می‌شود", "عنوان H3 دوم", "حداقل 2-3 عنوان H3"],
    "content": "<p>در دنیای امروز، [موضوع] یکی از مهم‌ترین عوامل موفقیت در فضای دیجیتال است. یک وب‌سایت خوب باید هم از نظر ظاهری جذاب باشد و هم از نظر تجربه کاربری عالی عمل کند.</p>\n\n<h2>عنوان H2 اول</h2>\n<p>محتوا مربوط به بخش اول محتوا برای موضوع H2. کلمات کلیدی به صورت طبیعی استفاده می‌شوند. محتوا باید SEO-optimized باشد.</p>\n\n<h3>عنوان H3 اول</h3>\n<p>محتوا مربوط به زیربخش H3. این بخش جزئیات بیشتری از موضوع اصلی را پوشش می‌دهد.</p>\n\n<h2>عنوان H2 دوم</h2>\n<p>محتوا مربوط به بخش دوم.... محتوای کامل باید حدود {word_count} کلمه باشد و شامل تگ‌های HTML <p>, <h2> و <h3> باشد.</p>",
    "keywords": ["کلمه کلیدی 1", "کلمه کلیدی 2", "کلمه کلیدی 3"],
    "word_count": {word_count}
}}

مهم و ضروری:
1. محتوا باید دقیقاً حدود {word_count} کلمه باشد (فقط متن، بدون احتساب HTML tags)
2. در فیلد content باید تگ‌های HTML <h2> و <h3> را به صورت صحیح قرار دهید
3. عناوین در h2_list و h3_list باید دقیقاً همان عناوینی باشند که در content استفاده شده‌اند
4. از کلمات کلیدی طبیعی استفاده کنید (keyword stuffing نکنید)
5. محتوا باید حرفه‌ای، خوانا و برای خواننده مفید باشد
6. h1 باید دقیقاً همان title باشد
7. فقط JSON معتبر را برگردانید، بدون توضیحات اضافی
8. تمام مقادیر باید به زبان فارسی باشد
9. در content، تگ‌ها را به صورت <h2>عنوان</h2> و <h3>عنوان</h3> قرار دهید"""
        
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
                    # Try to extract JSON
                    json_match = re.search(r'\{.*\}', content_text, re.DOTALL)
                    if json_match:
                        seo_data = json.loads(json_match.group())
                        return seo_data
                    raise Exception("خطا در تجزیه پاسخ JSON")
            
            raise Exception("هیچ محتوایی تولید نشد")
            
        except httpx.HTTPStatusError as e:
            status_code = e.response.status_code
            try:
                error_data = e.response.json()
                error_msg = error_data.get('error', {}).get('message', '')
                
                # Handle specific error cases
                if status_code == 429:
                    if 'quota' in error_msg.lower() or 'billing' in error_msg.lower():
                        raise Exception(
                            "خطای OpenAI API: اعتبار حساب شما تمام شده است. لطفاً به https://platform.openai.com/account/billing مراجعه کنید و حساب خود را شارژ کنید."
                        )
                    else:
                        raise Exception(
                            "خطای OpenAI API: تعداد درخواست‌ها زیاد است. لطفاً چند لحظه صبر کنید و دوباره تلاش کنید."
                        )
                elif status_code == 401:
                    raise Exception("خطای OpenAI API: API Key نامعتبر است. لطفاً API Key خود را بررسی کنید.")
                elif status_code == 403:
                    raise Exception("خطای OpenAI API: دسترسی به API محدود شده است. لطفاً تنظیمات حساب خود را بررسی کنید.")
                
                raise Exception(f"خطای OpenAI API: {error_msg}")
            except Exception as ex:
                # If it's already our custom exception, re-raise it
                if 'خطای OpenAI API' in str(ex) or 'خطا در تولید محتوا' in str(ex):
                    raise ex
                # Otherwise, raise generic HTTP error
                if status_code == 429:
                    raise Exception("خطای OpenAI API: تعداد درخواست‌ها زیاد است یا اعتبار حساب تمام شده. لطفاً چند لحظه صبر کنید یا حساب خود را شارژ کنید.")
                raise Exception(f"خطای HTTP {status_code}")
        except json.JSONDecodeError as e:
            raise Exception(f"خطا در تجزیه پاسخ: {str(e)}")
        except Exception as e:
            raise Exception(f"خطا در تولید محتوا: {str(e)}")
    
    # Chat method
    async def chat(self, message: str, conversation_history: Optional[list] = None, **kwargs) -> str:
        """Chat with OpenAI GPT - supports conversation history"""
        url = f"{self.BASE_URL}/chat/completions"
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        
        # Build messages array
        messages = []
        
        # Add system message (optional)
        system_message = kwargs.get('system_message', 'شما یک دستیار هوشمند و مفید هستید که به زبان فارسی پاسخ می‌دهید.')
        if system_message:
            messages.append({"role": "system", "content": system_message})
        
        # Add conversation history if provided
        if conversation_history:
            for msg in conversation_history:
                role = msg.get('role', 'user')
                content = msg.get('content', '')
                # Map 'assistant' to 'assistant' and 'user' to 'user'
                if role in ['user', 'assistant']:
                    messages.append({"role": role, "content": content})
        
        # Add current message
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
            
            raise Exception("هیچ پاسخی دریافت نشد")
            
        except httpx.HTTPStatusError as e:
            status_code = e.response.status_code
            try:
                error_data = e.response.json()
                error_msg = error_data.get('error', {}).get('message', '')
                
                if status_code == 429:
                    if 'quota' in error_msg.lower() or 'billing' in error_msg.lower():
                        raise Exception(
                            "خطای OpenAI API: اعتبار حساب شما تمام شده است. لطفاً به https://platform.openai.com/account/billing مراجعه کنید."
                        )
                    else:
                        raise Exception("خطای OpenAI API: تعداد درخواست‌ها زیاد است. لطفاً چند لحظه صبر کنید.")
                elif status_code == 401:
                    raise Exception("خطای OpenAI API: API Key نامعتبر است.")
                elif status_code == 403:
                    raise Exception("خطای OpenAI API: دسترسی به API محدود شده است.")
                
                raise Exception(f"خطای OpenAI API: {error_msg}")
            except Exception as ex:
                if 'خطای OpenAI API' in str(ex):
                    raise ex
                if status_code == 429:
                    raise Exception("خطای OpenAI API: تعداد درخواست‌ها زیاد است یا اعتبار حساب تمام شده.")
                raise Exception(f"خطای HTTP {status_code}")
        except Exception as e:
            raise Exception(f"خطا در چت: {str(e)}")
    
    # Text-to-Speech (TTS) method
    async def text_to_speech(self, text: str, **kwargs) -> BytesIO:
        """Convert text to speech using OpenAI TTS API"""
        url = f"{self.BASE_URL}/audio/speech"
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        
        # TTS parameters
        model = kwargs.get('model', 'tts-1')  # tts-1 (fast) or tts-1-hd (high quality)
        voice = kwargs.get('voice', 'alloy')  # alloy, echo, fable, onyx, nova, shimmer
        response_format = kwargs.get('response_format', 'mp3')  # mp3, opus, aac, flac
        speed = kwargs.get('speed', 1.0)  # 0.25 to 4.0
        
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
            
            # Return audio bytes
            return BytesIO(response.content)
            
        except httpx.HTTPStatusError as e:
            status_code = e.response.status_code
            try:
                error_data = e.response.json()
                error_msg = error_data.get('error', {}).get('message', '')
                
                if status_code == 429:
                    if 'quota' in error_msg.lower() or 'billing' in error_msg.lower():
                        raise Exception(
                            "خطای OpenAI API: اعتبار حساب شما تمام شده است. لطفاً به https://platform.openai.com/account/billing مراجعه کنید."
                        )
                    else:
                        raise Exception("خطای OpenAI API: تعداد درخواست‌ها زیاد است. لطفاً چند لحظه صبر کنید.")
                elif status_code == 401:
                    raise Exception("خطای OpenAI API: API Key نامعتبر است.")
                elif status_code == 403:
                    raise Exception("خطای OpenAI API: دسترسی به API محدود شده است.")
                
                raise Exception(f"خطای OpenAI API: {error_msg}")
            except Exception as ex:
                if 'خطای OpenAI API' in str(ex):
                    raise ex
                if status_code == 429:
                    raise Exception("خطای OpenAI API: تعداد درخواست‌ها زیاد است یا اعتبار حساب تمام شده.")
                raise Exception(f"خطای HTTP {status_code}")
        except Exception as e:
            raise Exception(f"خطا در تولید صدا: {str(e)}")
    
    def validate_api_key(self) -> bool:
        """Validate API key"""
        try:
            url = f"{self.BASE_URL}/models"
            headers = {"Authorization": f"Bearer {self.api_key}"}
            
            with httpx.Client(timeout=10.0) as client:
                response = client.get(url, headers=headers)
                return response.status_code == 200
        except:
            return False

