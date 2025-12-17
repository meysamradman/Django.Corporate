# 🔒 راهنمای امنیت پنل ادمین

## ✅ تغییرات اعمال شده

### 1. چک کردن user_type در AdminLoginView
- ✅ بعد از authenticate، چک می‌کنه که `user_type == 'admin'`
- ✅ چک می‌کنه که `is_staff == True`
- ✅ چک می‌کنه که `is_admin_active == True`
- ✅ کاربران عادی نمی‌تونن به پنل ادمین دسترسی داشته باشن

### 2. Permission Classes جدید
- ✅ `IsAdminUser`: فقط برای ادمین‌ها (user_type == 'admin')
- ✅ `IsSuperAdmin`: فقط برای Super Admin

### 3. URL Secret Path
- ✅ تمام URLهای ادمین با یک secret path محافظت می‌شن
- ✅ URL قدیمی: `/api/admin/login/` → **Honeypot** (فیک)
- ✅ URL جدید: `/api/admin/{ADMIN_URL_SECRET}/auth/login/`

### 4. Honeypot
- ✅ URLهای قدیمی ادمین به یک Honeypot view متصل شدن
- ✅ تمام تلاش‌های هک لاگ می‌شن

### 5. AdminSecurityMiddleware
- ✅ چک کردن HTTPS در production
- ✅ IP Whitelist (اختیاری)
- ✅ لاگ کردن تمام دسترسی‌ها

---

## 🚀 راه‌اندازی

### مرحله 1: تولید Secret Key

```bash
# در ترمینال Django
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

خروجی رو در `.env` ذخیره کن:

```env
ADMIN_URL_SECRET=x7K9mP2qL5nR8tY3vZ6wC4fH1jN0bM
```

### مرحله 2: تنظیمات اختیاری

```env
# IP Whitelist (اختیاری - برای امنیت بیشتر)
ADMIN_ALLOWED_IPS=192.168.1.100,10.0.0.5
```

### مرحله 3: به‌روزرسانی Frontend (Next.js)

```typescript
// config/api.ts
const ADMIN_API_SECRET = process.env.NEXT_PUBLIC_ADMIN_SECRET!;
const API_BASE = process.env.NEXT_PUBLIC_API_URL!;

export const API_ENDPOINTS = {
  admin: {
    login: `${API_BASE}/api/admin/${ADMIN_API_SECRET}/auth/login/`,
    logout: `${API_BASE}/api/admin/${ADMIN_API_SECRET}/auth/logout/`,
    dashboard: `${API_BASE}/api/admin/${ADMIN_API_SECRET}/dashboard/`,
  },
};
```

```bash
# .env.local
NEXT_PUBLIC_ADMIN_SECRET=x7K9mP2qL5nR8tY3vZ6wC4fH1jN0bM
```

---

## 📋 استفاده از Permission Classes

### در ViewSet ها:

```python
from src.user.access_control.classes import IsAdminUser, IsSuperAdmin

class AdminDashboardView(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAdminUser]  # ✅ فقط ادمین‌ها
    
    def get(self, request):
        return APIResponse.success(...)

class AdminUserManagementView(APIView):
    permission_classes = [IsSuperAdmin]  # ✅ فقط Super Admin
    
    def get(self, request):
        return APIResponse.success(...)
```

---

## 🔍 URLهای جدید

### قبل (قدیمی - Honeypot):
- ❌ `/api/admin/login/` → Honeypot
- ❌ `/api/admin/register/` → Honeypot

### بعد (جدید - واقعی):
- ✅ `/api/admin/{ADMIN_URL_SECRET}/auth/login/`
- ✅ `/api/admin/{ADMIN_URL_SECRET}/auth/register/`
- ✅ `/api/admin/{ADMIN_URL_SECRET}/auth/logout/`
- ✅ `/api/admin/{ADMIN_URL_SECRET}/management/`
- ✅ `/api/admin/{ADMIN_URL_SECRET}/profile/`
- ✅ `/api/admin/{ADMIN_URL_SECRET}/roles/`
- ✅ `/api/admin/{ADMIN_URL_SECRET}/permissions/`

---

## 🛡️ امنیت

### ✅ لایه‌های امنیتی:

1. **URL Secret**: URL قابل حدس زدن نیست
2. **Honeypot**: تلاش‌های هک لاگ می‌شن
3. **Permission Check**: چک کردن user_type == 'admin'
4. **HTTPS**: اجباری در production
5. **IP Whitelist**: اختیاری برای محدود کردن IPها
6. **Session Security**: Session در Redis با timeout
7. **IP Ban Service**: بن کردن خودکار IPهای مشکوک بعد از 3 تلاش
8. **Bot Detection**: شناسایی User-Agent های مشکوک (bot, crawler, scanner, ...)

---

## 📝 لاگ‌ها

تمام تلاش‌های دسترسی به پنل ادمین لاگ می‌شن:

```python
# Logger: 'admin_security'
logger.info(f'🔐 Admin access: {method} {path} from {ip}')

# Logger: 'security' (برای Honeypot)
logger.warning(f'🚨 HONEYPOT TRIGGERED! IP: {ip} ...')

# Logger: 'security' (برای Bot Detection)
logger.error(f'🚨🚨 SUSPICIOUS BOT DETECTED: {ip}')

# Logger: 'security' (برای IP Ban)
logger.error(f'🚫 IP BANNED: {ip} | Reason: {reason}')
```

### فرمت لاگ‌ها:
- **Security Format**: `🔒 {levelname} {asctime} | {message}`
- **Level**: WARNING برای security، INFO برای admin_security

---

## ⚠️ نکات مهم

1. **ADMIN_URL_SECRET** رو هرگز در کد commit نکن!
2. در production حتماً یک مقدار تصادفی و پیچیده بذار
3. Frontend و Backend باید از یک secret استفاده کنن
4. Honeypot رو disable نکن - برای امنیت مهمه
5. **IP Ban Service**: بعد از 3 تلاش، IP به مدت 1 ساعت بن میشه
6. **Bot Detection**: User-Agent های مشکوک شناسایی و لاگ می‌شن
7. Logger های `security` و `admin_security` در settings تعریف شدن

## 🔧 تنظیمات IP Ban Service

می‌تونی در `src/core/security/ip_ban.py` تنظیمات رو تغییر بدی:

```python
MAX_ATTEMPTS = 3  # تعداد تلاش قبل از بن
BAN_DURATION = 3600  # مدت زمان بن (ثانیه) - 1 ساعت
```

## 📊 User-Agent های مشکوک

این User-Agent ها به عنوان مشکوک شناسایی می‌شن:
- `bot`, `crawler`, `spider`, `scraper`
- `curl`, `wget`
- `python-requests`
- `nikto`, `sqlmap`, `nmap`, `masscan`
- `scanner`, `exploit`, `hack`, `attack`

---

## 🧪 تست

### تست Honeypot:
```bash
# تست اول - باید OK بده (401)
curl -X POST http://localhost:8000/api/admin/login/ \
  -H "Content-Type: application/json" \
  -d '{"mobile": "09123456789", "password": "test"}'

# تست دوم - باید OK بده (401)
curl -X POST http://localhost:8000/api/admin/login/ \
  -H "Content-Type: application/json" \
  -d '{"mobile": "09123456789", "password": "test"}'

# تست سوم - باید OK بده (401) و IP بن بشه
curl -X POST http://localhost:8000/api/admin/login/ \
  -H "Content-Type: application/json" \
  -d '{"mobile": "09123456789", "password": "test"}'

# تست چهارم - باید 403 بده (IP بن شده)
curl -X POST http://localhost:8000/api/admin/login/ \
  -H "Content-Type: application/json" \
  -d '{"mobile": "09123456789", "password": "test"}'
```

### تست Bot Detection:
```bash
# تست با User-Agent مشکوک
curl -X POST http://localhost:8000/api/admin/login/ \
  -H "Content-Type: application/json" \
  -H "User-Agent: python-requests/2.28.0" \
  -d '{"mobile": "09123456789", "password": "test"}'

# باید لاگ SUSPICIOUS BOT رو ببینی
```

### تست URL واقعی:
```bash
curl -X POST http://localhost:8000/api/admin/{ADMIN_URL_SECRET}/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"mobile": "09123456789", "password": "test", "captcha_id": "...", "captcha_answer": "..."}'
```

### تست IP Ban در Middleware:
```bash
# بعد از بن شدن IP از Honeypot، این درخواست باید 403 بده
curl -X GET http://localhost:8000/api/admin/{ADMIN_URL_SECRET}/management/ \
  -H "Cookie: sessionid=..."
```

---

**✅ همه چیز آماده است!**

