# 🔒 راهنمای تنظیم پنل ادمین Next.js

## ✅ تغییرات اعمال شده

### 1. Environment Variables
- ✅ `NEXT_PUBLIC_ADMIN_SECRET` اضافه شد به `environment.ts`
- ✅ Fallback برای development: `x7K9mP2qL5nR8tY3vZ6wC4fH1jN0bM`

### 2. Admin Endpoints Helper
- ✅ فایل جدید: `admin/src/core/config/adminEndpoints.ts`
- ✅ تمام URLهای ادمین با secret path
- ✅ Helper function برای ساخت URLها

### 3. به‌روزرسانی API Routes
- ✅ `admin/src/api/auth/route.ts` - تمام URLهای authentication
- ✅ `admin/src/api/admins/route.ts` - تمام URLهای management

---

## 🚀 راه‌اندازی

### مرحله 1: اضافه کردن Environment Variable

در فایل `.env.local` (یا `.env`) در پوشه `admin/`:

```env
# API Base URL
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api

# Admin Secret (باید با backend یکسان باشه!)
NEXT_PUBLIC_ADMIN_SECRET=x7K9mP2qL5nR8tY3vZ6wC4fH1jN0bM

# Media Base URL
NEXT_PUBLIC_MEDIA_BASE_URL=http://localhost:8000/media
```

**⚠️ مهم**: `NEXT_PUBLIC_ADMIN_SECRET` باید دقیقاً با `ADMIN_URL_SECRET` در backend یکسان باشه!

### مرحله 2: تولید Secret Key (اگر هنوز نکردی)

```bash
# در ترمینال
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

خروجی رو در `.env.local` و backend `.env` بذار.

### مرحله 3: Restart Next.js

```bash
cd admin
npm run dev
```

---

## 📋 URLهای جدید

### قبل (قدیمی):
- ❌ `/api/admin/login/`
- ❌ `/api/admin/logout/`
- ❌ `/api/admin/profile/`
- ❌ `/api/admin/management/`

### بعد (جدید):
- ✅ `/api/admin/{ADMIN_SECRET}/auth/login/`
- ✅ `/api/admin/{ADMIN_SECRET}/auth/logout/`
- ✅ `/api/admin/{ADMIN_SECRET}/profile/`
- ✅ `/api/admin/{ADMIN_SECRET}/management/`

---

## 🔧 استفاده از Admin Endpoints

### در API Routes:

```typescript
import { adminEndpoints } from '@/core/config/adminEndpoints';

// Login
const response = await fetchApi.post(adminEndpoints.login(), data);

// Profile
const profile = await fetchApi.get(adminEndpoints.profile());

// Management
const admins = await fetchApi.get(adminEndpoints.management());

// با ID
const admin = await fetchApi.get(adminEndpoints.managementById(123));
```

### Custom Endpoint:

```typescript
import { getAdminEndpoint } from '@/core/config/adminEndpoints';

const customUrl = getAdminEndpoint('custom/path');
// Result: /admin/{SECRET}/custom/path/
```

---

## ✅ Endpoint های آماده

### Authentication:
- `adminEndpoints.login()` - POST login
- `adminEndpoints.logout()` - POST logout
- `adminEndpoints.csrfToken()` - GET CSRF token
- `adminEndpoints.captchaGenerate()` - GET captcha

### Profile:
- `adminEndpoints.profile()` - GET/PUT profile
- `adminEndpoints.profileMe()` - GET current admin

### Management:
- `adminEndpoints.management()` - GET list
- `adminEndpoints.managementById(id)` - GET/PUT/DELETE by ID
- `adminEndpoints.managementBulkDelete()` - POST bulk delete

### Users:
- `adminEndpoints.usersManagement()` - GET list
- `adminEndpoints.usersManagementById(id)` - GET/PUT/DELETE by ID
- `adminEndpoints.usersManagementBulkDelete()` - POST bulk delete

### Roles & Permissions:
- `adminEndpoints.roles()` - GET/POST roles
- `adminEndpoints.rolesUserRoles(userId)` - GET user roles
- `adminEndpoints.rolesAssignRole()` - POST assign role
- `adminEndpoints.rolesRemoveRole(roleId, userId)` - DELETE role
- `adminEndpoints.permissionsMap()` - GET permissions map
- `adminEndpoints.permissionsCheck()` - POST check permission

---

## 🧪 تست

### 1. تست Login:
```bash
# در browser console
fetch('http://localhost:8000/api/admin/{SECRET}/auth/login/', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    mobile: '09123456789',
    password: 'test',
    captcha_id: '...',
    captcha_answer: '...'
  })
})
```

### 2. تست در Next.js:
- صفحه login رو باز کن
- با موبایل و پسورد ادمین وارد شو
- باید به dashboard منتقل بشی

---

## ⚠️ نکات مهم

1. **Secret Key**: باید در frontend و backend یکسان باشه
2. **Environment Variables**: حتماً در `.env.local` ست کن
3. **Restart**: بعد از تغییر `.env.local` باید Next.js رو restart کنی
4. **CORS**: مطمئن بش که CORS در backend درست تنظیم شده

---

## 🔍 Troubleshooting

### مشکل: 404 Not Found
- ✅ چک کن که `NEXT_PUBLIC_ADMIN_SECRET` درست ست شده
- ✅ چک کن که secret در backend و frontend یکسان باشه

### مشکل: CORS Error
- ✅ چک کن که `CORS_ALLOWED_ORIGINS` در backend شامل frontend URL باشه
- ✅ چک کن که `credentials: 'include'` در fetch options باشه

### مشکل: Session Not Working
- ✅ چک کن که cookies در browser set می‌شن
- ✅ چک کن که `SESSION_COOKIE_DOMAIN` در backend درست باشه

---

**✅ همه چیز آماده است!**

