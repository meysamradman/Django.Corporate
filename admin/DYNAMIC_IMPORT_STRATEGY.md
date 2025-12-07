# استراتژی Dynamic Import برای پنل ادمین Next.js 16

## 📊 خلاصه اجرایی

این داکیومنت نقشه راه کامل برای پیاده‌سازی Dynamic Import در پنل ادمین را ارائه می‌دهد.

**هدف:** کاهش Initial Bundle Size و بهبود Performance

---

## ✅ کامپوننت‌هایی که باید Dynamic Import شوند

### 🔴 اولویت 1: Modal Components

**چرا؟** Modal‌ها فقط با تعامل کاربر نمایش داده می‌شوند.

#### Media Modals

```typescript
// در تمام صفحاتی که از این Modal‌ها استفاده می‌کنند
import dynamic from "next/dynamic";

const MediaLibraryModal = dynamic(
  () => import("@/components/media/modals/MediaLibraryModal"),
  { 
    ssr: false, 
    loading: () => <div className="flex items-center justify-center p-8"><Spinner /></div> 
  }
);

const MediaDetailsModal = dynamic(
  () => import("@/components/media/modals/MediaDetailsModal"),
  { ssr: false, loading: () => <Spinner /> }
);

const MediaUploadModal = dynamic(
  () => import("@/components/media/modals/MediaUploadModal"),
  { ssr: false, loading: () => <Spinner /> }
);

const CoverImageManager = dynamic(
  () => import("@/components/media/modals/CoverImageManager"),
  { ssr: false, loading: () => <Spinner /> }
);
```

**استفاده در صفحات:**
- ✅ `src/app/(dashboard)/media/page.tsx`
- ✅ `src/app/(dashboard)/blogs/create/page.tsx`
- ✅ `src/app/(dashboard)/blogs/[id]/edit/page.tsx`
- ✅ `src/app/(dashboard)/portfolios/create/page.tsx`
- ✅ `src/app/(dashboard)/portfolios/[id]/edit/page.tsx`
- ✅ `src/app/(dashboard)/users/[id]/edit/page.tsx`
- ✅ `src/app/(dashboard)/admins/[id]/edit/page.tsx`

---

### 🟠 اولویت 2: Rich Text Editors

**چرا؟** Editor‌ها dependencies سنگین دارند (TipTap, Quill).

```typescript
const RichTextEditor = dynamic(
  () => import("@/components/elements/RichTextEditor"),
  { 
    ssr: false, 
    loading: () => (
      <div className="border rounded-lg p-4 min-h-[300px] bg-muted/20">
        <div className="animate-pulse space-y-3">
          <div className="h-8 bg-muted rounded w-full"></div>
          <div className="h-4 bg-muted rounded w-3/4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
      </div>
    )
  }
);
```

**استفاده در صفحات:**
- ✅ `src/app/(dashboard)/blogs/create/page.tsx`
- ✅ `src/app/(dashboard)/blogs/[id]/edit/page.tsx`
- ✅ `src/app/(dashboard)/portfolios/create/page.tsx`
- ✅ `src/app/(dashboard)/portfolios/[id]/edit/page.tsx`
- ✅ `src/app/(dashboard)/page/create/page.tsx`
- ✅ `src/app/(dashboard)/page/[id]/edit/page.tsx`
- ✅ `src/app/(dashboard)/email/compose/page.tsx`

---

### 🟡 اولویت 3: AI Components

**چرا؟** AI Components به browser APIs نیاز دارند و سنگین هستند.

```typescript
// Image Generation
const AIImageGenerator = dynamic(
  () => import("@/components/ai/image/AIImageGenerator"),
  { ssr: false, loading: () => <Spinner /> }
);

// Content Generation
const AIContentGenerator = dynamic(
  () => import("@/components/ai/content/AIContentGenerator"),
  { ssr: false, loading: () => <Spinner /> }
);

// Chatbot
const AIChatbot = dynamic(
  () => import("@/components/ai/chatbot/AIChatbot"),
  { ssr: false, loading: () => <Spinner /> }
);

// Audio Generation
const AIAudioGenerator = dynamic(
  () => import("@/components/ai/audio/AIAudioGenerator"),
  { ssr: false, loading: () => <Spinner /> }
);

// Model & Provider Selectors
const AIModelSelector = dynamic(
  () => import("@/components/ai/AIModelSelector"),
  { ssr: false, loading: () => <Spinner /> }
);

const AIProviderSelector = dynamic(
  () => import("@/components/ai/AIProviderSelector"),
  { ssr: false, loading: () => <Spinner /> }
);
```

**استفاده در صفحات:**
- ✅ `src/app/(dashboard)/ai/image-generation/page.tsx`
- ✅ `src/app/(dashboard)/ai/content-generation/page.tsx`
- ✅ `src/app/(dashboard)/ai/chat/page.tsx`
- ✅ `src/app/(dashboard)/ai/audio-generation/page.tsx`
- ✅ `src/app/(dashboard)/ai/settings/page.tsx`

---

### 🟢 اولویت 4: Heavy Data Tables

**چرا؟** DataTable‌ها @tanstack/react-table دارند که سنگین است.

```typescript
const DataTable = dynamic(
  () => import("@/components/tables/DataTable"),
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

**استفاده در صفحات:**
- ✅ `src/app/(dashboard)/users/page.tsx`
- ✅ `src/app/(dashboard)/admins/page.tsx`
- ✅ `src/app/(dashboard)/blogs/page.tsx`
- ✅ `src/app/(dashboard)/portfolios/page.tsx`
- ✅ `src/app/(dashboard)/media/page.tsx`
- ✅ `src/app/(dashboard)/ticket/page.tsx`
- ✅ `src/app/(dashboard)/email/page.tsx`
- ✅ `src/app/(dashboard)/roles/page.tsx`

---

### 🔵 اولویت 5: Chart & Analytics

**چرا؟** Chart libraries خیلی سنگین هستند.

```typescript
const StatisticsChart = dynamic(
  () => import("@/components/dashboard/StatisticsChart"),
  { 
    ssr: false, 
    loading: () => (
      <div className="h-[300px] flex items-center justify-center">
        <Spinner />
      </div>
    )
  }
);

const AnalyticsOverview = dynamic(
  () => import("@/components/dashboard/AnalyticsOverview"),
  { ssr: false, loading: () => <Spinner /> }
);

const UserActivityChart = dynamic(
  () => import("@/components/dashboard/UserActivityChart"),
  { ssr: false, loading: () => <Spinner /> }
);
```

**استفاده در صفحات:**
- ✅ `src/app/(dashboard)/page.tsx` (Dashboard اصلی)

---

### 🟣 اولویت 6: Form Builder

**چرا؟** Form Builder interactive و سنگین است.

```typescript
const FormBuilder = dynamic(
  () => import("@/components/form-builder/FormBuilder"),
  { ssr: false, loading: () => <Spinner /> }
);
```

**استفاده در صفحات:**
- ✅ `src/app/(dashboard)/form-builder/page.tsx`

---

### 🟤 اولویت 7: Media Upload/Gallery

**چرا؟** Media components به File APIs نیاز دارند.

```typescript
const MediaUploadZone = dynamic(
  () => import("@/components/media/upload/MediaUploadZone"),
  { ssr: false, loading: () => <Spinner /> }
);

const MediaGallery = dynamic(
  () => import("@/components/media/galleries/MediaGallery"),
  { ssr: false, loading: () => <Spinner /> }
);
```

**استفاده در صفحات:**
- ✅ `src/app/(dashboard)/media/page.tsx`

---

## ❌ کامپوننت‌هایی که نباید Dynamic Import شوند

### 🔴 Layout Components (Critical Path)

این کامپوننت‌ها در بالای صفحه هستند و باید فوراً لود شوند:

```typescript
// ❌ این‌ها نباید Dynamic باشند
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import Footer from "@/components/layout/Footer";
import Navigation from "@/components/layout/Navigation";
```

**چرا؟** Above the fold هستند و کاربر باید فوراً ببیند.

---

### 🔴 Small UI Elements

```typescript
// ❌ این‌ها نباید Dynamic باشند
import { Button } from "@/components/elements/Button";
import { Input } from "@/components/elements/Input";
import { Card } from "@/components/elements/Card";
import { Badge } from "@/components/elements/Badge";
import { Avatar } from "@/components/elements/Avatar";
import { Tooltip } from "@/components/elements/Tooltip";
```

**چرا؟** خیلی کوچک هستند (<5KB) و overhead بیشتر از فایده است.

---

### 🔴 Provider Components

```typescript
// ❌ این‌ها نباید Dynamic باشند
import { QueryProvider } from "@/components/providers/QueryProvider";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
```

**چرا؟** در root layout هستند و باید همیشه لود باشند.

---

### 🔴 Authentication Components

```typescript
// ❌ این‌ها نباید Dynamic باشند
import LoginForm from "@/components/auth/LoginForm";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
```

**چرا؟** Critical path هستند - اولین چیزی که کاربر باید ببیند.

---

## 📁 Checklist پیاده‌سازی

### ⚠️ **نکته مهم: فایل‌ها نیازی به Split ندارند!**

بعد از بررسی دقیق سایز فایل‌ها:
- MediaLibraryModal: ~24KB ✅ (نیاز به Split ندارد)
- MediaDetailsModal: ~16KB ✅ (نیاز به Split ندارد)
- DataTable: ~18KB ✅ (نیاز به Split ندارد)
- AIImageGenerator: ~7KB ✅ (نیاز به Split ندارد)

**فقط کافی است Dynamic Import کنیم - بدون تغییر ساختار فایل‌ها**

---

### مرحله 1: Modal Components (Dynamic Import) ✅
- [ ] Media Modals در `src/app/(dashboard)/media/page.tsx`
- [ ] Media Modals در `src/app/(dashboard)/blogs/`
- [ ] Media Modals در `src/app/(dashboard)/portfolios/`
- [ ] Media Modals در `src/app/(dashboard)/users/`
- [ ] Media Modals در `src/app/(dashboard)/admins/`

### مرحله 2: Rich Text Editors (Dynamic Import) ✅
- [ ] Editor در `src/app/(dashboard)/blogs/create/page.tsx`
- [ ] Editor در `src/app/(dashboard)/blogs/[id]/edit/page.tsx`
- [ ] Editor در `src/app/(dashboard)/portfolios/create/page.tsx`
- [ ] Editor در `src/app/(dashboard)/portfolios/[id]/edit/page.tsx`
- [ ] Editor در `src/app/(dashboard)/page/create/page.tsx`
- [ ] Editor در `src/app/(dashboard)/email/compose/page.tsx`

### مرحله 3: AI Components (Dynamic Import) ✅
- [ ] AIImageGenerator در `src/app/(dashboard)/ai/image-generation/page.tsx`
- [ ] AIContentGenerator در `src/app/(dashboard)/ai/content-generation/page.tsx`
- [ ] AIChatbot در `src/app/(dashboard)/ai/chat/page.tsx`
- [ ] AIAudioGenerator در `src/app/(dashboard)/ai/audio-generation/page.tsx`

### مرحله 4: Data Tables (Dynamic Import) ✅
- [ ] DataTable در `src/app/(dashboard)/users/page.tsx`
- [ ] DataTable در `src/app/(dashboard)/admins/page.tsx`
- [ ] DataTable در `src/app/(dashboard)/blogs/page.tsx`
- [ ] DataTable در `src/app/(dashboard)/portfolios/page.tsx`
- [ ] DataTable در `src/app/(dashboard)/media/page.tsx`

### مرحله 5: Charts (Dynamic Import) ✅
- [ ] Charts در `src/app/(dashboard)/page.tsx`

### مرحله 6: Form Builder (Dynamic Import) ✅
- [ ] FormBuilder در `src/app/(dashboard)/form-builder/page.tsx`

---

## 🎯 نتایج مورد انتظار

بعد از پیاده‌سازی کامل Dynamic Import (بدون Split):

- ✅ **Initial Bundle Size:** کاهش 40-60% (چون Modalها و Components سنگین lazy load می‌شوند)
- ✅ **Time to Interactive (TTI):** کاهش 30-50% (فقط کد ضروری در initial load)
- ✅ **First Contentful Paint (FCP):** بهبود 20-30% (صفحه سریع‌تر رندر می‌شود)
- ✅ **Lighthouse Performance Score:** افزایش 10-15 امتیاز
- ✅ **Maintenance:** ساختار فایل‌ها تغییر نمی‌کند → نگهداری آسان

### 🔍 **چرا Split نمی‌کنیم؟**

1. **فایل‌ها بهینه هستند:**
   - MediaLibraryModal: 24KB → زیر 30KB ✅
   - DataTable: 18KB → زیر 30KB ✅
   - AIImageGenerator: 7KB → زیر 30KB ✅

2. **Single Responsibility:**
   - هر فایل یک مسئولیت مشخص دارد
   - Split کردن باعث پیچیدگی بیشتر می‌شود

3. **Tree Shaking خودکار:**
   - Next.js 16 + Turbopack خودکار unused code را حذف می‌کند
   - Code splitting بهینه انجام می‌شود

4. **Dynamic Import کافی است:**
   ```typescript
   // ✅ کافی است - بدون نیاز به Split
   const MediaLibraryModal = dynamic(
     () => import("@/components/media/modals/MediaLibraryModal"),
     { ssr: false, loading: () => <Spinner /> }
   );
   ```

### 📈 **مقایسه روش‌ها:**

| روش | Bundle Size | Complexity | Maintenance | Performance |
|------|-------------|------------|-------------|-------------|
| **Static Import** | 🔴 بزرگ | ✅ ساده | ✅ آسان | 🔴 کند |
| **Dynamic Import** | ✅ کوچک | ✅ ساده | ✅ آسان | ✅ سریع |
| **Dynamic + Split** | ✅ کوچک | 🟡 متوسط | 🟡 متوسط | ✅ سریع |

**نتیجه:** Dynamic Import بدون Split بهترین گزینه است! 🎯

---

## 📝 نکات مهم

1. **همیشه Loading State بگذارید:**
   ```typescript
   loading: () => <Spinner />
   ```

2. **از Skeleton برای UX بهتر استفاده کنید:**
   ```typescript
   loading: () => <TableSkeleton />
   ```

3. **ssr: false برای Client-only Components:**
   ```typescript
   { ssr: false, loading: () => <Spinner /> }
   ```

4. **Test Performance با Lighthouse**

5. **Monitor Bundle Size با next build**

---

## ⚠️ اشتباهات رایج

1. ❌ Dynamic Import کردن همه چیز (over-splitting)
2. ❌ Dynamic Import کردن کامپوننت‌های کوچک
3. ❌ فراموش کردن Loading State
4. ❌ Dynamic Import کردن Layout Components
5. ❌ استفاده از Template Strings در path

---

**آخرین به‌روزرسانی:** 2025-12-07
**نسخه Next.js:** 16.0.3
**وضعیت:** آماده پیاده‌سازی
