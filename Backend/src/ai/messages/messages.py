# AI Messages - Centralized Messages System
# Divided by capability: chat, content, image, audio

# ========================================
# CHAT MESSAGES
# ========================================
CHAT_SUCCESS = {
    "message_sent": "پیام با موفقیت ارسال شد و پاسخ دریافت شد.",
    "providers_list_retrieved": "لیست Provider های فعال دریافت شد.",
    "capabilities_retrieved": "قابلیت‌های Chat برای {provider_name} دریافت شد.",
    "all_capabilities_retrieved": "قابلیت‌های Chat تمام Provider ها دریافت شد.",
    "openrouter_models_retrieved": "لیست مدل‌های OpenRouter دریافت شد{from_cache}.",
    "groq_models_retrieved": "لیست مدل‌های Groq دریافت شد{from_cache}.",
    "cache_cleared": "کش مدل‌های OpenRouter پاک شد.",
    "provider_cache_cleared": "کش مدل‌های OpenRouter برای {provider} پاک شد.",
}

CHAT_ERRORS = {
    "chat_not_authorized": "شما به چت با AI دسترسی ندارید.",
    "validation_error": "خطا در اعتبارسنجی داده‌ها.",
    "chat_failed": "خطا در چت: {error}",
    "provider_not_supported": "Provider '{provider_name}' از قابلیت Chat پشتیبانی نمی‌کند.",
    "providers_list_error": "خطا در دریافت لیست Provider ها: {error}",
    "openrouter_not_active": "OpenRouter فعال نیست. لطفاً ابتدا OpenRouter را در تنظیمات AI فعال کنید.",
    "openrouter_models_error": "خطا در دریافت لیست مدل‌های OpenRouter: {error}",
    "openrouter_permission_denied": "شما دسترسی لازم برای مشاهده مدل‌های OpenRouter را ندارید.",
    "groq_not_active": "Groq فعال نیست. لطفاً ابتدا Groq را در تنظیمات AI فعال کنید.",
    "groq_models_error": "خطا در دریافت لیست مدل‌های Groq: {error}",
    "groq_permission_denied": "شما دسترسی لازم برای مشاهده مدل‌های Groq را ندارید.",
    "cache_clear_permission_denied": "شما دسترسی لازم برای پاک کردن کش مدل‌ها را ندارید.",
    "cache_clear_error": "خطا در پاک کردن کش: {error}",
}

# ========================================
# CONTENT GENERATION MESSAGES
# ========================================
CONTENT_SUCCESS = {
    "content_generated": "محتوای SEO با موفقیت تولید شد.",
    "content_generated_cached": "محتوای SEO از cache بازگردانده شد.",
    "content_saved_to_blog": "محتوا با موفقیت در بلاگ ذخیره شد.",
    "content_saved_to_portfolio": "محتوا با موفقیت در نمونه‌کار ذخیره شد.",
    "content_not_saved": "محتوا فقط نمایش داده شد و ذخیره نشد.",
    "providers_list_retrieved": "لیست Provider های فعال دریافت شد.",
    "capabilities_retrieved": "قابلیت‌های تولید محتوا برای {provider_name} دریافت شد.",
    "all_capabilities_retrieved": "قابلیت‌های تولید محتوا تمام Provider ها دریافت شد.",
    "openrouter_models_retrieved": "لیست مدل‌های تولید محتوا OpenRouter دریافت شد{from_cache}.",
    "groq_models_retrieved": "لیست مدل‌های Groq دریافت شد{from_cache}.",
    "cache_cleared": "کش تمام مدل‌های OpenRouter پاک شد.",
}

CONTENT_ERRORS = {
    "content_not_authorized": "شما به تولید محتوا دسترسی ندارید.",
    "validation_error": "خطا در اعتبارسنجی داده‌ها.",
    "content_generation_failed": "خطا در تولید محتوا: {error}",
    "content_save_failed": "خطا در ذخیره محتوا در {destination}: {error}",
    "destination_not_supported": "مقصد '{destination}' پشتیبانی نمی‌شود.",
    "topic_required": "موضوع محتوا نمی‌تواند خالی باشد.",
    "invalid_word_count": "تعداد کلمات باید بین 100 تا 2000 باشد.",
    "provider_not_supported": "Provider '{provider_name}' از قابلیت تولید محتوا پشتیبانی نمی‌کند.",
    "providers_list_error": "خطا در دریافت لیست Provider ها: {error}",
    "openrouter_not_active": "OpenRouter فعال نیست. لطفاً ابتدا OpenRouter را در تنظیمات AI فعال کنید.",
    "openrouter_models_error": "خطا در دریافت لیست مدل‌های OpenRouter: {error}",
    "openrouter_permission_denied": "شما دسترسی لازم برای مشاهده مدل‌های OpenRouter را ندارید.",
    "groq_not_active": "Groq فعال نیست. لطفاً ابتدا Groq را در تنظیمات AI فعال کنید.",
    "groq_models_error": "خطا در دریافت لیست مدل‌های Groq: {error}",
    "groq_permission_denied": "شما دسترسی لازم برای مشاهده مدل‌های Groq را ندارید.",
    "cache_clear_permission_denied": "شما دسترسی لازم برای پاک کردن کش مدل‌ها را ندارید.",
    "cache_clear_error": "خطا در پاک کردن کش: {error}",
}

# ========================================
# IMAGE GENERATION MESSAGES
# ========================================
IMAGE_SUCCESS = {
    "image_generated": "تصویر با موفقیت تولید شد.",
    "image_generated_and_saved": "تصویر با موفقیت تولید و ذخیره شد.",
    "image_generated_not_saved": "تصویر با موفقیت تولید شد (ذخیره نشده).",
    "providers_list_retrieved": "لیست Provider های فعال دریافت شد.",
    "provider_created": "Provider AI با موفقیت ایجاد شد.",
    "provider_updated": "Provider AI با موفقیت به‌روزرسانی شد.",
    "provider_activated": "Provider با موفقیت فعال شد.",
    "provider_deactivated": "Provider غیرفعال شد.",
    "api_key_valid": "API key معتبر است.",
    "capabilities_retrieved": "قابلیت‌های {provider_slug} دریافت شد.",
    "all_capabilities_retrieved": "قابلیت‌های تمام Provider ها دریافت شد.",
    "openrouter_models_retrieved": "لیست مدل‌های تولید تصویر OpenRouter دریافت شد{from_cache}.",
    "huggingface_models_retrieved": "لیست مدل‌های Hugging Face دریافت شد{from_cache}.",
    "cache_cleared": "کش تمام مدل‌های OpenRouter پاک شد.",
    "models_list_retrieved": "لیست مدل‌های تولید تصویر دریافت شد.",
}

IMAGE_ERRORS = {
    "image_not_authorized": "شما به تولید تصویر دسترسی ندارید.",
    "image_generation_failed": "خطا در تولید تصویر: {error}",
    "image_generation_http_error": "خطای HTTP {status_code}: {detail}",
    "image_download_failed": "خطا در دانلود تصویر: {error}",
    "prompt_required": "Prompt نمی‌تواند خالی باشد.",
    "prompt_invalid": "درخواست نامعتبر است.",
    "provider_not_found": "Provider AI یافت نشد.",
    "provider_name_required": "نام Provider الزامی است.",
    "provider_not_supported": "Provider '{provider_name}' پشتیبانی نمی‌شود.",
    "provider_not_available": "Provider '{provider_name}' فعال نیست. لطفاً ابتدا API key را وارد کنید.",
    "provider_not_active": "Provider فعال نیست.",
    "provider_not_authorized": "شما دسترسی لازم ندارید.",
    "slug_required": "slug الزامی است.",
    "api_key_required": "ابتدا باید API key وارد شود.",
    "api_key_not_provided": "API key وارد نشده است.",
    "api_key_invalid": "API key معتبر نیست.",
    "api_key_encryption_error": "خطا در رمزنگاری API key: {error}",
    "api_key_decryption_error": "خطا در رمزگشایی API key: {error}",
    "activation_failed": "خطا در فعال‌سازی Provider: {error}",
    "validation_error": "خطا در اعتبارسنجی: {error}",
    "openai_billing_limit": "حساب OpenAI به حد اعتبار رسیده است. لطفاً به تنظیمات billing مراجعه کنید.",
    "openai_invalid_response": "پاسخ نامعتبر از API OpenAI.",
    "huggingface_model_loading": "مدل در حال لود شدن است. لطفاً چند لحظه صبر کنید و دوباره تلاش کنید.",
    "gemini_not_implemented": "Google Gemini API فعلاً قابلیت تولید تصویر را از طریق API مستقیم ندارد.",
    "openrouter_not_active": "OpenRouter فعال نیست. لطفاً ابتدا OpenRouter را در تنظیمات AI فعال کنید.",
    "openrouter_models_error": "خطا در دریافت لیست مدل‌ها: {error}",
    "openrouter_permission_denied": "شما دسترسی لازم ندارید.",
    "huggingface_not_active": "Hugging Face فعال نیست. لطفاً ابتدا Hugging Face را در تنظیمات AI فعال کنید.",
    "huggingface_models_error": "خطا در دریافت لیست مدل‌های Hugging Face: {error}",
    "huggingface_permission_denied": "شما دسترسی لازم ندارید.",
    "cache_clear_permission_denied": "شما دسترسی لازم ندارید.",
    "cache_clear_error": "خطا در پاک کردن کش: {error}",
    "model_not_found": "مدل یافت نشد.",
    "model_access_denied": "شما به این مدل دسترسی ندارید.",
    "model_no_image_capability": "این مدل قابلیت تولید تصویر ندارد.",
}

# ========================================
# AUDIO GENERATION MESSAGES
# ========================================
AUDIO_SUCCESS = {
    "audio_generated": "فایل صوتی با موفقیت تولید شد.",
    "audio_generated_and_saved": "فایل صوتی با موفقیت تولید و ذخیره شد.",
    "audio_generated_not_saved": "فایل صوتی با موفقیت تولید شد (ذخیره نشده).",
    "providers_list_retrieved": "لیست Provider های فعال دریافت شد.",
}

AUDIO_ERRORS = {
    "audio_not_authorized": "شما به تولید فایل صوتی دسترسی ندارید.",
    "audio_generation_failed": "خطا در تولید فایل صوتی: {error}",
    "audio_generation_http_error": "خطای HTTP {status_code}: {detail}",
    "prompt_invalid": "درخواست نامعتبر است.",
    "provider_not_available": "Provider '{provider_name}' فعال نیست. لطفاً ابتدا API key را وارد کنید.",
    "providers_list_error": "خطا در دریافت لیست Provider ها: {error}",
}

# ========================================
# ADMIN AI SETTINGS MESSAGES
# ========================================
SETTINGS_SUCCESS = {
    "settings_list_retrieved": "تنظیمات با موفقیت دریافت شد.",
    "settings_retrieved": "تنظیمات با موفقیت دریافت شد.",
    "settings_created": "تنظیمات با موفقیت ایجاد شد.",
    "settings_updated": "تنظیمات با موفقیت به‌روزرسانی شد.",
    "settings_deleted": "تنظیمات با موفقیت حذف شد.",
    "usage_reset": "استفاده ماهانه با موفقیت ریست شد.",
    "statistics_retrieved": "آمار با موفقیت دریافت شد.",
}

SETTINGS_ERRORS = {
    "settings_not_authorized": "شما به این تنظیمات دسترسی ندارید.",
    "settings_not_found": "تنظیمات یافت نشد.",
    "validation_error": "خطا در اعتبارسنجی داده‌ها.",
    "shared_api_not_allowed": "استفاده از API مشترک {provider_name} برای ادمین‌های معمولی مجاز نیست.",
    "shared_api_key_not_set": "API Key مشترک {provider_name} تنظیم نشده است.",
    "personal_api_key_not_set": "API Key شخصی شما تنظیم نشده است.",
}

# ========================================
# LEGACY COMPATIBILITY (for backward compatibility)
# ========================================
AI_SUCCESS = {
    **CHAT_SUCCESS,
    **CONTENT_SUCCESS,
    **IMAGE_SUCCESS,
    **AUDIO_SUCCESS,
    **SETTINGS_SUCCESS,
}

AI_ERRORS = {
    **CHAT_ERRORS,
    **CONTENT_ERRORS,
    **IMAGE_ERRORS,
    **AUDIO_ERRORS,
    **SETTINGS_ERRORS,
}
