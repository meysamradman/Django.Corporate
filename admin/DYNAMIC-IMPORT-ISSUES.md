# 🔍 بررسی Dynamic Import در پروژه - مشکلات و راه‌حل

## ✅ **کامپوننت‌هایی که درست Dynamic هستند:**

1. ✅ `EditAdminForm` - در `app/(dashboard)/admins/[id]/edit/page.tsx`
2. ✅ `LoginForm` - در `app/(auth)/login/page.tsx`
3. ✅ `AccountTab`, `SecurityTab` - در `app/(dashboard)/users/[id]/edit/EditForm.tsx`
4. ✅ `BaseInfoTab`, `MediaTab`, `SEOTab` - در blog/portfolio edit pages (lazy)

---

## ❌ **کامپوننت‌هایی که باید Dynamic شوند اما الان نیستند:**

### 1. **Modal‌ها در Media Page** ❌
**فایل:** `app/(dashboard)/media/page.tsx`

**مشکل:**
```typescript
// ❌ الان - Static import
import { MediaUploadModal } from '@/components/media/modals/MediaUploadModal';
import { MediaDetailsModal } from '@/components/media/modals/MediaDetailsModal';
```

**باید باشد:**
```typescript
// ✅ باید - Dynamic import
const MediaUploadModal = dynamic(
  () => import('@/components/media/modals/MediaUploadModal').then((mod) => mod.MediaUploadModal),
  { ssr: false }
);

const MediaDetailsModal = dynamic(
  () => import('@/components/media/modals/MediaDetailsModal').then((mod) => mod.MediaDetailsModal),
  { ssr: false }
);
```

---

### 2. **MediaLibraryModal در چند صفحه** ❌
**فایل‌ها:**
- `app/(dashboard)/portfolios/categories/create/page.tsx`
- `app/(dashboard)/blogs/categories/create/page.tsx`
- `app/(dashboard)/settings/panel/LogoUploader.tsx`

**مشکل:**
```typescript
// ❌ الان - Static import
import { MediaLibraryModal } from "@/components/media/modals/MediaLibraryModal";
```

**باید باشد:**
```typescript
// ✅ باید - Dynamic import
const MediaLibraryModal = dynamic(
  () => import("@/components/media/modals/MediaLibraryModal").then((mod) => mod.MediaLibraryModal),
  { ssr: false }
);
```

---

### 3. **ComposeEmailDialog** ❌
**فایل:** `app/(dashboard)/email/page.tsx`

**مشکل:**
```typescript
// ❌ الان - Static import
import { ComposeEmailDialog } from "@/components/email/ComposeEmailDialog";
```

**باید باشد:**
```typescript
// ✅ باید - Dynamic import
const ComposeEmailDialog = dynamic(
  () => import("@/components/email/ComposeEmailDialog").then((mod) => mod.ComposeEmailDialog),
  { ssr: false }
);
```

---

### 4. **ReplyTicketDialog** ❌
**فایل:** `app/(dashboard)/ticket/page.tsx`

**مشکل:**
```typescript
// ❌ الان - Static import
import { ReplyTicketDialog } from "@/components/ticket/ReplyTicketDialog";
```

**باید باشد:**
```typescript
// ✅ باید - Dynamic import
const ReplyTicketDialog = dynamic(
  () => import("@/components/ticket/ReplyTicketDialog").then((mod) => mod.ReplyTicketDialog),
  { ssr: false }
);
```

---

### 5. **FAQDialog در Settings** ❌
**فایل‌ها:**
- `app/(dashboard)/settings/website/components/FAQManagement.tsx`
- `app/(dashboard)/settings/chatbot/components/FAQManagement.tsx`

**مشکل:**
```typescript
// ❌ الان - Static import
import { FAQDialog } from "./FAQDialog";
```

**باید باشد:**
```typescript
// ✅ باید - Dynamic import
const FAQDialog = dynamic(
  () => import("./FAQDialog").then((mod) => mod.FAQDialog),
  { ssr: false }
);
```

---

### 6. **QuickCreateDialog در BaseInfoTab** ❌
**فایل:** `components/blogs/list/create/BaseInfoTab.tsx` و `components/portfolios/list/create/BaseInfoTab.tsx`

**مشکل:**
```typescript
// ❌ الان - Static import
import { QuickCreateDialog } from "./QuickCreateDialog";
```

**باید باشد:**
```typescript
// ✅ باید - Dynamic import
const QuickCreateDialog = dynamic(
  () => import("./QuickCreateDialog").then((mod) => mod.QuickCreateDialog),
  { ssr: false }
);
```

**نکته:** این در component است نه page.tsx، اما چون Dialog است و فقط با کلیک باز می‌شود، بهتر است dynamic باشد.

---

## ✅ **کامپوننت‌هایی که درست Static هستند:**

1. ✅ `DataTable` - همیشه نیاز است
2. ✅ `Button`, `Input`, `Card` - کوچک هستند
3. ✅ `Sidebar`, `Header` - Layout components
4. ✅ `TipTapEditor` - در BaseInfoTab استفاده می‌شود که خودش lazy است (درست است)

---

## 📋 **خلاصه مشکلات:**

| کامپوننت | فایل | وضعیت | اولویت |
|---------|------|-------|--------|
| MediaUploadModal | `media/page.tsx` | ❌ Static | 🔴 بالا |
| MediaDetailsModal | `media/page.tsx` | ❌ Static | 🔴 بالا |
| MediaLibraryModal | `portfolios/categories/create/page.tsx` | ❌ Static | 🔴 بالا |
| MediaLibraryModal | `blogs/categories/create/page.tsx` | ❌ Static | 🔴 بالا |
| MediaLibraryModal | `settings/panel/LogoUploader.tsx` | ❌ Static | 🔴 بالا |
| ComposeEmailDialog | `email/page.tsx` | ❌ Static | 🔴 بالا |
| ReplyTicketDialog | `ticket/page.tsx` | ❌ Static | 🔴 بالا |
| FAQDialog | `settings/website/components/FAQManagement.tsx` | ❌ Static | 🟡 متوسط |
| FAQDialog | `settings/chatbot/components/FAQManagement.tsx` | ❌ Static | 🟡 متوسط |
| QuickCreateDialog | `blogs/list/create/BaseInfoTab.tsx` | ❌ Static | 🟡 متوسط |
| QuickCreateDialog | `portfolios/list/create/BaseInfoTab.tsx` | ❌ Static | 🟡 متوسط |

---

## 🎯 **اقدامات لازم:**

1. **Modal‌ها در Media Page** - باید dynamic شوند
2. **Dialog‌ها در Email/Ticket Pages** - باید dynamic شوند
3. **MediaLibraryModal در همه جا** - باید dynamic شود
4. **FAQDialog در Settings** - باید dynamic شود
5. **QuickCreateDialog** - باید dynamic شود

---

## 💡 **نکته مهم:**

**TipTapEditor** در BaseInfoTab استفاده می‌شود که خودش lazy است. این درست است چون:
- BaseInfoTab فقط وقتی tab فعال است لود می‌شود
- TipTapEditor داخل BaseInfoTab است
- پس TipTapEditor هم lazy است (indirectly)

**اما** اگر TipTapEditor مستقیماً در page.tsx استفاده می‌شد، باید dynamic می‌بود.
