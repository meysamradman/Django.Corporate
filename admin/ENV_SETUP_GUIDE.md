# 🔧 راهنمای تنظیم Environment Variables

## 📋 **مشکل media/media از کجا میومد؟**

### ❌ **حالت اشتباه:**

```bash
# .env.local یا package.json
NEXT_PUBLIC_MEDIA_BASE_URL=http://localhost:8000/media
                                              ^^^^^^ ← این اضافیه!
```

```javascript
// Django Response
file_url: "/media/image/2025/10/17/f32f2629.jpg"
           ^^^^^^ ← این هم /media داره!

// ترکیب:
"http://localhost:8000/media" + "/media/image/..."
= "http://localhost:8000/media/media/image/..." ← تکرار! ❌
```

---

### ✅ **حالت درست:**

#### **گزینه 1: MEDIA_BASE_URL بدون /media (توصیه می‌کنم)**

```bash
# .env.local
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
NEXT_PUBLIC_MEDIA_BASE_URL=http://localhost:8000
                           ^^^^^^^^^^^^^^^^^^^^^^^ بدون /media
NEXT_PUBLIC_APP_NAME=Admin Panel
NEXT_PUBLIC_ENABLE_DEBUG_MODE=true
```

```javascript
// نتیجه:
"http://localhost:8000" + "/media/image/..."
= "http://localhost:8000/media/image/..." ✅
```

#### **گزینه 2: کد رو اصلاح کردم (فعلی) ✅**

```typescript
// در MediaTab.tsx
const baseUrl = env.MEDIA_BASE_URL.replace(/\/media\/?$/, '');
// ← این /media رو از آخر حذف می‌کنه

// "http://localhost:8000/media" → "http://localhost:8000"
// "http://localhost:8000" → "http://localhost:8000" (بدون تغییر)
```

**مزیت:** هر دو حالت کار می‌کنه! 🚀

---

## 📁 **چک کردن .env.local**

### **بررسی کن:**

```bash
# فایل .env.local رو پیدا کن در فولدر admin/
# اگه نداری، بساز:

admin/.env.local
```

### **محتوای صحیح:**

```bash
# API Settings
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api

# Media Settings (بدون /media در آخر)
NEXT_PUBLIC_MEDIA_BASE_URL=http://localhost:8000

# App Settings
NEXT_PUBLIC_APP_NAME=Admin Panel
NEXT_PUBLIC_ENABLE_DEBUG_MODE=true
```

---

## 🔍 **بررسی در مرورگر:**

```bash
1. باز کن Console (F12)
2. بنویس: console.log(process.env.NEXT_PUBLIC_MEDIA_BASE_URL)
3. باید ببینی: "http://localhost:8000" (بدون /media)
```

---

## ✅ **خلاصه:**

### **مشکل:**
- `NEXT_PUBLIC_MEDIA_BASE_URL` شامل `/media` بود
- `file_url` از Django هم `/media` داشت
- نتیجه: `media/media` تکراری!

### **راه‌حل:**
- کد رو robust کردم → همیشه کار می‌کنه
- `.replace(/\/media\/?$/, '')` → حذف /media از آخر

### **توصیه:**
- `.env.local` رو درست کن:
  ```
  NEXT_PUBLIC_MEDIA_BASE_URL=http://localhost:8000
  ```
- بعد سرور رو restart کن

---

**حالا کار می‌کنه! 🎉**

