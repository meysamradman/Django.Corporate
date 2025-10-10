# Media Components - راهنمای استفاده

این کامپوننت‌ها برای استفاده از سیستم مدیا مرکزی در پنل ادمین طراحی شده‌اند.

## 🖼️ MediaSelector

کامپوننت انتخاب تصویر عمومی که قابل استفاده مجدد در همه جاها است.

### ویژگی‌ها:
- **انتخاب تصویر** از کتابخانه مدیا مرکزی
- **نمایش پیش‌نمایش** تصویر انتخاب شده
- **حذف تصویر** با دکمه جداگانه
- **اندازه‌های مختلف** (sm, md, lg)
- **قابلیت شخصی‌سازی** label و className

### نحوه استفاده:

```tsx
import { MediaSelector } from "@/components/media";

function AdminForm() {
    const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);

    return (
        <MediaSelector
            selectedMedia={selectedMedia}
            onMediaSelect={setSelectedMedia}
            label="تصویر پروفایل"
            size="md"
        />
    );
}
```

### Props:
- `selectedMedia`: Media | null - تصویر انتخاب شده
- `onMediaSelect`: (media: Media | null) => void - تابع تغییر تصویر
- `label`: string - برچسب فیلد (پیش‌فرض: "تصویر پروفایل")
- `size`: "sm" | "md" | "lg" - اندازه کامپوننت (پیش‌فرض: "md")
- `showLabel`: boolean - نمایش/عدم نمایش برچسب (پیش‌فرض: true)
- `className`: string - کلاس‌های اضافی CSS

## 📤 MediaUploadButton

کامپوننت آپلود فایل جدید به سیستم مدیا مرکزی.

### ویژگی‌ها:
- **آپلود فایل** به سیستم مدیا مرکزی
- **نمایش مودال آپلود** با تمام امکانات
- **قابلیت شخصی‌سازی** ظاهر دکمه
- **Callback پس از آپلود** موفق

### نحوه استفاده:

```tsx
import { MediaUploadButton } from "@/components/media";

function MediaManager() {
    const handleUploadComplete = () => {
        // پس از آپلود موفق
        console.log("فایل آپلود شد");
    };

    return (
        <MediaUploadButton
            onUploadComplete={handleUploadComplete}
            variant="outline"
            size="md"
        >
            آپلود فایل جدید
        </MediaUploadButton>
    );
}
```

### Props:
- `onUploadComplete`: () => void - تابع اجرا شده پس از آپلود موفق
- `variant`: "default" | "outline" | "ghost" - نوع دکمه
- `size`: "sm" | "md" | "lg" - اندازه دکمه
- `children`: React.ReactNode - محتوای دکمه
- `className`: string - کلاس‌های اضافی CSS
- `showIcon`: boolean - نمایش/عدم نمایش آیکون (پیش‌فرض: true)

## ⚡ QuickMediaUploadButton

نسخه سریع MediaUploadButton برای استفاده در جاهای کوچک.

### ویژگی‌ها:
- **دکمه کوچک** با آیکون + 
- **مودال آپلود** کامل
- **مناسب برای** header ها و toolbar ها

### نحوه استفاده:

```tsx
import { QuickMediaUploadButton } from "@/components/media";

function Header() {
    return (
        <header>
            <QuickMediaUploadButton
                onUploadComplete={() => console.log("آپلود شد")}
                size="sm"
            />
        </header>
    );
}
```

## 🔧 نحوه استفاده در فرم‌ها

### فرم ایجاد ادمین:
```tsx
import { MediaSelector } from "@/components/media";

export function CreateAdminForm() {
    const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);

    const handleSubmit = async () => {
        const formData = new FormData();
        // ... سایر فیلدها
        
        if (selectedMedia?.id) {
            formData.append('profile_picture_id', selectedMedia.id.toString());
        }
        
        // ارسال به سرور
    };

    return (
        <form>
            <MediaSelector
                selectedMedia={selectedMedia}
                onMediaSelect={setSelectedMedia}
                label="تصویر پروفایل"
                size="md"
            />
            {/* سایر فیلدها */}
        </form>
    );
}
```

### فرم ویرایش ادمین:
```tsx
export function EditAdminForm({ admin }) {
    const [selectedMedia, setSelectedMedia] = useState<Media | null>(
        admin.profile_picture ? admin.profile_picture : null
    );

    return (
        <form>
            <MediaSelector
                selectedMedia={selectedMedia}
                onMediaSelect={setSelectedMedia}
                label="تصویر پروفایل"
                size="lg"
            />
        </form>
    );
}
```

## 🎯 مزایای استفاده از این کامپوننت‌ها

1. **قابلیت استفاده مجدد** - یک بار نوشته، همه جا استفاده
2. **یکپارچگی** - همه کامپوننت‌ها از سیستم مدیا مرکزی استفاده می‌کنند
3. **بهینه‌سازی** - کد تکراری حذف شده
4. **نگهداری آسان** - تغییرات در یک جا اعمال می‌شود
5. **تجربه کاربری یکسان** - همه جا UI مشابه
6. **Type Safety** - استفاده کامل از TypeScript

## 🚀 نکات مهم

- **همیشه از Media ID استفاده کنید** نه از File object
- **MediaSelector برای انتخاب** تصاویر موجود استفاده کنید
- **MediaUploadButton برای آپلود** فایل‌های جدید استفاده کنید
- **onUploadComplete callback** برای به‌روزرسانی UI استفاده کنید

## 📋 مثال‌های استفاده در جاهای مختلف

### 1. انتخاب تصویر پروفایل:
```tsx
<MediaSelector
    selectedMedia={selectedMedia}
    onMediaSelect={setSelectedMedia}
    label="تصویر پروفایل"
    size="md"
/>
```

### 2. انتخاب تصویر نمونه کار:
```tsx
<MediaSelector
    selectedMedia={selectedMedia}
    onMediaSelect={setSelectedMedia}
    label="تصویر نمونه کار"
    size="lg"
/>
```

### 3. انتخاب تصویر مقاله:
```tsx
<MediaSelector
    selectedMedia={selectedMedia}
    onMediaSelect={setSelectedMedia}
    label="تصویر شاخص مقاله"
    size="md"
/>
```

### 4. انتخاب تصویر محصول:
```tsx
<MediaSelector
    selectedMedia={selectedMedia}
    onMediaSelect={setSelectedMedia}
    label="تصویر محصول"
    size="lg"
/>
```

### 5. انتخاب لوگو شرکت:
```tsx
<MediaSelector
    selectedMedia={selectedMedia}
    onMediaSelect={setSelectedMedia}
    label="لوگو شرکت"
    size="sm"
/>
```
