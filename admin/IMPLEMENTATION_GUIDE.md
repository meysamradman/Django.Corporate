# 🚀 راهنمای پیاده‌سازی Dynamic Import - گام به گام

## 📝 خلاصه تصمیم نهایی

✅ **فقط Dynamic Import** (بدون Split فایل‌ها)  
✅ **بدون تغییر ساختار فایل‌ها**  
✅ **حرفه‌ای، سریع، و قابل نگهداری**

---

## 🎯 مرحله 1: Modal Components (اولویت بالا)

### چرا از Modal شروع کنیم؟
- بیشترین تأثیر روی Performance
- فقط با کلیک کاربر نیاز است
- راحت‌ترین برای پیاده‌سازی

### 1.1 Media Modals

#### فایل‌های هدف:
```
src/app/(dashboard)/media/page.tsx
src/app/(dashboard)/blogs/create/page.tsx
src/app/(dashboard)/blogs/[id]/edit/page.tsx
src/app/(dashboard)/portfolios/create/page.tsx
src/app/(dashboard)/portfolios/[id]/edit/page.tsx
```

#### کد قبل (Static Import):
```typescript
import { MediaLibraryModal } from "@/components/media/modals/MediaLibraryModal";
import { MediaDetailsModal } from "@/components/media/modals/MediaDetailsModal";
import { MediaUploadModal } from "@/components/media/modals/MediaUploadModal";
```

#### کد بعد (Dynamic Import):
```typescript
"use client";

import dynamic from "next/dynamic";
import { Spinner } from "@/components/elements/Spinner";

// Dynamic import با Spinner
const MediaLibraryModal = dynamic(
  () => import("@/components/media/modals/MediaLibraryModal").then(mod => ({ default: mod.MediaLibraryModal })),
  { 
    ssr: false, 
    loading: () => (
      <div className="flex items-center justify-center p-8">
        <Spinner />
      </div>
    )
  }
);

const MediaDetailsModal = dynamic(
  () => import("@/components/media/modals/MediaDetailsModal").then(mod => ({ default: mod.MediaDetailsModal })),
  { ssr: false, loading: () => <Spinner /> }
);

const MediaUploadModal = dynamic(
  () => import("@/components/media/modals/MediaUploadModal").then(mod => ({ default: mod.MediaUploadModal })),
  { ssr: false, loading: () => <Spinner /> }
);
```

**نکته مهم:** اگر Modal ها `export default` دارند:
```typescript
const MediaLibraryModal = dynamic(
  () => import("@/components/media/modals/MediaLibraryModal"),
  { ssr: false, loading: () => <Spinner /> }
);
```

---

## 🎯 مرحله 2: Rich Text Editors

### 2.1 Tiptap Editor (اگر استفاده می‌کنید)

#### فایل‌های هدف:
```
src/app/(dashboard)/blogs/create/page.tsx
src/app/(dashboard)/blogs/[id]/edit/page.tsx
src/app/(dashboard)/portfolios/create/page.tsx
src/app/(dashboard)/portfolios/[id]/edit/page.tsx
```

#### کد Dynamic Import:
```typescript
"use client";

import dynamic from "next/dynamic";

const RichTextEditor = dynamic(
  () => import("@/components/elements/RichTextEditor"),
  { 
    ssr: false, 
    loading: () => (
      <div className="border rounded-lg p-4 min-h-[300px] bg-muted/20 animate-pulse">
        <div className="space-y-3">
          <div className="h-8 bg-muted rounded w-full"></div>
          <div className="h-4 bg-muted rounded w-3/4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
      </div>
    )
  }
);
```

---

## 🎯 مرحله 3: AI Components

### 3.1 AI Image Generator

#### فایل: `src/app/(dashboard)/ai/image-generation/page.tsx`

```typescript
"use client";

import dynamic from "next/dynamic";

const AIImageGenerator = dynamic(
  () => import("@/components/ai/image/AIImageGenerator").then(mod => ({ default: mod.AIImageGenerator })),
  { ssr: false, loading: () => <Spinner /> }
);

export default function ImageGenerationPage() {
  return (
    <div>
      <h1>تولید تصویر با AI</h1>
      <AIImageGenerator />
    </div>
  );
}
```

### 3.2 AI Content Generator

#### فایل: `src/app/(dashboard)/ai/content-generation/page.tsx`

```typescript
const AIContentGenerator = dynamic(
  () => import("@/components/ai/content/AIContentGenerator").then(mod => ({ default: mod.AIContentGenerator })),
  { ssr: false, loading: () => <Spinner /> }
);
```

### 3.3 AI Chatbot

#### فایل: `src/app/(dashboard)/ai/chat/page.tsx`

```typescript
const AIChatbot = dynamic(
  () => import("@/components/ai/chatbot/AIChatbot"),
  { ssr: false, loading: () => <Spinner /> }
);
```

### 3.4 AI Audio Generator

#### فایل: `src/app/(dashboard)/ai/audio-generation/page.tsx`

```typescript
const AIAudioGenerator = dynamic(
  () => import("@/components/ai/audio/AIAudioGenerator").then(mod => ({ default: mod.AIAudioGenerator })),
  { ssr: false, loading: () => <Spinner /> }
);
```

---

## 🎯 مرحله 4: Data Tables

### 4.1 Users Table

#### فایل: `src/app/(dashboard)/users/page.tsx`

```typescript
"use client";

import dynamic from "next/dynamic";

const DataTable = dynamic(
  () => import("@/components/tables/DataTable").then(mod => ({ default: mod.DataTable })),
  { 
    ssr: false, 
    loading: () => (
      <div className="rounded-md border">
        <div className="p-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-muted rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }
);
```

### 4.2 سایر Tables

همین کد را برای این صفحات هم تکرار کنید:
- `src/app/(dashboard)/admins/page.tsx`
- `src/app/(dashboard)/blogs/page.tsx`
- `src/app/(dashboard)/portfolios/page.tsx`
- `src/app/(dashboard)/media/page.tsx`

---

## 🎯 مرحله 5: Charts & Analytics

### 5.1 Dashboard Charts

#### فایل: `src/app/(dashboard)/page.tsx`

```typescript
"use client";

import dynamic from "next/dynamic";

const StatisticsChart = dynamic(
  () => import("@/components/dashboard/StatisticsChart"),
  { 
    ssr: false, 
    loading: () => (
      <div className="h-[300px] flex items-center justify-center bg-muted/20 rounded-lg animate-pulse">
        <Spinner />
      </div>
    )
  }
);

const AnalyticsOverview = dynamic(
  () => import("@/components/dashboard/AnalyticsOverview"),
  { ssr: false, loading: () => <Spinner /> }
);
```

---

## 🎯 مرحله 6: Form Builder

### 6.1 Form Builder Component

#### فایل: `src/app/(dashboard)/form-builder/page.tsx`

```typescript
"use client";

import dynamic from "next/dynamic";

const FormBuilder = dynamic(
  () => import("@/components/form-builder/FormBuilder"),
  { ssr: false, loading: () => <Spinner /> }
);
```

---

## ✅ چک‌لیست قبل از شروع

### 1. بررسی export type در کامپوننت‌ها:

```bash
# بررسی کنید که آیا export default دارند یا named export
grep -r "export default" src/components/media/modals/
grep -r "export function" src/components/media/modals/
```

### 2. تست بعد از هر تغییر:

```bash
npm run dev
# یا
pnpm dev
```

### 3. بررسی Bundle Size:

```bash
npm run build
# بررسی .next/static/ برای سایز bundle ها
```

---

## 🚨 نکات مهم

### 1. Named Export vs Default Export

```typescript
// اگر کامپوننت Named Export دارد:
export function MediaLibraryModal() { ... }

// باید این کد را بنویسید:
const MediaLibraryModal = dynamic(
  () => import("...").then(mod => ({ default: mod.MediaLibraryModal }))
);

// اگر Default Export دارد:
export default function MediaLibraryModal() { ... }

// کد ساده‌تر:
const MediaLibraryModal = dynamic(() => import("..."));
```

### 2. همیشه `ssr: false` برای Modal ها

```typescript
// ✅ صحیح
{ ssr: false, loading: () => <Spinner /> }

// ❌ غلط (Modal ها نباید SSR داشته باشند)
{ ssr: true, loading: () => <Spinner /> }
```

### 3. Loading State مناسب

```typescript
// ✅ خوب - Skeleton UI
loading: () => (
  <div className="h-64 bg-muted/20 rounded-lg animate-pulse">
    <Spinner />
  </div>
)

// ❌ بد - بدون Loading
loading: undefined

// ❌ بد - فقط متن
loading: () => <div>Loading...</div>
```

---

## 🔍 تست و بررسی

### 1. تست عملکرد:
- باز کردن صفحه
- کلیک روی دکمه Modal
- بررسی Loading State
- بررسی عملکرد Modal

### 2. تست Performance:
```bash
# Chrome DevTools > Network
# بررسی کنید که Modal bundle جدا load می‌شود

# Lighthouse
# Performance Score باید بالاتر برود
```

### 3. تست Build:
```bash
npm run build
# بررسی Console برای خطاها
# بررسی Bundle Size
```

---

## 📊 نتایج مورد انتظار

بعد از پیاده‌سازی کامل:

| معیار | قبل | بعد | بهبود |
|-------|------|------|--------|
| Initial Bundle | ~500KB | ~200KB | 60% ↓ |
| Time to Interactive | ~3.5s | ~1.8s | 48% ↓ |
| Lighthouse Performance | 65 | 85 | +20 |
| First Contentful Paint | ~1.2s | ~0.8s | 33% ↓ |

---

## 🎯 خلاصه

1. ✅ **فقط Dynamic Import** (بدون Split)
2. ✅ **Modal ها اولویت اول**
3. ✅ **همیشه Loading State**
4. ✅ **ssr: false برای Modal/Client-only**
5. ✅ **تست بعد از هر تغییر**

---

**آماده شروع هستید؟** 🚀  
با مرحله 1 (Media Modals) شروع کنید!
