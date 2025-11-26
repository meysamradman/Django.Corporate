# AI Image Generation Messages
AI_SUCCESS = {
    "provider_created": "Provider AI با موفقیت ایجاد شد.",
    "provider_updated": "Provider AI با موفقیت به‌روزرسانی شد.",
    "provider_activated": "Provider با موفقیت فعال شد.",
    "provider_deactivated": "Provider غیرفعال شد.",
    "providers_list_retrieved": "لیست Provider های فعال دریافت شد.",
    "image_generated": "تصویر با موفقیت تولید شد.",
    "image_generated_and_saved": "تصویر با موفقیت تولید و ذخیره شد.",
    "image_generated_not_saved": "تصویر با موفقیت تولید شد (ذخیره نشده).",
    "audio_generated": "فایل صوتی با موفقیت تولید شد.",
    "audio_generated_and_saved": "فایل صوتی با موفقیت تولید و ذخیره شد.",
    "audio_generated_not_saved": "فایل صوتی با موفقیت تولید شد (ذخیره نشده).",
    "api_key_valid": "API key معتبر است.",
    "content_generated": "محتوای SEO با موفقیت تولید شد.",
    "content_generated_cached": "محتوای SEO از cache بازگردانده شد.",
    # Admin AI Settings
    "settings_list_retrieved": "تنظیمات با موفقیت دریافت شد.",
    "settings_retrieved": "تنظیمات با موفقیت دریافت شد.",
    "settings_created": "تنظیمات با موفقیت ایجاد شد.",
    "settings_updated": "تنظیمات با موفقیت به‌روزرسانی شد.",
    "settings_deleted": "تنظیمات با موفقیت حذف شد.",
    "usage_reset": "استفاده ماهانه با موفقیت ریست شد.",
    "statistics_retrieved": "آمار با موفقیت دریافت شد.",
}

AI_ERRORS = {
    "provider_not_found": "Provider AI یافت نشد.",
    "provider_name_required": "نام Provider الزامی است.",
    "provider_not_supported": "Provider '{provider_name}' پشتیبانی نمی‌شود.",
    "provider_not_available": "Provider '{provider_name}' فعال نیست. لطفاً ابتدا API key را وارد کنید.",
    "provider_not_active": "Provider فعال نیست.",
    "api_key_required": "ابتدا باید API key وارد شود.",
    "api_key_not_provided": "API key وارد نشده است.",
    "api_key_invalid": "API key معتبر نیست.",
    "api_key_encryption_error": "خطا در رمزنگاری API key: {error}",
    "api_key_decryption_error": "خطا در رمزگشایی API key: {error}",
    "image_generation_failed": "خطا در تولید تصویر: {error}",
    "image_generation_http_error": "خطای HTTP {status_code}: {detail}",
    "audio_generation_failed": "خطا در تولید فایل صوتی: {error}",
    "audio_generation_http_error": "خطای HTTP {status_code}: {detail}",
    "prompt_required": "Prompt نمی‌تواند خالی باشد.",
    "prompt_invalid": "Prompt نامعتبر است.",
    "openai_billing_limit": (
        "حساب OpenAI به حد اعتبار رسیده است.\n\n"
        "لطفاً:\n"
        "1. به https://platform.openai.com/account/billing بروید\n"
        "2. اعتبار حساب خود را افزایش دهید\n"
        "3. یا محدودیت هزینه (spending limit) را بررسی کنید"
    ),
    "openai_invalid_response": "پاسخ نامعتبر از API OpenAI.",
    "huggingface_model_loading": (
        "مدل در حال لود شدن است. لطفاً چند ثانیه صبر کنید و دوباره تلاش کنید.\n\n"
        "Hugging Face باید مدل را برای اولین بار از سرور دانلود کند که ممکن است کمی طول بکشد."
    ),
    "gemini_not_implemented": (
        "Google Gemini API فعلاً قابلیت تولید تصویر را از طریق API مستقیم ندارد.\n\n"
        "برای تولید تصویر با Google:\n"
        "1. باید از Google Vertex AI Imagen استفاده کنید\n"
        "2. نیاز به Google Cloud Project دارید\n"
        "3. باید Vertex AI API را فعال کنید\n"
        "4. نیاز به Service Account Authentication دارید\n\n"
        "لطفاً از OpenAI DALL-E استفاده کنید که با API key ساده کار می‌کند."
    ),
    "image_download_failed": "خطا در دانلود تصویر: {error}",
    "activation_failed": "خطا در فعال‌سازی Provider: {error}",
    "validation_error": "خطا در اعتبارسنجی: {error}",
    "content_generation_failed": "خطا در تولید محتوا: {error}",
    "topic_required": "موضوع محتوا نمی‌تواند خالی باشد.",
    "invalid_word_count": "تعداد کلمات باید بین 100 تا 2000 باشد.",
    # Admin AI Settings Errors
    "settings_not_authorized": "شما به این تنظیمات دسترسی ندارید.",
    "settings_not_found": "تنظیمات یافت نشد.",
    "validation_error": "خطا در اعتبارسنجی داده‌ها.",
    "image_not_authorized": "شما به تولید تصویر دسترسی ندارید.",
    "content_not_authorized": "شما به تولید محتوا دسترسی ندارید.",
    "chat_not_authorized": "شما به چت با AI دسترسی ندارید.",
    "audio_not_authorized": "شما به تولید فایل صوتی دسترسی ندارید.",
}

