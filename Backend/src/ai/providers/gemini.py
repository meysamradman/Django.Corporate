from typing import Optional, Dict, Any
from io import BytesIO
import httpx
import os
import json
import re
from .base import BaseProvider
from src.ai.messages.messages import AI_ERRORS


class GeminiProvider(BaseProvider):
    """Provider for Google Gemini API - supports both image and content generation"""
    
    BASE_URL = os.getenv('GEMINI_API_BASE_URL', 'https://generativelanguage.googleapis.com/v1beta')
    
    def __init__(self, api_key: str, config: Optional[Dict[str, Any]] = None):
        super().__init__(api_key, config)
        self.model = config.get('model', 'gemini-1.5-flash') if config else 'gemini-1.5-flash'
    
    def get_provider_name(self) -> str:
        return 'gemini'
    
    # Image generation (not implemented yet for Gemini)
    async def generate_image(self, prompt: str, **kwargs) -> BytesIO:
        """Generate image with Google Gemini"""
        raise NotImplementedError(AI_ERRORS["gemini_not_implemented"])
    
    # Content generation
    async def generate_content(self, prompt: str, **kwargs) -> str:
        """Generate content using Gemini"""
        url = f"{self.BASE_URL}/models/{self.model}:generateContent"
        params = {'key': self.api_key}
        
        word_count = kwargs.get('word_count', 500)
        tone = kwargs.get('tone', 'professional')
        language = kwargs.get('language', 'fa')
        
        # Build prompt with instructions
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
            "contents": [{
                "parts": [{
                    "text": full_prompt
                }]
            }],
            "generationConfig": {
                "temperature": 0.7,
                "topK": 40,
                "topP": 0.95,
                "maxOutputTokens": word_count * 2,  # Approximate token count
            }
        }
        
        try:
            response = await self.client.post(url, params=params, json=payload)
            response.raise_for_status()
            
            data = response.json()
            if 'candidates' in data and len(data['candidates']) > 0:
                content = data['candidates'][0]['content']['parts'][0]['text']
                return content.strip()
            
            raise Exception("No content generated")
            
        except httpx.HTTPStatusError as e:
            status_code = e.response.status_code
            error_msg = ""
            error_text = ""
            
            # Try to get error message from JSON response
            try:
                error_data = e.response.json()
                error_msg = error_data.get('error', {}).get('message', '')
                if not error_msg:
                    error_msg = error_data.get('message', '')
            except (json.JSONDecodeError, ValueError, AttributeError):
                # If response is not JSON, get raw text
                try:
                    error_text = e.response.text[:500] if hasattr(e.response, 'text') and e.response.text else ""
                except:
                    error_text = ""
            
            # Handle specific error cases
            if status_code == 403:
                error_detail = error_msg or error_text or "دسترسی محدود شده است"
                error_lower = error_detail.lower()
                
                # Most common issue: Billing setup or API not enabled (even for free tier)
                if 'api key' in error_lower or 'permission' in error_lower or 'forbidden' in error_lower or 'api_key_not_valid' in error_lower or not error_detail or status_code == 403:
                    raise Exception(
                        "خطای Gemini API: دسترسی به API محدود شده است.\n\n"
                        "🔴 مشکل اصلی: حتی برای Free tier باید دو کار انجام دهید:\n\n"
                        "1️⃣ Setup Billing (رایگان است - فقط verification):\n"
                        "   → به https://console.cloud.google.com/billing بروید\n"
                        "   → یک billing account بسازید (رایگان، فقط برای فعال‌سازی)\n\n"
                        "2️⃣ Enable Generative Language API:\n"
                        "   → به https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com بروید\n"
                        "   → روی دکمه 'Enable' کلیک کنید\n\n"
                        "⏰ بعد از انجام این دو مرحله، 2-3 دقیقه صبر کنید و دوباره امتحان کنید.\n\n"
                        f"جزئیات خطا: {error_detail if error_detail != 'دسترسی محدود شده است' else '403 Forbidden'}"
                    )
                else:
                    raise Exception(
                        f"خطای Gemini API: دسترسی به API محدود شده است.\n\n"
                        f"جزئیات: {error_detail}\n\n"
                        f"لطفاً:\n"
                        f"1. Billing setup کنید: https://console.cloud.google.com/billing\n"
                        f"2. API را enable کنید: https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com"
                    )
            elif status_code == 400:
                error_detail = error_msg or error_text or "درخواست نامعتبر است"
                raise Exception(f"خطای Gemini API: درخواست نامعتبر است. {error_detail}")
            elif status_code == 429:
                raise Exception(
                    "خطای Gemini API: تعداد درخواست‌ها زیاد است. لطفاً چند لحظه صبر کنید و دوباره تلاش کنید."
                )
            elif status_code == 401:
                raise Exception(
                    "خطای Gemini API: API Key نامعتبر است.\n\n"
                    "لطفاً API Key خود را از https://makersuite.google.com/app/apikey بررسی کنید و یک API Key جدید بسازید."
                )
            
            # Generic error
            if error_msg:
                raise Exception(f"خطای Gemini API: {error_msg}")
            elif error_text:
                raise Exception(f"خطای Gemini API (HTTP {status_code}): {error_text[:200]}")
            else:
                raise Exception(f"خطای Gemini API: خطای HTTP {status_code}")
        except Exception as e:
            raise Exception(f"خطا در تولید محتوا: {str(e)}")
    
    async def generate_seo_content(self, topic: str, **kwargs) -> Dict[str, Any]:
        """Generate SEO-optimized structured content"""
        word_count = kwargs.get('word_count', 500)
        tone = kwargs.get('tone', 'professional')
        keywords = kwargs.get('keywords', [])
        
        # Build comprehensive SEO prompt
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
                
                # Parse JSON (might have markdown code blocks)
                content_text = content_text.strip()
                if content_text.startswith('```'):
                    # Remove markdown code blocks
                    content_text = re.sub(r'^```json\s*', '', content_text)
                    content_text = re.sub(r'^```\s*', '', content_text)
                    content_text = re.sub(r'\s*```$', '', content_text)
                
                try:
                    seo_data = json.loads(content_text)
                    return seo_data
                except json.JSONDecodeError:
                    # Fallback: try to extract JSON from text
                    json_match = re.search(r'\{.*\}', content_text, re.DOTALL)
                    if json_match:
                        seo_data = json.loads(json_match.group())
                        return seo_data
                    raise Exception("خطا در تجزیه پاسخ JSON")
            
            raise Exception("هیچ محتوایی تولید نشد")
            
        except httpx.HTTPStatusError as e:
            status_code = e.response.status_code
            error_msg = ""
            error_text = ""
            
            # Try to get error message from JSON response
            try:
                error_data = e.response.json()
                error_msg = error_data.get('error', {}).get('message', '')
                if not error_msg:
                    error_msg = error_data.get('message', '')
            except (json.JSONDecodeError, ValueError, AttributeError):
                # If response is not JSON, get raw text
                try:
                    error_text = e.response.text[:500] if hasattr(e.response, 'text') and e.response.text else ""
                except:
                    error_text = ""
            
            # Handle specific error cases
            if status_code == 403:
                error_detail = error_msg or error_text or "دسترسی محدود شده است"
                error_lower = error_detail.lower()
                
                # Most common issue: Billing setup or API not enabled (even for free tier)
                if 'api key' in error_lower or 'permission' in error_lower or 'forbidden' in error_lower or 'api_key_not_valid' in error_lower or not error_detail or status_code == 403:
                    raise Exception(
                        "خطای Gemini API: دسترسی به API محدود شده است.\n\n"
                        "🔴 مشکل اصلی: حتی برای Free tier باید دو کار انجام دهید:\n\n"
                        "1️⃣ Setup Billing (رایگان است - فقط verification):\n"
                        "   → به https://console.cloud.google.com/billing بروید\n"
                        "   → یک billing account بسازید (رایگان، فقط برای فعال‌سازی)\n\n"
                        "2️⃣ Enable Generative Language API:\n"
                        "   → به https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com بروید\n"
                        "   → روی دکمه 'Enable' کلیک کنید\n\n"
                        "⏰ بعد از انجام این دو مرحله، 2-3 دقیقه صبر کنید و دوباره امتحان کنید.\n\n"
                        f"جزئیات خطا: {error_detail if error_detail != 'دسترسی محدود شده است' else '403 Forbidden'}"
                    )
                else:
                    raise Exception(
                        f"خطای Gemini API: دسترسی به API محدود شده است.\n\n"
                        f"جزئیات: {error_detail}\n\n"
                        f"لطفاً:\n"
                        f"1. Billing setup کنید: https://console.cloud.google.com/billing\n"
                        f"2. API را enable کنید: https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com"
                    )
            elif status_code == 400:
                error_detail = error_msg or error_text or "درخواست نامعتبر است"
                raise Exception(f"خطای Gemini API: درخواست نامعتبر است. {error_detail}")
            elif status_code == 429:
                raise Exception(
                    "خطای Gemini API: تعداد درخواست‌ها زیاد است. لطفاً چند لحظه صبر کنید و دوباره تلاش کنید."
                )
            elif status_code == 401:
                raise Exception(
                    "خطای Gemini API: API Key نامعتبر است.\n\n"
                    "لطفاً API Key خود را از https://makersuite.google.com/app/apikey بررسی کنید و یک API Key جدید بسازید."
                )
            
            # Generic error
            if error_msg:
                raise Exception(f"خطای Gemini API: {error_msg}")
            elif error_text:
                raise Exception(f"خطای Gemini API (HTTP {status_code}): {error_text[:200]}")
            else:
                raise Exception(f"خطای Gemini API: خطای HTTP {status_code}")
        except json.JSONDecodeError as e:
            raise Exception(f"خطا در تجزیه پاسخ: {str(e)}")
        except Exception as e:
            raise Exception(f"خطا در تولید محتوا: {str(e)}")
    
    # Chat method
    async def chat(self, message: str, conversation_history: Optional[list] = None, **kwargs) -> str:
        """Chat with Gemini AI - supports conversation history"""
        url = f"{self.BASE_URL}/models/{self.model}:generateContent"
        params = {'key': self.api_key}
        
        # Build conversation history
        contents = []
        
        # Add conversation history if provided
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
        
        # Add current message
        contents.append({
            "role": "user",
            "parts": [{"text": message}]
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
            
            raise Exception("هیچ پاسخی دریافت نشد")
            
        except httpx.ReadTimeout:
            raise Exception("زمان پاسخ به پایان رسید. لطفاً دوباره تلاش کنید.")
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
                raise Exception(
                    "خطای Gemini API: دسترسی به API محدود شده است.\n\n"
                    "لطفاً:\n"
                    "1. Billing setup کنید: https://console.cloud.google.com/billing\n"
                    "2. API را enable کنید: https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com"
                )
            elif status_code == 429:
                raise Exception("خطای Gemini API: تعداد درخواست‌ها زیاد است. لطفاً چند لحظه صبر کنید.")
            elif status_code == 401:
                raise Exception("خطای Gemini API: API Key نامعتبر است.")
            else:
                error_detail = error_msg or error_text or f"HTTP {status_code}"
                raise Exception(f"خطای Gemini API: {error_detail}")
        except Exception as e:
            raise Exception(f"خطا در چت: {str(e)}")
    
    def validate_api_key(self) -> bool:
        """Validate API key with a test request"""
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

