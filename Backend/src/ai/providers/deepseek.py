from typing import Optional, Dict, Any
from io import BytesIO
import httpx
import json
import os
from .base import BaseProvider


class DeepSeekProvider(BaseProvider):
    """
    Provider for DeepSeek API - supports chat and content generation
    DeepSeek uses OpenAI-compatible API format
    """
    
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
        
        full_prompt = f"""لطفاً یک محتوای حرفه‌ای و سئو شده به زبان فارسی بنویسید.

موضوع: {prompt}

ملاحظات:
- طول محتوا: حدود {word_count} کلمه
- سبک: {tone}
- محتوا باید برای SEO بهینه باشد
- استفاده از کلمات کلیدی طبیعی
- ساختار منطقی و خوانا

محتوا را به صورت متن ساده بدون فرمت خاص بنویسید."""
        
        payload = {
            "model": self.content_model,
            "messages": [
                {"role": "system", "content": "شما یک نویسنده حرفه‌ای و متخصص SEO هستید که به زبان فارسی می‌نویسید."},
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
            
            raise Exception("هیچ پاسخی دریافت نشد")
            
        except httpx.HTTPStatusError as e:
            status_code = e.response.status_code
            try:
                error_data = e.response.json()
                error_msg = error_data.get('error', {}).get('message', '')
                
                if status_code == 429:
                    raise Exception("خطای DeepSeek API: تعداد درخواست‌ها زیاد است. لطفاً چند لحظه صبر کنید.")
                elif status_code == 401:
                    raise Exception("خطای DeepSeek API: API Key نامعتبر است.")
                elif status_code == 403:
                    raise Exception("خطای DeepSeek API: دسترسی به API محدود شده است.")
                
                raise Exception(f"خطای DeepSeek API: {error_msg}")
            except Exception as ex:
                if 'خطای DeepSeek API' in str(ex):
                    raise ex
                if status_code == 429:
                    raise Exception("خطای DeepSeek API: تعداد درخواست‌ها زیاد است (rate limit: هر 3 ثانیه یک درخواست).")
                raise Exception(f"خطای HTTP {status_code}")
        except Exception as e:
            raise Exception(f"خطا در تولید محتوا: {str(e)}")
    
    async def generate_seo_content(self, topic: str, **kwargs) -> Dict[str, Any]:
        import re
        from django.utils.text import slugify
        
        word_count = kwargs.get('word_count', 500)
        tone = kwargs.get('tone', 'professional')
        keywords = kwargs.get('keywords', [])
        
        keywords_str = ', '.join(keywords) if keywords else ''
        
        prompt = f"""لطفاً یک محتوای حرفه‌ای و سئو شده به زبان فارسی برای موضوع "{topic}" بنویسید.

ملاحظات:
- طول محتوا: حدود {word_count} کلمه
- سبک: {tone}
- محتوا باید برای SEO بهینه باشد
- استفاده از کلمات کلیدی: {keywords_str if keywords_str else 'طبیعی و مرتبط'}
- ساختار منطقی و خوانا
- محتوا باید شامل تگ‌های HTML <h2> و <h3> باشد

لطفاً پاسخ را به صورت JSON با فرمت زیر برگردانید:
{{
    "title": "عنوان اصلی (H1)",
    "meta_title": "عنوان متا برای SEO (50-60 کاراکتر)",
    "meta_description": "توضیحات متا برای SEO (150-160 کاراکتر)",
    "slug": "slug-url-friendly",
    "h1": "عنوان اصلی",
    "h2_list": ["عنوان H2 اول", "عنوان H2 دوم", ...],
    "h3_list": ["عنوان H3 اول", "عنوان H3 دوم", ...],
    "content": "<p>در دنیای امروز، [موضوع] یکی از مهم‌ترین عوامل موفقیت است. محتوای کامل باید با تگ‌های HTML باشد.</p>\n\n<h2>عنوان H2 اول</h2>\n<p>محتوا مربوط به بخش اول که شامل کلمات کلیدی طبیعی است.</p>\n\n<h3>عنوان H3 اول</h3>\n<p>محتوا مربوط به زیربخش H3 با جزئیات بیشتر.</p>\n\n<h2>عنوان H2 دوم</h2>\n<p>محتوا مربوط به بخش دوم که بهینه شده برای SEO است.</p>",
    "keywords": ["کلمه کلیدی 1", "کلمه کلیدی 2", ...]
}}

مهم: حتماً تگ‌های <h2> و <h3> را در داخل فیلد "content" قرار دهید و مطمئن شوید که h2_list و h3_list با تگ‌های موجود در content مطابقت دارند."""
        
        url = f"{self.BASE_URL}/chat/completions"
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        
        payload = {
            "model": self.content_model,
            "messages": [
                {"role": "system", "content": "شما یک متخصص SEO و نویسنده حرفه‌ای هستید. همیشه پاسخ را به صورت JSON معتبر برگردانید."},
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
                        raise Exception("پاسخ در فرمت JSON معتبر نیست")
                
                if 'slug' not in seo_data or not seo_data['slug']:
                    seo_data['slug'] = slugify(seo_data.get('title', topic))
                
                return seo_data
            
            raise Exception("هیچ پاسخی دریافت نشد")
            
        except httpx.HTTPStatusError as e:
            status_code = e.response.status_code
            try:
                error_data = e.response.json()
                error_msg = error_data.get('error', {}).get('message', '')
                
                if status_code == 429:
                    raise Exception("خطای DeepSeek API: تعداد درخواست‌ها زیاد است. لطفاً چند لحظه صبر کنید (rate limit: هر 3 ثانیه یک درخواست).")
                elif status_code == 401:
                    raise Exception("خطای DeepSeek API: API Key نامعتبر است.")
                elif status_code == 403:
                    raise Exception("خطای DeepSeek API: دسترسی به API محدود شده است.")
                
                raise Exception(f"خطای DeepSeek API: {error_msg}")
            except Exception as ex:
                if 'خطای DeepSeek API' in str(ex):
                    raise ex
                if status_code == 429:
                    raise Exception("خطای DeepSeek API: تعداد درخواست‌ها زیاد است (rate limit: هر 3 ثانیه یک درخواست).")
                raise Exception(f"خطای HTTP {status_code}")
        except json.JSONDecodeError as e:
            raise Exception(f"خطا در تجزیه پاسخ JSON: {str(e)}")
        except Exception as e:
            raise Exception(f"خطا در تولید محتوا: {str(e)}")
    
    async def chat(self, message: str, conversation_history: Optional[list] = None, **kwargs) -> str:
        url = f"{self.BASE_URL}/chat/completions"
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        
        messages = []
        
        system_message = kwargs.get('system_message', 'شما یک دستیار هوشمند و مفید هستید که به زبان فارسی پاسخ می‌دهید.')
        if system_message:
            messages.append({"role": "system", "content": system_message})
        
        if conversation_history:
            for msg in conversation_history:
                role = msg.get('role', 'user')
                content = msg.get('content', '')
                if role in ['user', 'assistant']:
                    messages.append({"role": role, "content": content})
        
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
            
            raise Exception("هیچ پاسخی دریافت نشد")
            
        except httpx.HTTPStatusError as e:
            status_code = e.response.status_code
            try:
                error_data = e.response.json()
                error_msg = error_data.get('error', {}).get('message', '')
                
                if status_code == 429:
                    raise Exception("خطای DeepSeek API: تعداد درخواست‌ها زیاد است. لطفاً چند لحظه صبر کنید (rate limit: هر 3 ثانیه یک درخواست).")
                elif status_code == 401:
                    raise Exception("خطای DeepSeek API: API Key نامعتبر است.")
                elif status_code == 403:
                    raise Exception("خطای DeepSeek API: دسترسی به API محدود شده است.")
                
                raise Exception(f"خطای DeepSeek API: {error_msg}")
            except Exception as ex:
                if 'خطای DeepSeek API' in str(ex):
                    raise ex
                if status_code == 429:
                    raise Exception("خطای DeepSeek API: تعداد درخواست‌ها زیاد است یا rate limit (هر 3 ثانیه یک درخواست).")
                raise Exception(f"خطای HTTP {status_code}")
        except Exception as e:
            raise Exception(f"خطا در چت: {str(e)}")
    
    def validate_api_key(self) -> bool:
        try:
            url = f"{self.BASE_URL}/models"
            headers = {"Authorization": f"Bearer {self.api_key}"}
            
            with httpx.Client(timeout=10.0) as client:
                response = client.get(url, headers=headers)
                return response.status_code == 200
        except:
            return False

