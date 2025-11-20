# راهنمای برگرداندن مقادیر بعد از تست

## ⚠️ بعد از تست، این فایل‌ها را به حالت اصلی برگردانید:

### 1. Backend: `Backend/config/django/base.py`

**خطوط 298-303 را به این تغییر دهید:**

```python
MEDIA_FILE_SIZE_LIMITS = {
    'image': int(os.getenv('MEDIA_IMAGE_SIZE_LIMIT', 5 * 1024 * 1024)),      # Default: 5MB
    'video': int(os.getenv('MEDIA_VIDEO_SIZE_LIMIT', 150 * 1024 * 1024)),    # Default: 150MB
    'audio': int(os.getenv('MEDIA_AUDIO_SIZE_LIMIT', 20 * 1024 * 1024)),     # Default: 20MB
    'pdf': int(os.getenv('MEDIA_PDF_SIZE_LIMIT', 10 * 1024 * 1024)),         # Default: 10MB
}
```

### 2. Frontend: `admin/src/core/config/media.ts`

**خطوط 24-29 را به این تغییر دهید:**

```typescript
export const MEDIA_SIZE_LIMITS = {
  image: 5 * 1024 * 1024,        // 5MB
  video: 150 * 1024 * 1024,      // 150MB
  audio: 20 * 1024 * 1024,       // 20MB
  document: 10 * 1024 * 1024,    // 10MB
} as const;
```

### 3. بعد از تغییر:

1. **Backend را restart کنید**
2. **Cache را پاک کنید** (یا 1 ساعت صبر کنید)
3. **Frontend را rebuild کنید** (اگر production است)

---

## ✅ چک‌لیست بعد از برگرداندن:

- [ ] بک‌اند restart شده
- [ ] `/api/core/upload-settings/` مقادیر اصلی را برمی‌گرداند
- [ ] فرانت fallback مقادیر اصلی را دارد
- [ ] تست آپلود با فایل‌های بزرگتر از 500KB موفق می‌شود

