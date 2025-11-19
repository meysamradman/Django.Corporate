---
trigger: manual
---
# تنظیمات محدودیت Media در Portfolio

## متغیرهای محیطی (Environment Variables)

### Backend (.env)

```env
# محدودیت تعداد Media در List View (برای performance)
# پیش‌فرض: 5
PORTFOLIO_MEDIA_LIST_LIMIT=5

# محدودیت تعداد Media در Detail View (0 = بدون محدودیت)
# پیش‌فرض: 0 (بدون محدودیت)
PORTFOLIO_MEDIA_DETAIL_LIMIT=0

# حداکثر تعداد Media که می‌توان در یک بار آپلود کرد
# پیش‌فرض: 50
PORTFOLIO_MEDIA_UPLOAD_MAX=50
```

### Frontend (.env.local)

```env
# حداکثر تعداد Media که می‌توان در یک بار آپلود کرد
# باید با PORTFOLIO_MEDIA_UPLOAD_MAX در backend یکسان باشد
NEXT_PUBLIC_PORTFOLIO_MEDIA_UPLOAD_MAX=50

# محدودیت تعداد Media در List View
# باید با PORTFOLIO_MEDIA_LIST_LIMIT در backend یکسان باشد
NEXT_PUBLIC_PORTFOLIO_MEDIA_LIST_LIMIT=5
```

## توضیحات

### PORTFOLIO_MEDIA_LIST_LIMIT
- تعداد Media که در API List View برگردانده می‌شود
- برای هر نوع Media (Image, Video, Audio, Document) به صورت جداگانه اعمال می‌شود
- هدف: کاهش حجم Response و بهبود Performance

### PORTFOLIO_MEDIA_DETAIL_LIMIT
- تعداد Media که در API Detail View برگردانده می‌شود
- اگر 0 باشد = بدون محدودیت (همه Media ها برگردانده می‌شوند)
- اگر عددی بزرگتر از 0 باشد = محدود به آن تعداد

### PORTFOLIO_MEDIA_UPLOAD_MAX
- حداکثر تعداد Media که می‌توان در یک درخواست آپلود کرد
- شامل هم File های جدید و هم Media ID های موجود
- Validation در Frontend و Backend انجام می‌شود

## مثال استفاده

```env
# برای سرورهای قوی‌تر
PORTFOLIO_MEDIA_LIST_LIMIT=10
PORTFOLIO_MEDIA_DETAIL_LIMIT=0
PORTFOLIO_MEDIA_UPLOAD_MAX=100

# برای سرورهای ضعیف‌تر
PORTFOLIO_MEDIA_LIST_LIMIT=3
PORTFOLIO_MEDIA_DETAIL_LIMIT=20
PORTFOLIO_MEDIA_UPLOAD_MAX=25
```

