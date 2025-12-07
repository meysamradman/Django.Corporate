# 🎯 راهنمای عملی Dynamic Import برای پنل ادمین

## ✅ **باید Dynamic Import کنید:**

### 1. **TipTap Editor** (سنگین - >100KB)
```typescript
// ✅ در page.tsx که از TipTap استفاده می‌کند
const TipTapEditor = dynamic(
  () => import("@/components/forms/TipTapEditor").then((mod) => mod.TipTapEditor),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 flex items-center justify-center">
        <Spinner className="size-8 text-primary" />
      </div>
    ),
  }
);
```

**کجا استفاده می‌شود:**
- `components/blogs/list/create/BaseInfoTab.tsx`
- `components/portfolios/list/create/BaseInfoTab.tsx`
- `components/page/tabs/BaseInfoTab.tsx`

---

### 2. **Modal‌ها** (فقط با کلیک باز می‌شوند)
```typescript
// ✅ در page.tsx
const MediaLibraryModal = dynamic(
  () => import("@/components/media/modals/MediaLibraryModal").then((mod) => mod.MediaLibraryModal),
  {
    ssr: false,
    loading: () => <ModalSkeleton />
  }
);

const MediaUploadModal = dynamic(
  () => import("@/components/media/modals/MediaUploadModal").then((mod) => mod.MediaUploadModal),
  { ssr: false }
);
```

**Modal‌های موجود:**
- `MediaLibraryModal` - سنگین
- `MediaUploadModal` - سنگین
- `MediaDetailsModal` - متوسط
- `ComposeEmailDialog` - متوسط
- `ReplyTicketDialog` - متوسط
- `FAQDialog` - سبک (اما modal است)

---

### 3. **Dialog‌ها** (فقط با کلیک باز می‌شوند)
```typescript
// ✅ در page.tsx
const ComposeEmailDialog = dynamic(
  () => import("@/components/email/ComposeEmailDialog").then((mod) => mod.ComposeEmailDialog),
  { ssr: false }
);

const FAQDialog = dynamic(
  () => import("@/components/ai/chatbot/components/FAQDialog").then((mod) => mod.FAQDialog),
  { ssr: false }
);
```

---

### 4. **Tab Components** (Conditional - فقط وقتی tab فعال است)
```typescript
// ✅ در EditForm.tsx (درست است!)
const AccountTab = dynamic(
  () => import("@/components/admins/profile/AccountTab").then((mod) => mod.AccountTab),
  { loading: () => <TabSkeleton />, ssr: false }
);

const SecurityTab = dynamic(
  () => import("@/components/admins/profile/SecurityTab").then((mod) => mod.SecurityTab),
  { loading: () => <TabSkeleton />, ssr: false }
);
```

**Tab‌های موجود:**
- `AccountTab`, `SecurityTab`, `SocialTab`, `AdvancedSettingsTab` ✅ (درست است)
- `BaseInfoTab`, `SEOTab`, `MediaTab` - در create/edit pages

---

### 5. **Form Components بزرگ** (>30KB)
```typescript
// ✅ Form‌های بزرگ مثل EditAdminForm
const EditAdminForm = dynamic(
  () => import("@/components/admins/edit/EditForm").then((mod) => mod.EditAdminForm),
  { ssr: false, loading: () => <FormSkeleton /> }
);
```

---

## ❌ **نباید Dynamic Import کنید:**

### 1. **DataTable** (همیشه نیاز است - Above the Fold)
```typescript
// ❌ اشتباه
const DataTable = dynamic(() => import("@/components/tables/DataTable"));

// ✅ صحیح - Static import
import { DataTable } from "@/components/tables/DataTable";
```

**چرا؟**
- همیشه در صفحه نمایش داده می‌شود
- Above the fold است
- کاربر باید فوراً ببیند

---

### 2. **UI Elements کوچک** (Button, Input, Card)
```typescript
// ❌ اشتباه
const Button = dynamic(() => import("@/components/elements/Button"));

// ✅ صحیح
import { Button } from "@/components/elements/Button";
```

**چرا؟**
- کوچک هستند (<5KB)
- همیشه نیاز هستند
- Overhead بیشتر از فایده

---

### 3. **Layout Components** (Header, Sidebar, Footer)
```typescript
// ❌ اشتباه
const Sidebar = dynamic(() => import("@/components/layout/Sidebar/Sidebar"));

// ✅ صحیح
import { Sidebar } from "@/components/layout/Sidebar/Sidebar";
```

**چرا؟**
- Critical path هستند
- Above the fold
- همیشه نیاز هستند

---

### 4. **Table Columns & Filters** (همیشه نیاز هستند)
```typescript
// ❌ اشتباه
const useBlogColumns = dynamic(() => import("@/components/blogs/list/BlogTableColumns"));

// ✅ صحیح
import { useBlogColumns } from "@/components/blogs/list/BlogTableColumns";
```

---

## 📋 **چک‌لیست برای هر کامپوننت:**

```
✅ Dynamic Import کن اگر:
  □ کامپوننت > 30KB است
  □ فقط با user interaction نیاز است (modal, dialog)
  □ در Tab یا Accordion است (conditional)
  □ Below the fold است
  □ کتابخانه Third-party سنگین دارد (TipTap, Chart.js)
  □ به browser APIs نیاز دارد (window, localStorage)

❌ Dynamic Import نکن اگر:
  □ Above the fold است
  □ کامپوننت < 5KB است
  □ همیشه نیاز است (DataTable, Header, Sidebar)
  □ در Navigation است
  □ Critical path است
```

---

## 🎯 **برای پروژه شما - لیست کامپوننت‌ها:**

### ✅ **باید Dynamic شوند:**

1. **TipTapEditor** - در همه create/edit pages
2. **MediaLibraryModal** - در همه جاهایی که استفاده می‌شود
3. **MediaUploadModal** - در media page
4. **ComposeEmailDialog** - در email page
5. **ReplyTicketDialog** - در ticket page
6. **FAQDialog** - در settings pages
7. **QuickCreateDialog** - در blog/portfolio create
8. **Tab Components** - در EditForm‌ها (✅ درست است)
9. **EditForm Components** - در edit pages (✅ درست است)

### ❌ **نباید Dynamic شوند:**

1. **DataTable** - همیشه نیاز است
2. **Button, Input, Card** - کوچک هستند
3. **Sidebar, Header** - Layout components
4. **Table Columns** - همیشه نیاز هستند
5. **Table Filters** - همیشه نیاز هستند
6. **PaginationControls** - کوچک است
7. **PageHeader** - کوچک است

---

## 💡 **مثال عملی برای پروژه:**

### **مثال 1: Blog Create Page**
```typescript
// app/(dashboard)/blogs/(list)/create/page.tsx
"use client";

import dynamic from "next/dynamic";
import { Spinner } from "@/components/elements/Spinner";

// ✅ TipTapEditor - سنگین
const TipTapEditor = dynamic(
  () => import("@/components/forms/TipTapEditor").then((mod) => mod.TipTapEditor),
  { ssr: false, loading: () => <EditorSkeleton /> }
);

// ✅ Modal - فقط با کلیک
const MediaLibraryModal = dynamic(
  () => import("@/components/media/modals/MediaLibraryModal").then((mod) => mod.MediaLibraryModal),
  { ssr: false }
);

// ✅ Tab - conditional
const BaseInfoTab = dynamic(
  () => import("@/components/blogs/list/create/BaseInfoTab").then((mod) => mod.default),
  { ssr: false, loading: () => <TabSkeleton /> }
);

// ❌ Static - همیشه نیاز است
import { DataTable } from "@/components/tables/DataTable";
import { Button } from "@/components/elements/Button";
```

---

## 🚀 **نتیجه:**

**قاعده کلی:**
- **کامپوننت‌های بزرگ (>30KB)** → Dynamic
- **Modal/Dialog** → Dynamic
- **Tab Components** → Dynamic
- **Editor (TipTap)** → Dynamic
- **کامپوننت‌های کوچک (<5KB)** → Static
- **Layout Components** → Static
- **DataTable** → Static

**استراتژی شما درست است!** 🎉
