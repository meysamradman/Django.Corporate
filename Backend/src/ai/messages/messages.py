GENERIC_PROVIDER_ERROR = "خطا در ارتباط با سرویس‌دهنده"
GENERIC_PROVIDER_RATE_LIMIT = "تعداد درخواست‌های شما بیش از حد مجاز است. لطفاً چند لحظه صبر کنید"
GENERIC_PROVIDER_INVALID_KEY = "کلید API نامعتبر است. لطفاً API Key صحیح را وارد کنید"
GENERIC_PROVIDER_TIMEOUT = "زمان درخواست به پایان رسید. لطفاً دوباره تلاش کنید"
GENERIC_PROVIDER_JSON_ERROR = "خطا در پردازش پاسخ"
GENERIC_PROVIDER_QUOTA = "سهمیه یا اعتبار سرویس‌دهنده تمام شده است"


# ============================================================================
# AI Success Messages (Consolidated & Essential Only)
# ============================================================================
AI_SUCCESS = {
    # Provider & Model Management
    "providers_list_retrieved": "لیست سرویس‌دهنده‌ها دریافت شد",
    "capabilities_retrieved": "قابلیت‌های {provider_name} دریافت شد",
    "all_capabilities_retrieved": "تمام قابلیت‌ها دریافت شد",
    "models_list_retrieved": "لیست مدل‌ها دریافت شد{from_cache}",
    "provider_updated": "سرویس‌دهنده به‌روزرسانی شد",
    "provider_created": "سرویس‌دهنده ساخته شد",
    "provider_activated": "سرویس‌دهنده فعال شد",
    "provider_deactivated": "سرویس‌دهنده غیرفعال شد",
    "model_activated": "مدل فعال شد",
    "api_key_valid": "کلید API معتبر است",
    
    # Content Generation
    "content_generated": "محتوا تولید شد",
    "content_generated_and_saved": "محتوا تولید و ذخیره شد",
    "content_saved": "محتوا ذخیره شد",
    "destinations_retrieved": "لیست مقصدها دریافت شد",
    
    # Image Generation
    "image_generated": "تصویر تولید شد",
    "image_generated_and_saved": "تصویر تولید و ذخیره شد",
    "image_generated_not_saved": "تصویر تولید شد اما ذخیره نشد",
    "image_saved": "تصویر ذخیره شد",
    
    # Chat
    "message_sent": "پیام ارسال شد",
    
    # Audio
    "audio_generated": "فایل صوتی تولید شد",
    "audio_generated_and_saved": "فایل صوتی تولید و ذخیره شد",
    
    # Settings
    "settings_updated": "تنظیمات به‌روزرسانی شد",
    "settings_retrieved": "تنظیمات دریافت شد",
    
    # Cache & Other
    "cache_cleared": "کش پاک شد",
    
    # Provider-specific Models
    "openrouter_models_retrieved": "لیست مدل‌های OpenRouter دریافت شد{from_cache}",
    "groq_models_retrieved": "لیست مدل‌های Groq دریافت شد{from_cache}",
    "huggingface_models_retrieved": "لیست مدل‌های HuggingFace دریافت شد{from_cache}",
}


# ============================================================================
# AI Error Messages (Consolidated & Essential Only)
# ============================================================================
AI_ERRORS = {
    # Generic Network & Provider Errors
    "generic_provider_error": GENERIC_PROVIDER_ERROR,
    "generic_rate_limit": GENERIC_PROVIDER_RATE_LIMIT,
    "generic_api_key_invalid": GENERIC_PROVIDER_INVALID_KEY,
    "generic_timeout": GENERIC_PROVIDER_TIMEOUT,
    "generic_json_error": GENERIC_PROVIDER_JSON_ERROR,
    "quota_exceeded": GENERIC_PROVIDER_QUOTA,
    "generic_quota_exceeded": GENERIC_PROVIDER_QUOTA,
    "connection_timeout": "زمان اتصال به سرویس‌دهنده به پایان رسید",
    "generic_model_not_found": "مدل یافت نشد",
    
    # API Key & Authentication
    "api_key_required": "کلید API الزامی است",
    "api_key_invalid": "کلید API نامعتبر است",
    "api_key_not_provided": "کلید API ارائه نشده است",
    "shared_api_key_not_set": "کلید API اشتراکی برای {provider_name} تنظیم نشده است",
    
    # Provider & Model Errors
    "provider_not_supported": "این سرویس‌دهنده پشتیبانی نمی‌شود",
    "provider_not_found_or_inactive": "سرویس‌دهنده یافت نشد یا غیرفعال است",
    "provider_not_authorized": "دسترسی به این سرویس‌دهنده ندارید",
    "provider_not_available": "سرویس‌دهنده در دسترس نیست",
    "provider_access_blocked": "دسترسی به سرویس‌دهنده محدود یا قطع شده است",
    "provider_api_inactive": "API سرویس‌دهنده فعال نیست",
    "provider_server_unreachable": "ارتباط با سرور سرویس‌دهنده برقرار نشد",
    "provider_model_paid_required": "این مدل نیازمند پلن یا اعتبار پولی است",
    "provider_limit_exceeded": "محدودیت استفاده شما از سرویس‌دهنده به پایان رسیده است",
    "no_active_providers": "هیچ سرویس‌دهنده فعالی یافت نشد",
    "no_active_model_any_provider": "هیچ مدل فعالی برای قابلیت {capability} یافت نشد",
    "model_not_found": "مدل یافت نشد",
    "no_active_model": "هیچ مدل فعالی برای این سرویس‌دهنده وجود ندارد",
    "model_no_capability": "این مدل از این قابلیت پشتیبانی نمی‌کند",
    "model_access_denied": "دسترسی به این مدل ندارید",
    "operation_not_supported": "این عملیات توسط سرویس‌دهنده پشتیبانی نمی‌شود",
    "api_key_not_set": "کلید API برای {provider_name} تنظیم نشده است",
    "providers_list_error": "خطا در دریافت لیست سرویس‌دهنده‌ها",
    "provider_tts_not_supported": "این سرویس‌دهنده از تولید فایل صوتی پشتیبانی نمی‌کند",
    "destination_not_supported": "مقصد {destination} پشتیبانی نمی‌شود",
    
    # Content Generation Errors
    "content_generation_failed": "خطا در تولید محتوا. لطفاً دوباره تلاش کنید",
    "content_generation_timeout": "زمان تولید محتوا به پایان رسید",
    
    # Image Generation Errors
    "image_generation_failed": "خطا در تولید تصویر. لطفاً دوباره تلاش کنید",
    "image_generation_failed_simple": "تولید تصویر ناموفق بود",
    "image_download_failed": "خطا در دریافت فایل تصویر",
    "prompt_invalid": "پرامپت تولید تصویر نامعتبر است",
    "invalid_response": "پاسخ نامعتبر از سرویس‌دهنده",
    "image_generation_timeout": "زمان تولید تصویر به پایان رسید",
    "image_timeout": "زمان تولید تصویر به پایان رسید",
    "image_generation_http_error": "خطای HTTP در تولید تصویر",
    "image_quota_exceeded": "سهمیه تولید تصویر به پایان رسیده است",
    "image_rate_limit": "تعداد درخواست‌های تولید تصویر بیش از حد مجاز است",
    
    # Chat Errors
    "chat_failed": "خطا در برقراری گفت‌وگو. لطفاً دوباره تلاش کنید",
    "chat_quota_exceeded": "سهمیه چت تمام شده است",
    "chat_rate_limit": "تعداد درخواست‌های چت بیش از حد مجاز است",
    "chat_forbidden": "دسترسی به چت ممنوع است",
    "chat_timeout": "زمان چت به پایان رسید",
    
    # Audio Errors
    "audio_generation_failed": "خطا در تولید فایل صوتی",
    
    # Validation Errors
    "validation_error": "خطا در اعتبارسنجی اطلاعات",
    "provider_name_duplicate": "این نام قبلاً استفاده شده است",
    "invalid_json": "فرمت داده نامعتبر است",
    "json_parse_error": "خطا در پردازش JSON",
    "slug_required": "فیلد slug الزامی است",
    "capability_required": "پارامتر capability الزامی است",
    "destination_invalid": "مقصد انتخاب شده نامعتبر است",
    "activation_failed": "فعال‌سازی ناموفق بود",
    
    # Permission Errors
    "not_authorized": "دسترسی مجاز نیست",
    "permission_denied": "شما دسترسی به این بخش ندارید",
    "settings_not_authorized": "دسترسی به تنظیمات ندارید",
    "content_not_authorized": "دسترسی به تولید محتوا ندارید",
    "audio_not_authorized": "دسترسی به تولید صوت ندارید",
    "chat_not_authorized": "دسترسی به چت ندارید",
    
    # Provider-specific Errors
    "openrouter_not_active": "سرویس OpenRouter فعال نیست",
    "openrouter_models_error": "خطا در دریافت مدل‌های OpenRouter",
    "groq_not_active": "سرویس Groq فعال نیست",
    "groq_models_error": "خطا در دریافت مدل‌های Groq",
    "huggingface_not_active": "سرویس HuggingFace فعال نیست",
    "huggingface_models_error": "خطا در دریافت مدل‌های HuggingFace",
    "huggingface_model_loading": "مدل HuggingFace در حال بارگذاری است. لطفاً بعداً تلاش کنید",
    "gemini_not_implemented": "این قابلیت برای Gemini پیاده‌سازی نشده است",
    
    # Settings & Other
    "settings_not_found": "تنظیمات یافت نشد",
    "models_list_error": "خطا در دریافت لیست مدل‌ها",
    "cache_clear_error": "خطا در پاک کردن کش",
}


# ============================================================================
# Backward Compatibility Aliases
# ============================================================================
# این alias‌ها برای سازگاری با کدهای قبلی هستند
IMAGE_ERRORS = AI_ERRORS
CHAT_ERRORS = AI_ERRORS
CONTENT_ERRORS = AI_ERRORS


# ============================================================================
# Note: AI Prompts have been moved to src/ai/prompts/ module
# ============================================================================
# Prompts برای تولید محتوا، تصویر، پادکست و چت در ماژول جداگانه قرار دارند:
# - src/ai/prompts/content.py  - prompts تولید محتوا
# - src/ai/prompts/image.py    - prompts تولید تصویر
# - src/ai/prompts/audio.py    - prompts پادکست
# - src/ai/prompts/chat.py     - prompts و system messages چت
#
# این ساختار به Super Admin این امکان را می‌دهد که prompts را راحت‌تر مدیریت کند
# و در آینده می‌توانیم prompts را از database هم بخوانیم


# ============================================================================
# AI System Messages (برای تعریف شخصیت AI)
# ============================================================================
# DEPRECATED: این پیام‌ها به src/ai/prompts/chat.py منتقل شده‌اند
# برای سازگاری با کدهای قدیمی، فعلاً نگه داشته شده‌اند

AI_SYSTEM_MESSAGES = {
    "content_writer": "شما یک نویسنده محتوای حرفه‌ای و متخصص سئو هستید. محتوای تولیدی شما باید دقیق، خوانا، و برای موتورهای جستجو بهینه باشد.",
    "chat_assistant": "شما یک دستیار هوشمند و مفید هستید که به زبان فارسی پاسخ می‌دهید. پاسخ‌های شما باید واضح، دقیق و کاربردی باشند.",
    "image_assistant": "شما یک متخصص طراحی هستید که می‌تواند توضیحات تصویر را به پرامپت‌های بهینه تبدیل کنید.",
}

DEEPSEEK_SYSTEM_MESSAGES = {
    "content_writer": "شما یک نویسنده محتوای حرفه‌ای و متخصص سئو هستید که به زبان فارسی مینویسید. محتوای شما باید دقیق، خوانا، و برای موتورهای جستجو بهینه باشد.",
    "chat_assistant": "شما یک دستیار هوشمند هستید که به زبان فارسی پاسخ می‌دهید. پاسخ‌های شما باید واضح، دقیق و مفید باشند.",
}
