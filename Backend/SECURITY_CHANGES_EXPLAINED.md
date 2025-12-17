# 🔒 توضیح کامل تغییرات امنیتی پنل ادمین

## 📍 نکته مهم: URL ورود Frontend تغییر نکرد!

**✅ URL ورود در Frontend (Next.js) همچنان همون است:**
- `http://localhost:3000/login` ← **بدون تغییر!**

**🔒 اما URLهای Backend (Django) تغییر کردند:**
- ❌ قدیمی: `/api/admin/login/`
- ✅ جدید: `/api/admin/{SECRET}/auth/login/`

---

## 🎯 خلاصه تغییرات

### 1️⃣ **URL Secret Path (مثل وردپرس)**

#### مشکل قبلی:
```
❌ /api/admin/login/  ← قابل حدس زدن!
❌ /api/admin/logout/
❌ /api/admin/profile/
```

#### راه‌حل:
```
✅ /api/admin/x7K9mP2qL5nR8tY3vZ6wC4fH1jN0bM/auth/login/
✅ /api/admin/x7K9mP2qL5nR8tY3vZ6wC4fH1jN0bM/auth/logout/
✅ /api/admin/x7K9mP2qL5nR8tY3vZ6wC4fH1jN0bM/profile/
```

**چطور کار می‌کنه:**
1. در `Backend/config/django/base.py`:
   ```python
   ADMIN_URL_SECRET = os.getenv('ADMIN_URL_SECRET', 'x7K9mP2qL5nR8tY3vZ6wC4fH1jN0bM')
   ```

2. در `Backend/src/user/urls.py`:
   ```python
   ADMIN_SECRET = getattr(settings, 'ADMIN_URL_SECRET', '...')
   
   # URL واقعی
   path(f'admin/{ADMIN_SECRET}/auth/login/', AdminLoginView.as_view())
   
   # Honeypot (فیک)
   path('admin/login/', FakeAdminLoginView.as_view())
   ```

3. در `admin/src/core/config/adminEndpoints.ts`:
   ```typescript
   const ADMIN_SECRET = env.ADMIN_URL_SECRET;
   
   export function getAdminEndpoint(path: string): string {
     return `/admin/${ADMIN_SECRET}/${path}/`;
   }
   ```

**نتیجه:**
- Frontend از `adminEndpoints.login()` استفاده می‌کنه که خودش secret رو اضافه می‌کنه
- هکرها نمی‌تونن URL واقعی رو پیدا کنن
- URLهای قدیمی به Honeypot متصل شدن

---

### 2️⃣ **Honeypot (تله برای هکرها)**

#### چطور کار می‌کنه:

**URLهای قدیمی که هکرها امتحان می‌کنن:**
```
/api/admin/login/          → FakeAdminLoginView (Honeypot)
/api/admin/auth/login/      → FakeAdminLoginView (Honeypot)
/api/admin/register/        → FakeAdminLoginView (Honeypot)
```

**کد Honeypot:**
```python
# Backend/src/user/views/admin/admin_honeypot_view.py

class FakeAdminLoginView(APIView):
    def post(self, request):
        ip = self._get_client_ip(request)
        
        # ✅ چک بن بودن IP
        if IPBanService.is_banned(ip):
            return APIResponse.error("دسترسی مسدود شده", 403)
        
        # ✅ شناسایی بات
        if self._is_suspicious(request):
            logger.error(f"🚨🚨 SUSPICIOUS BOT: {ip}")
        
        # ✅ ثبت تلاش (بعد از 3 بار بن میشه)
        should_ban = IPBanService.record_attempt(ip)
        
        # ✅ لاگ کامل
        self._log_attempt(request, data=request.data)
        
        # ✅ تاخیر مصنوعی (2 ثانیه)
        time.sleep(2)
        
        # ✅ فیک response (فکر کنه login انجام شده)
        return APIResponse.error("نام کاربری یا رمز عبور اشتباه است", 401)
```

**نتیجه:**
- هکرها فکر می‌کنن URL واقعی رو پیدا کردن
- تمام تلاش‌ها لاگ می‌شن
- بعد از 3 تلاش، IP بن میشه
- بات‌ها شناسایی می‌شن

---

### 3️⃣ **IP Ban Service (بن خودکار)**

#### چطور کار می‌کنه:

**فایل:** `Backend/src/core/security/ip_ban.py`

```python
class IPBanService:
    MAX_ATTEMPTS = 3  # بعد از 3 تلاش
    BAN_DURATION = 3600  # 1 ساعت
    
    @classmethod
    def record_attempt(cls, ip: str) -> bool:
        attempts = cache.get(f'honeypot_attempts:{ip}', 0)
        attempts += 1
        cache.set(f'honeypot_attempts:{ip}', attempts, 3600)
        
        if attempts >= 3:
            cls.ban_ip(ip)  # بن کن!
            return True
        return False
    
    @classmethod
    def ban_ip(cls, ip: str):
        banned_ips = cache.get('banned_ips', {})
        banned_ips[ip] = {
            'reason': 'Too many honeypot attempts',
            'banned_at': str(timezone.now())
        }
        cache.set('banned_ips', banned_ips, 3600)
```

**استفاده:**
1. در Honeypot: بعد از هر تلاش، `record_attempt()` صدا زده میشه
2. در Middleware: قبل از هر درخواست ادمین، `is_banned()` چک میشه

**نتیجه:**
- بعد از 3 تلاش، IP به مدت 1 ساعت بن میشه
- تمام درخواست‌های بعدی از IP بن شده رد میشن

---

### 4️⃣ **Bot Detection (شناسایی بات‌ها)**

#### چطور کار می‌کنه:

```python
# Backend/src/user/views/admin/admin_honeypot_view.py

SUSPICIOUS_USER_AGENTS = [
    'bot', 'crawler', 'spider', 'scraper',
    'curl', 'wget', 'python-requests',
    'nikto', 'sqlmap', 'nmap', 'masscan',
    'scanner', 'exploit', 'hack', 'attack'
]

def _is_suspicious(self, request):
    user_agent = request.META.get('HTTP_USER_AGENT', '').lower()
    
    for pattern in SUSPICIOUS_USER_AGENTS:
        if pattern in user_agent:
            return True  # ✅ بات شناسایی شد!
    
    return False
```

**نتیجه:**
- User-Agent های مشکوک شناسایی می‌شن
- لاگ جداگانه برای بات‌ها
- می‌تونی IP رو سریع‌تر بن کنی

---

### 5️⃣ **چک‌های امنیتی در Login View**

#### چطور کار می‌کنه:

**فایل:** `Backend/src/user/views/admin/admin_login_view.py`

```python
def post(self, request):
    # ... authenticate ...
    
    if admin:
        # ✅ چک کامل و یکپارچه
        if not (admin.user_type == 'admin' and 
                admin.is_staff and 
                admin.is_admin_active):
            return APIResponse.error(
                "دسترسی رد شد. فقط مدیران فعال می‌توانند وارد شوند.",
                403
            )
        
        # ادامه login...
```

**چک‌ها:**
1. ✅ `user_type == 'admin'` - فقط ادمین‌ها
2. ✅ `is_staff == True` - باید staff باشه
3. ✅ `is_admin_active == True` - باید فعال باشه

**نتیجه:**
- کاربران عادی نمی‌تونن وارد بشن (حتی اگه password درست باشه)
- فقط ادمین‌های فعال می‌تونن login کنن

---

### 6️⃣ **AdminSecurityMiddleware (امنیت چندلایه)**

#### چطور کار می‌کنه:

**فایل:** `Backend/src/core/security/admin_security_middleware.py`

```python
class AdminSecurityMiddleware:
    def __call__(self, request):
        admin_path = f'/api/admin/{ADMIN_SECRET}/'
        
        if request.path.startswith(admin_path):
            client_ip = self._get_client_ip(request)
            
            # ✅ ۰. چک IP Ban (اول از همه!)
            if IPBanService.is_banned(client_ip):
                return JsonResponse({'error': 'Access denied'}, 403)
            
            # ✅ ۱. HTTPS اجباری (در production)
            if not request.is_secure() and not DEBUG:
                return JsonResponse({'error': 'HTTPS required'}, 403)
            
            # ✅ ۲. IP Whitelist (اختیاری)
            if ADMIN_ALLOWED_IPS and client_ip not in ADMIN_ALLOWED_IPS:
                return JsonResponse({'error': 'Access denied'}, 403)
            
            # ✅ ۳. لاگ کردن
            logger.info(f'🔐 Admin access: {request.method} {request.path} from {client_ip}')
        
        return self.get_response(request)
```

**مراحل چک:**
1. **IP Ban** - اگر IP بن شده، بلافاصله رد میشه
2. **HTTPS** - در production فقط HTTPS مجازه
3. **IP Whitelist** - اگر تنظیم شده، فقط IPهای مجاز
4. **لاگ** - تمام دسترسی‌ها لاگ می‌شن

**نتیجه:**
- چند لایه امنیتی
- لاگ کامل تمام دسترسی‌ها
- جلوگیری از دسترسی IPهای مشکوک

---

### 7️⃣ **Permission Classes جدید**

#### چطور کار می‌کنه:

**فایل:** `Backend/src/user/access_control/classes/admin_permission.py`

```python
class IsAdminUser(permissions.BasePermission):
    """
    فقط یوزرهایی با user_type='admin'
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # ✅ چک‌های امنیتی
        if request.user.user_type != 'admin':
            return False  # ❌ کاربر عادی
        
        if not request.user.is_staff:
            return False  # ❌ staff نیست
        
        if not request.user.is_admin_active:
            return False  # ❌ فعال نیست
        
        return True  # ✅ ادمین معتبر
```

**استفاده:**
```python
class AdminDashboardView(APIView):
    permission_classes = [IsAdminUser]  # ✅ فقط ادمین‌ها
```

**نتیجه:**
- کاربران عادی نمی‌تونن به APIهای ادمین دسترسی داشته باشن
- فقط ادمین‌های فعال می‌تونن دسترسی داشته باشن

---

## 🔄 جریان کامل Login

### مرحله 1: Frontend (Next.js)
```
کاربر → http://localhost:3000/login
     ↓
LoginForm → authApi.login()
     ↓
adminEndpoints.login() → /admin/{SECRET}/auth/login/
```

### مرحله 2: Backend (Django)

#### 2.1 Middleware چک‌ها:
```
درخواست → AdminSecurityMiddleware
     ↓
✅ چک IP Ban? → اگر بن شده: 403
     ↓
✅ چک HTTPS? → اگر production و HTTP: 403
     ↓
✅ چک IP Whitelist? → اگر تنظیم شده و مجاز نیست: 403
     ↓
✅ لاگ دسترسی
     ↓
ادامه...
```

#### 2.2 AdminLoginView:
```
درخواست → AdminLoginView.post()
     ↓
✅ Validate captcha
     ↓
✅ Authenticate (mobile + password)
     ↓
✅ چک user_type == 'admin'?
     ↓
✅ چک is_staff == True?
     ↓
✅ چک is_admin_active == True?
     ↓
✅ Create session در Redis
     ↓
✅ Return success + session cookie
```

### مرحله 3: Frontend Response:
```
Response → Session cookie set
     ↓
AuthContext → checkUserStatus()
     ↓
Redirect → /dashboard
```

---

## 🍯 جریان Honeypot (هکرها)

### اگر هکر URL قدیمی رو امتحان کنه:

```
هکر → /api/admin/login/
     ↓
FakeAdminLoginView (Honeypot)
     ↓
✅ چک IP Ban? → اگر بن شده: 403
     ↓
✅ شناسایی بات? → اگر مشکوک: لاگ ERROR
     ↓
✅ ثبت تلاش → attempts++
     ↓
✅ اگر attempts >= 3 → بن IP
     ↓
✅ لاگ کامل (IP, User-Agent, Data)
     ↓
✅ تاخیر 2 ثانیه
     ↓
✅ فیک response: "نام کاربری یا رمز عبور اشتباه است"
```

**نتیجه:**
- هکر فکر می‌کنه URL درست رو پیدا کرده
- تمام تلاش‌ها لاگ می‌شن
- بعد از 3 تلاش، IP بن میشه
- بات‌ها شناسایی می‌شن

---

## 📊 لاگ‌ها

### Security Logger:
```python
logger = logging.getLogger('security')

# Honeypot triggered
logger.warning("🚨 HONEYPOT TRIGGERED! {ip, user_agent, data}")

# Bot detected
logger.error("🚨🚨 SUSPICIOUS BOT DETECTED: {ip}")

# IP banned
logger.error("🚫 IP BANNED: {ip} | Reason: {reason}")
```

### Admin Security Logger:
```python
logger = logging.getLogger('admin_security')

# Admin access
logger.info("🔐 Admin access: {method} {path} from {ip}")

# Blocked access
logger.warning("🚨 Blocked admin access from {ip}")
```

---

## 🔐 لایه‌های امنیتی (از بیرون به داخل)

### لایه 1: URL Secret
- ✅ URL قابل حدس زدن نیست
- ✅ فقط کسانی که secret رو می‌دونن می‌تونن دسترسی داشته باشن

### لایه 2: Honeypot
- ✅ URLهای قدیمی به تله متصل شدن
- ✅ هکرها فکر می‌کنن URL واقعی رو پیدا کردن

### لایه 3: IP Ban
- ✅ بعد از 3 تلاش، IP بن میشه
- ✅ تمام درخواست‌های بعدی رد میشن

### لایه 4: Bot Detection
- ✅ بات‌ها شناسایی می‌شن
- ✅ لاگ جداگانه برای بات‌ها

### لایه 5: Middleware Security
- ✅ چک IP Ban
- ✅ چک HTTPS
- ✅ چک IP Whitelist
- ✅ لاگ تمام دسترسی‌ها

### لایه 6: Login View Checks
- ✅ چک user_type == 'admin'
- ✅ چک is_staff
- ✅ چک is_admin_active

### لایه 7: Permission Classes
- ✅ در سایر APIها، چک permission
- ✅ فقط ادمین‌های معتبر می‌تونن دسترسی داشته باشن

---

## 📝 خلاصه تغییرات

### Backend:
1. ✅ `ADMIN_URL_SECRET` به settings اضافه شد
2. ✅ URLهای ادمین با secret path شدند
3. ✅ `FakeAdminLoginView` (Honeypot) ساخته شد
4. ✅ `IPBanService` ساخته شد
5. ✅ `AdminSecurityMiddleware` ساخته شد
6. ✅ `IsAdminUser` Permission Class ساخته شد
7. ✅ چک‌های امنیتی در `AdminLoginView` اضافه شد
8. ✅ Logger های security اضافه شد

### Frontend:
1. ✅ `ADMIN_URL_SECRET` به environment اضافه شد
2. ✅ `adminEndpoints.ts` helper ساخته شد
3. ✅ تمام API routes به‌روزرسانی شدند
4. ✅ URLهای ادمین از helper استفاده می‌کنن

---

## ✅ نتیجه نهایی

### برای کاربر عادی:
- ✅ URL ورود همچنان `http://localhost:3000/login` است
- ✅ هیچ تغییری در UX نیست
- ✅ همه چیز مثل قبل کار می‌کنه

### برای هکرها:
- ❌ URLهای قدیمی به Honeypot متصل شدن
- ❌ بعد از 3 تلاش، IP بن میشه
- ❌ تمام تلاش‌ها لاگ می‌شن
- ❌ بات‌ها شناسایی می‌شن

### برای امنیت:
- ✅ URL قابل حدس زدن نیست
- ✅ چند لایه امنیتی
- ✅ لاگ کامل تمام دسترسی‌ها
- ✅ جلوگیری از دسترسی کاربران عادی
- ✅ IP Ban خودکار

---

**🎉 همه چیز آماده و امن است!**

