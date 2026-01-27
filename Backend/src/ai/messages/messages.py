CHAT_SUCCESS = {
    "message_sent": "پیام ارسال شد",
    "providers_list_retrieved": "لیست Provider ها دریافت شد",
    "capabilities_retrieved": "قابلیت‌های {provider_name} دریافت شد",
    "all_capabilities_retrieved": "قابلیت‌های تمام Provider ها دریافت شد",
    "openrouter_models_retrieved": "مدل‌های OpenRouter دریافت شد{from_cache}",
    "groq_models_retrieved": "مدل‌های Groq دریافت شد{from_cache}",
    "cache_cleared": "کش پاک شد",
    "provider_cache_cleared": "کش {provider} پاک شد",
}

CHAT_ERRORS = {
    "chat_not_authorized": "دسترسی به چت ندارید",
    "validation_error": "خطا در اعتبارسنجی",
    "chat_failed": "خطا در چت: {error}",
    "provider_not_supported": "Provider '{provider_name}' از Chat پشتیبانی نمی‌کند",
    "providers_list_error": "خطا در دریافت Provider ها: {error}",
    "openrouter_not_active": "OpenRouter فعال نیست",
    "openrouter_models_error": "خطا در دریافت مدل‌های OpenRouter: {error}",
    "openrouter_permission_denied": "دسترسی به مدل‌های OpenRouter ندارید",
    "groq_not_active": "Groq فعال نیست",
    "groq_models_error": "خطا در دریافت مدل‌های Groq: {error}",
    "groq_permission_denied": "دسترسی به مدل‌های Groq ندارید",
    "cache_clear_permission_denied": "دسترسی به پاک کردن کش ندارید",
    "cache_clear_error": "خطا در پاک کردن کش: {error}",
    "chat_quota_exceeded": "سهمیه چت تمام شد",
    "chat_rate_limit": "محدودیت نرخ درخواست",
    "chat_forbidden": "دسترسی به چت ممنوع است",
}

CONTENT_SUCCESS = {
    "content_generated": "محتوای SEO تولید شد",
    "content_generated_cached": "محتوای SEO از cache بازگردانده شد",
    "content_generated_and_saved": "محتوای SEO تولید و ذخیره شد",
    "content_saved_to_blog": "محتوا در بلاگ ذخیره شد",
    "content_saved_to_portfolio": "محتوا در نمونه‌کار ذخیره شد",
    "content_saved_to_real_estate": "محتوا در املاک ذخیره شد",
    "content_not_saved": "محتوا ذخیره نشد",
    "providers_list_retrieved": "لیست Provider ها دریافت شد",
    "capabilities_retrieved": "قابلیت‌های {provider_name} دریافت شد",
    "all_capabilities_retrieved": "قابلیت‌های تمام Provider ها دریافت شد",
    "openrouter_models_retrieved": "مدل‌های OpenRouter دریافت شد{from_cache}",
    "groq_models_retrieved": "مدل‌های Groq دریافت شد{from_cache}",
    "cache_cleared": "کش پاک شد",
}

CONTENT_ERRORS = {
    "content_not_authorized": "دسترسی به تولید محتوا ندارید",
    "validation_error": "خطا در اعتبارسنجی",
    "content_generation_failed": "خطا در تولید محتوا: {error}",
    "content_save_failed": "خطا در ذخیره محتوا در {destination}: {error}",
    "destination_not_supported": "مقصد '{destination}' پشتیبانی نمی‌شود",
    "destination_invalid": "مقصد نامعتبر است",
    "topic_required": "موضوع محتوا الزامی است",
    "invalid_word_count": "تعداد کلمات باید بین 100 تا 2000 باشد",
    "provider_not_supported": "Provider '{provider_name}' از تولید محتوا پشتیبانی نمی‌کند",
    "providers_list_error": "خطا در دریافت Provider ها: {error}",
    "openrouter_not_active": "OpenRouter فعال نیست",
    "openrouter_models_error": "خطا در دریافت مدل‌های OpenRouter: {error}",
    "openrouter_permission_denied": "دسترسی به مدل‌های OpenRouter ندارید",
    "groq_not_active": "Groq فعال نیست",
    "groq_models_error": "خطا در دریافت مدل‌های Groq: {error}",
    "groq_permission_denied": "دسترسی به مدل‌های Groq ندارید",
    "cache_clear_permission_denied": "دسترسی به پاک کردن کش ندارید",
    "cache_clear_error": "خطا در پاک کردن کش: {error}",
}

IMAGE_SUCCESS = {
    "image_generated": "تصویر تولید شد",
    "image_generated_and_saved": "تصویر تولید و ذخیره شد",
    "image_generated_not_saved": "تصویر تولید شد (ذخیره نشده)",
    "providers_list_retrieved": "لیست Provider ها دریافت شد",
    "provider_created": "Provider ایجاد شد",
    "provider_updated": "Provider به‌روزرسانی شد",
    "provider_activated": "Provider فعال شد",
    "provider_deactivated": "Provider غیرفعال شد",
    "api_key_valid": "API key معتبر است",
    "capabilities_retrieved": "قابلیت‌های {provider_slug} دریافت شد",
    "all_capabilities_retrieved": "قابلیت‌های تمام Provider ها دریافت شد",
    "openrouter_models_retrieved": "مدل‌های OpenRouter دریافت شد{from_cache}",
    "huggingface_models_retrieved": "مدل‌های Hugging Face دریافت شد{from_cache}",
    "cache_cleared": "کش پاک شد",
    "models_list_retrieved": "لیست مدل‌ها دریافت شد",
}

IMAGE_ERRORS = {
    "image_not_authorized": "دسترسی به تولید تصویر ندارید",
    "image_generation_failed": "خطا در تولید تصویر: {error}",
    "image_generation_http_error": "خطای HTTP {status_code}: {detail}",
    "image_download_failed": "خطا در دانلود تصویر: {error}",
    "prompt_required": "Prompt الزامی است",
    "prompt_invalid": "درخواست نامعتبر است",
    "provider_not_found": "Provider یافت نشد",
    "provider_name_required": "نام Provider الزامی است",
    "provider_not_supported": "Provider '{provider_name}' پشتیبانی نمی‌شود",
    "provider_not_available": "Provider '{provider_name}' فعال نیست",
    "provider_not_active": "Provider فعال نیست",
    "provider_not_authorized": "دسترسی ندارید",
    "slug_required": "slug الزامی است",
    "api_key_required": "API key الزامی است",
    "api_key_not_provided": "API key وارد نشده",
    "api_key_invalid": "API key نامعتبر است",
    "api_key_encryption_error": "خطا در رمزنگاری API key: {error}",
    "api_key_decryption_error": "خطا در رمزگشایی API key: {error}",
    "activation_failed": "خطا در فعال‌سازی Provider: {error}",
    "provider_name_duplicate": "این نام قبلاً استفاده شده",
    "provider_not_found_or_inactive": "Provider یافت نشد یا غیرفعال است",
    "validation_error": "خطا در اعتبارسنجی: {error}",
    "openai_billing_limit": "اعتبار OpenAI تمام شده است",
    "openai_invalid_response": "پاسخ نامعتبر از OpenAI",
    "huggingface_model_loading": "مدل در حال بارگذاری است",
    "gemini_not_implemented": "Gemini تولید تصویر را پشتیبانی نمی‌کند",
    "openrouter_not_active": "OpenRouter فعال نیست",
    "openrouter_models_error": "خطا در دریافت مدل‌ها: {error}",
    "openrouter_permission_denied": "دسترسی ندارید",
    "huggingface_not_active": "Hugging Face فعال نیست",
    "huggingface_models_error": "خطا در دریافت مدل‌های Hugging Face: {error}",
    "huggingface_permission_denied": "دسترسی ندارید",
    "cache_clear_permission_denied": "دسترسی ندارید",
    "cache_clear_error": "خطا در پاک کردن کش: {error}",
    "model_not_found": "مدل یافت نشد",
    "model_access_denied": "دسترسی به این مدل ندارید",
    "model_no_image_capability": "این مدل تولید تصویر ندارد",
    "model_no_text_capability": "این مدل تولید متن ندارد",
    "image_generation_timeout": "زمان تولید تصویر تمام شد",
    "connection_timeout": "زمان اتصال تمام شد",
    "content_generation_timeout": "زمان تولید محتوا تمام شد",
    "chat_timeout": "زمان چت تمام شد",
}

AUDIO_SUCCESS = {
    "audio_generated": "فایل صوتی تولید شد",
    "audio_generated_and_saved": "فایل صوتی تولید و ذخیره شد",
    "audio_generated_not_saved": "فایل صوتی تولید شد (ذخیره نشده)",
    "providers_list_retrieved": "لیست Provider ها دریافت شد",
}

AUDIO_ERRORS = {
    "audio_not_authorized": "دسترسی به تولید صدا ندارید",
    "audio_generation_failed": "خطا در تولید فایل صوتی: {error}",
    "audio_generation_http_error": "خطای HTTP {status_code}: {detail}",
    "prompt_invalid": "درخواست نامعتبر است",
    "provider_not_available": "Provider '{provider_name}' فعال نیست",
    "providers_list_error": "خطا در دریافت Provider ها: {error}",
    "text_empty": "متن الزامی است",
    "text_too_long": "متن نباید بیشتر از 4096 کاراکتر باشد",
    "provider_tts_not_supported": "Provider '{provider_name}' از text-to-speech پشتیبانی نمی‌کند",
}

SETTINGS_SUCCESS = {
    "settings_list_retrieved": "تنظیمات دریافت شد",
    "settings_retrieved": "تنظیمات دریافت شد",
    "settings_created": "تنظیمات ایجاد شد",
    "settings_updated": "تنظیمات به‌روزرسانی شد",
    "settings_deleted": "تنظیمات حذف شد",
    "usage_reset": "استفاده ماهانه ریست شد",
    "statistics_retrieved": "آمار دریافت شد",
}

SETTINGS_ERRORS = {
    "settings_not_authorized": "دسترسی به تنظیمات ندارید",
    "settings_not_found": "تنظیمات یافت نشد",
    "validation_error": "خطا در اعتبارسنجی",
    "shared_api_not_allowed": "استفاده از API مشترک {provider_name} مجاز نیست",
    "shared_api_key_not_set": "API Key مشترک {provider_name} تنظیم نشده",
    "personal_api_key_not_set": "API Key شخصی تنظیم نشده",
    "no_api_key_available": "هیچ API keyی برای provider '{provider_name}' موجود نیست. لطفاً Personal یا Shared API key را تنظیم کنید",
}

AI_SUCCESS = {
    **CHAT_SUCCESS,
    **CONTENT_SUCCESS,
    **IMAGE_SUCCESS,
    **AUDIO_SUCCESS,
    **SETTINGS_SUCCESS,
    "model_retrieved": "مدل فعال دریافت شد",
    "model_activated": "مدل فعال شد",
    "model_deactivated": "مدل غیرفعال شد",
    "other_models_deactivated": "{count} مدل دیگر غیرفعال شد",
}

GEMINI_PROMPTS = {
    "content_generation": "لطفاً یک محتوای حرفه‌ای و سئو شده به زبان فارسی بنویسید.\nموضوع: {topic}\n\nملاحظات:\n- طول محتوا: حدود {word_count} کلمه\n- سبک: {tone}\n- محتوا باید برای SEO بهینه باشد\n- استفاده از کلمات کلیدی طبیعی\n- ساختار منطقی و خوانا\n\nمحتوا را به صورت متن ساده بدون فرمت خاص بنویسید.",
    "seo_content_generation": "لطفاً یک محتوای وبلاگ حرفه‌ای و کاملاً سئو شده به زبان فارسی برای موضوع زیر بنویسید:\n\nموضوع: {topic}{keywords_str}\n\nنیاز دارم به فرمت JSON دقیق زیر:\n{{\n    \"title\": \"عنوان اصلی (H1) - حداکثر 60 کاراکتر، جذاب و شامل کلمه کلیدی\",\n    \"meta_title\": \"عنوان متا SEO - دقیقاً 50-60 کاراکتر، شامل کلمه کلیدی اصلی\",\n    \"meta_description\": \"توضیحات متا SEO - دقیقاً 150-160 کاراکتر، جذاب و شامل کلمه کلیدی\",\n    \"slug\": \"url-friendly-slug\",\n    \"h1\": \"عنوان اصلی (H1) - باید دقیقاً همان title باشد\",\n    \"h2_list\": [\"عنوان H2 اول که در محتوا استفاده می‌شود\", \"عنوان H2 دوم\", \"حداقل 2-3 عنوان H2\"],\n    \"h3_list\": [\"عنوان H3 اول که در محتوا استفاده می‌شود\", \"عنوان H3 دوم\", \"حداقل 2-3 عنوان H3\"],\n    \"content\": \"<p>در دنیای امروز، [موضوع] یکی از مهم‌ترین عوامل موفقیت در فضای دیجیتال است. یک وب‌سایت خوب باید هم از نظر ظاهری جذاب باشد و هم از نظر تجربه کاربری عالی عمل کند.</p>\\n\\n<h2>عنوان H2 اول</h2>\\n<p>محتوا مربوط به بخش اول محتوا برای موضوع H2. کلمات کلیدی به صورت طبیعی استفاده می‌شوند. محتوا باید SEO-optimized باشد.</p>\\n\\n<h3>عنوان H3 اول</h3>\\n<p>محتوا مربوط به زیربخش H3. این بخش جزئیات بیشتری از موضوع اصلی را پوشش می‌دهد.</p>\\n\\n<h2>عنوان H2 دوم</h2>\\n<p>محتوا مربوط به بخش دوم.... محتوای کامل باید حدود {word_count} کلمه باشد و شامل تگ‌های HTML <p>, <h2> و <h3> باشد.</p>\",\n    \"keywords\": [\"کلمه کلیدی 1\", \"کلمه کلیدی 2\", \"کلمه کلیدی 3\"],\n    \"word_count\": {word_count}\n}}\n\nمهم و ضروری:\n1. محتوا باید دقیقاً حدود {word_count} کلمه باشد (فقط متن، بدون احتساب HTML tags)\n2. در فیلد content باید تگ‌های HTML <h2> و <h3> را به صورت صحیح قرار دهید\n3. عناوین در h2_list و h3_list باید دقیقاً همان عناوینی باشند که در content استفاده شده‌اند\n4. از کلمات کلیدی طبیعی استفاده کنید (keyword stuffing نکنید)\n5. محتوا باید حرفه‌ای، خوانا و برای خواننده مفید باشد\n6. h1 باید دقیقاً همان title باشد\n7. فقط JSON معتبر را برگردانید، بدون توضیحات اضافی\n8. تمام مقادیر باید به زبان فارسی باشد\n9. در content، تگ‌ها را به صورت <h2>عنوان</h2> و <h3>عنوان</h3> قرار دهید",
}

GEMINI_ERRORS = {
    "api_access_denied": "خطای Gemini API: دسترسی به API محدود شده است",
    "api_access_denied_detailed": "خطای Gemini API: دسترسی به API محدود شده است\n\nجزئیات: {error_detail}",
    "api_access_denied_simple": "خطای Gemini API: دسترسی به API محدود شده است\n\nجزئیات: {error_detail}",
    "invalid_request": "خطای Gemini API: درخواست نامعتبر است: {error_detail}",
    "rate_limit": "خطای Gemini API: تعداد درخواست‌ها زیاد است",
    "invalid_api_key": "خطای Gemini API: API Key نامعتبر است",
    "invalid_api_key_simple": "خطای Gemini API: API Key نامعتبر است",
    "http_error": "خطای Gemini API: خطای HTTP {status_code}",
    "http_error_with_detail": "خطای Gemini API (HTTP {status_code}): {error_detail}",
    "http_error_with_message": "خطای Gemini API: {error_message}",
    "content_generation_error": "خطا در تولید محتوا: {error}",
    "json_parse_error": "خطا در تجزیه پاسخ JSON",
    "no_content_generated": "هیچ محتوایی تولید نشد",
    "no_response_received": "هیچ پاسخی دریافت نشد",
    "response_timeout": "زمان پاسخ تمام شد",
    "chat_error": "خطا در چت: {error}",
    "chat_rate_limit": "خطای Gemini API: تعداد درخواست‌ها زیاد است",
}

HUGGINGFACE_PROMPTS = {
    "content_generation_prompt": "Write a professional SEO-optimized content in Persian (Farsi) language.\n\nTopic: {topic}\n\nRequirements:\n- Word count: approximately {word_count} words\n- Style: {tone}\n- Content should be SEO optimized\n- Natural keyword usage\n- Logical and readable structure\n\nWrite the content as plain text without special formatting.",
}

HUGGINGFACE_ERRORS = {}

GROQ_ERRORS = {
    "no_response_received": "هیچ پاسخی دریافت نشد",
    "content_generation_error": "خطا در تولید محتوا",
    "rate_limit": "خطای Groq API: تعداد درخواست‌ها زیاد است",
    "invalid_api_key": "خطای Groq API: API Key نامعتبر است",
    "api_access_denied": "خطای Groq API: دسترسی به API محدود شده است",
    "api_error": "خطای Groq API: {error_msg}",
    "content_generation_failed": "خطا در تولید محتوا: {error}",
    "json_parse_error": "خطا در تجزیه پاسخ JSON: {error}",
    "chat_error": "خطا در چت: {error}",
}

GROQ_PROMPTS = {
    "content_generation": "لطفاً یک محتوای حرفه‌ای و سئو شده به زبان فارسی برای موضوع \"{topic}\" بنویسید.",
    "seo_content_generation": "لطفاً یک محتوای حرفه‌ای و سئو شده به زبان فارسی برای موضوع \"{topic}\" بنویسید.\n\nملاحظات:\n- طول محتوا: حدود {word_count} کلمه\n- سبک: {tone}\n- محتوا باید برای SEO بهینه باشد\n- استفاده از کلمات کلیدی: {keywords_str}\n- ساختار منطقی و خوانا\n- محتوا باید شامل تگ‌های HTML <h2> و <h3> باشد\n\nلطفاً پاسخ را به صورت JSON با فرمت زیر برگردانید:\n{{\n    \"title\": \"عنوان اصلی (H1)\",\n    \"meta_title\": \"عنوان متا برای SEO (50-60 کاراکتر)\",\n    \"meta_description\": \"توضیحات متا برای SEO (150-160 کاراکتر)\",\n    \"slug\": \"slug-url-friendly\",\n    \"h1\": \"عنوان اصلی\",\n    \"h2_list\": [\"عنوان H2 اول\", \"عنوان H2 دوم\", ...],\n    \"h3_list\": [\"عنوان H3 اول\", \"عنوان H3 دوم\", ...],\n    \"content\": \"<p>در دنیای امروز، [موضوع] یکی از مهم‌ترین عوامل موفقیت است. محتوای کامل باید با تگ‌های HTML باشد.</p>\\n\\n<h2>عنوان H2 اول</h2>\\n<p>محتوا مربوط به بخش اول که شامل کلمات کلیدی طبیعی است.</p>\\n\\n<h3>عنوان H3 اول</h3>\\n<p>محتوا مربوط به زیربخش H3 با جزئیات بیشتر.</p>\\n\\n<h2>عنوان H2 دوم</h2>\\n<p>محتوا مربوط به بخش دوم که بهینه شده برای SEO است.</p>\",\n    \"keywords\": [\"کلمه کلیدی 1\", \"کلمه کلیدی 2\", ...]\n}}\n\nمهم: حتماً تگ‌های <h2> و <h3> را در داخل فیلد \"content\" قرار دهید و مطمئن شوید که h2_list و h3_list با تگ‌های موجود در content مطابقت دارند.",
}

OPENAI_ERRORS = {
    "api_error": "خطای OpenAI API: {error_msg}",
    "http_error": "خطای HTTP {status_code}",
    "content_generation_failed": "خطا در تولید محتوا: {error}",
    "json_parse_error": "خطا در تجزیه پاسخ JSON",
    "no_content_generated": "هیچ محتوایی تولید نشد",
    "no_response_received": "هیچ پاسخی دریافت نشد",
    "billing_limit": "خطای OpenAI API: اعتبار حساب تمام شده است",
    "rate_limit": "خطای OpenAI API: تعداد درخواست‌ها زیاد است",
    "invalid_api_key": "خطای OpenAI API: API Key نامعتبر است",
    "api_access_denied": "خطای OpenAI API: دسترسی به API محدود شده است",
    "rate_limit_or_billing": "خطای OpenAI API: تعداد درخواست‌ها زیاد است یا اعتبار تمام شده",
    "chat_error": "خطا در چت: {error}",
    "audio_generation_error": "خطا در تولید صدا: {error}",
}

OPENAI_PROMPTS = {
    "seo_content_generation": "لطفاً یک محتوای وبلاگ حرفه‌ای و کاملاً سئو شده به زبان فارسی برای موضوع زیر بنویسید:\n\nموضوع: {topic}{keywords_str}\n\nنیاز دارم به فرمت JSON دقیق زیر:\n{{\n    \"title\": \"عنوان اصلی (H1) - حداکثر 60 کاراکتر، جذاب و شامل کلمه کلیدی\",\n    \"meta_title\": \"عنوان متا SEO - دقیقاً 50-60 کاراکتر، شامل کلمه کلیدی اصلی\",\n    \"meta_description\": \"توضیحات متا SEO - دقیقاً 150-160 کاراکتر، جذاب و شامل کلمه کلیدی\",\n    \"slug\": \"url-friendly-slug\",\n    \"h1\": \"عنوان اصلی (H1) - باید دقیقاً همان title باشد\",\n    \"h2_list\": [\"عنوان H2 اول که در محتوا استفاده می‌شود\", \"عنوان H2 دوم\", \"حداقل 2-3 عنوان H2\"],\n    \"h3_list\": [\"عنوان H3 اول که در محتوا استفاده می‌شود\", \"عنوان H3 دوم\", \"حداقل 2-3 عنوان H3\"],\n    \"content\": \"<p>در دنیای امروز، [موضوع] یکی از مهم‌ترین عوامل موفقیت در فضای دیجیتال است. یک وب‌سایت خوب باید هم از نظر ظاهری جذاب باشد و هم از نظر تجربه کاربری عالی عمل کند.</p>\\n\\n<h2>عنوان H2 اول</h2>\\n<p>محتوا مربوط به بخش اول محتوا برای موضوع H2. کلمات کلیدی به صورت طبیعی استفاده می‌شوند. محتوا باید SEO-optimized باشد.</p>\\n\\n<h3>عنوان H3 اول</h3>\\n<p>محتوا مربوط به زیربخش H3. این بخش جزئیات بیشتری از موضوع اصلی را پوشش می‌دهد.</p>\\n\\n<h2>عنوان H2 دوم</h2>\\n<p>محتوا مربوط به بخش دوم.... محتوای کامل باید حدود {word_count} کلمه باشد و شامل تگ‌های HTML <p>, <h2> و <h3> باشد.</p>\",\n    \"keywords\": [\"کلمه کلیدی 1\", \"کلمه کلیدی 2\", \"کلمه کلیدی 3\"],\n    \"word_count\": {word_count}\n}}\n\nمهم و ضروری:\n1. محتوا باید دقیقاً حدود {word_count} کلمه باشد (فقط متن، بدون احتساب HTML tags)\n2. در فیلد content باید تگ‌های HTML <h2> و <h3> را به صورت صحیح قرار دهید\n3. عناوین در h2_list و h3_list باید دقیقاً همان عناوینی باشند که در content استفاده شده‌اند\n4. از کلمات کلیدی طبیعی استفاده کنید (keyword stuffing نکنید)\n5. محتوا باید حرفه‌ای، خوانا و برای خواننده مفید باشد\n6. h1 باید دقیقاً همان title باشد\n7. فقط JSON معتبر را برگردانید، بدون توضیحات اضافی\n8. تمام مقادیر باید به زبان فارسی باشد\n9. در content، تگ‌ها را به صورت <h2>عنوان</h2> و <h3>عنوان</h3> قرار دهید",
}

DEEPSEEK_ERRORS = {
    "no_response_received": "هیچ پاسخی دریافت نشد",
    "rate_limit": "خطای DeepSeek API: تعداد درخواست‌ها زیاد است",
    "rate_limit_with_info": "خطای DeepSeek API: تعداد درخواست‌ها زیاد است (هر 3 ثانیه یک درخواست)",
    "invalid_api_key": "خطای DeepSeek API: API Key نامعتبر است",
    "api_access_denied": "خطای DeepSeek API: دسترسی به API محدود شده است",
    "api_error": "خطای DeepSeek API: {error_msg}",
    "rate_limit_error": "خطای DeepSeek API: تعداد درخواست‌ها زیاد است (هر 3 ثانیه یک درخواست)",
    "rate_limit_or_error": "خطای DeepSeek API: تعداد درخواست‌ها زیاد است (هر 3 ثانیه یک درخواست)",
    "http_error": "خطای HTTP {status_code}",
    "content_generation_failed": "خطا در تولید محتوا: {error}",
    "json_parse_error": "خطا در تجزیه پاسخ JSON: {error}",
    "chat_error": "خطا در چت: {error}",
}

DEEPSEEK_PROMPTS = {
    "content_generation": "لطفاً یک محتوای حرفه‌ای و سئو شده به زبان فارسی بنویسید.\n\nموضوع: {topic}\n\nملاحظات:\n- طول محتوا: حدود {word_count} کلمه\n- سبک: {tone}\n- محتوا باید برای SEO بهینه باشد\n- استفاده از کلمات کلیدی طبیعی\n- ساختار منطقی و خوانا\n\nمحتوا را به صورت متن ساده بدون فرمت خاص بنویسید.",
    "seo_content_generation": "لطفاً یک محتوای حرفه‌ای و سئو شده به زبان فارسی برای موضوع \"{topic}\" بنویسید.",
}

DEEPSEEK_SYSTEM_MESSAGES = {
    "content_writer": "شما یک نویسنده حرفه‌ای و متخصص SEO هستید که به زبان فارسی می‌نویسید.",
    "seo_expert": "شما یک متخصص SEO و نویسنده حرفه‌ای هستید. همیشه پاسخ را به صورت JSON معتبر برگردانید.",
}

AI_SYSTEM_MESSAGES = {
    "default_chat": "شما یک دستیار هوشمند و مفید هستید که به زبان فارسی پاسخ می‌دهید.",
}

AI_PROMPTS = {
    **GEMINI_PROMPTS,
    **GROQ_PROMPTS,
    **OPENAI_PROMPTS,
    **DEEPSEEK_PROMPTS,
    **HUGGINGFACE_PROMPTS,
}

AI_ERRORS = {
    **CHAT_ERRORS,
    **CONTENT_ERRORS,
    **IMAGE_ERRORS,
    **AUDIO_ERRORS,
    **SETTINGS_ERRORS,
    **GEMINI_ERRORS,
    **HUGGINGFACE_ERRORS,
    **GROQ_ERRORS,
    **OPENAI_ERRORS,
    **DEEPSEEK_ERRORS,
    "no_active_model": "هیچ مدل فعالی برای این Provider+Capability وجود ندارد",
    "no_active_model_any_provider": "هیچ مدل فعالی برای capability '{capability}' در هیچ providerی یافت نشد",
    "model_no_capability": "این مدل از capability '{capability}' پشتیبانی نمی‌کند",
    "operation_not_supported": "عملیات '{operation}' توسط provider '{provider}' پشتیبانی نمی‌شود",
    "capability_required": "پارامتر capability الزامی است",
    "model_access_denied": "شما دسترسی به استفاده از این مدل را ندارید",
    "provider_not_registered": "Provider '{name}' در سیستم ثبت نشده است",
    "models_list_error": "خطا در دریافت لیست مدل‌ها: {error}",
    "multiple_active_models": "چندین مدل فعال برای یک Provider+Capability مجاز نیست",
    "conflicting_models": "فعال کردن این مدل باعث غیرفعال شدن مدل {model_name} می‌شود",
}
