SECURITY_ERRORS = {
    "access_denied": "Access denied",
    "https_required": "HTTPS required for admin access",
}

SECURITY_MESSAGES = {
    "ip_blocked": "دسترسی شما مسدود شده است",
    "https_required": "دسترسی از طریق HTTPS الزامی است",
    "ip_not_allowed": "دسترسی از این IP مجاز نیست",
}

CAPTCHA_SUCCESS = {
    "captcha_generated": "کپتچا با موفقیت تولید شد.",
    "captcha_verified": "کپتچا با موفقیت تأیید شد.",
}

CAPTCHA_ERRORS = {
    "captcha_generation_failed": "خطا در تولید کپتچا. لطفاً دوباره تلاش کنید.",
    "captcha_invalid_data": "داده‌های ورودی نامعتبر.",
    "captcha_required": "کپتچا الزامی است.",
    "captcha_invalid": "کپتچا نامعتبر یا منقضی شده است.",
    "captcha_server_error": "خطای داخلی سرور.",
    "captcha_rate_limit": "تعداد درخواست‌های کپتچا بیش از حد مجاز است. لطفاً بعداً تلاش کنید.",
}

IP_MANAGEMENT_SUCCESS = {
    "banned_ips_retrieved": "لیست IPهای مسدودشده با موفقیت دریافت شد",
    "ip_unbanned": "IP {ip} از ban خارج شد",
    "ip_banned": "IP {ip} ban شد",
    "attempts_retrieved": "اطلاعات تلاش‌های IP دریافت شد",
    "whitelist_retrieved": "لیست whitelist با موفقیت دریافت شد",
    "ip_whitelist_added": "IP {ip} به whitelist اضافه شد",
    "ip_whitelist_removed": "IP {ip} از whitelist حذف شد",
    "current_ip_whitelist_added": "IP فعلی شما ({ip}) به whitelist اضافه شد",
    "current_ip_retrieved": "اطلاعات IP فعلی دریافت شد",
}

IP_MANAGEMENT_ERRORS = {
    "banned_ips_retrieve_failed": "خطا در دریافت لیست IPهای ban شده",
    "ip_required": "وارد کردن IP الزامی است",
    "ip_unban_failed": "خطا در رفع ban IP",
    "ip_ban_failed": "خطا در ban کردن IP",
    "ip_whitelisted_cannot_ban": "این IP در whitelist است و نمی‌توان ban کرد",
    "attempts_retrieve_failed": "خطا در دریافت اطلاعات IP",
    "whitelist_retrieve_failed": "خطا در دریافت لیست whitelist",
    "invalid_ip": "IP address نامعتبر است",
    "ip_already_whitelisted": "این IP قبلاً در whitelist است",
    "ip_whitelist_add_failed": "خطا در اضافه کردن IP به whitelist",
    "cannot_remove_current_ip": "شما نمی‌توانید IP فعلی خود را از whitelist حذف کنید",
    "ip_not_in_whitelist": "این IP در whitelist نیست",
    "ip_whitelist_remove_failed": "خطا در حذف IP از whitelist",
    "current_ip_already_whitelisted": "IP فعلی شما قبلاً در whitelist است",
    "current_ip_whitelist_add_failed": "خطا در اضافه کردن IP فعلی به whitelist",
    "current_ip_retrieve_failed": "خطا در دریافت IP فعلی",
}

IP_MANAGEMENT_DEFAULTS = {
    "unknown_reason": "نامشخص",
    "unknown_banned_at": "نامشخص",
    "manual_ban_reason": "مسدودسازی دستی توسط ادمین",
    "ban_reason_with_actor": "{reason} (توسط {actor})",
    "auto_ban_reason": "فعال‌سازی honeypot",
    "honeypot_attempts_reason": "تعداد تلاش honeypot از حد مجاز گذشت: {attempts}",
}