# 🔄 وضعیت تبدیل Next.js به React + Vite

## 📊 پیشرفت کلی

**تبدیل شده:** 4 / 46 فایل (8.7%)  
**باقیمانده:** 42 فایل

## ✅ فایل‌های تبدیل شده

### Admins (3/3) ✅
- [x] `/pages/admins/page.tsx`
- [x] `/pages/admins/create/page.tsx`
- [x] `/pages/admins/[id]/edit/page.tsx`

### Users (1/3) 🔄
- [x] `/pages/users/page.tsx`
- [ ] `/pages/users/create/page.tsx`
- [ ] `/pages/users/[id]/edit/page.tsx`

## 🔧 تغییرات اعمال شده

### 1. Navigation
```typescript
// ❌ قبل
import { useRouter } from "next/navigation";
const router = useRouter();
router.push("/path");

// ✅ بعد
import { useNavigate } from "react-router-dom";
const navigate = useNavigate();
navigate("/path");
```

### 2. Link Component
```typescript
// ❌ قبل
import Link from "next/link";
<Link href="/path">Text</Link>

// ✅ بعد
import { Link } from "react-router-dom";
<Link to="/path">Text</Link>
```

### 3. Dynamic Imports
```typescript
// ❌ قبل
import dynamic from "next/dynamic";
const Component = dynamic(() => import("..."), { ssr: false });

// ✅ بعد
import { lazy, Suspense } from "react";
const Component = lazy(() => import("..."));
<Suspense fallback={<Loading />}>
  <Component />
</Suspense>
```

### 4. Permission Imports (مهم!)
```typescript
// ❌ قبل (اشتباه)
import { ProtectedButton } from "@/core/permissions";

// ✅ بعد (درست)
import { ProtectedButton } from "@/components/admins/permissions";
```

## 🚨 مشکلات پیدا شده

### Permission Import Path اشتباه
**تعداد فایل‌های متأثر:** 23 فایل

این فایل‌ها از مسیر اشتباه `@/core/permissions` استفاده می‌کنن که باید به `@/components/admins/permissions` تغییر کنه:

- ai/models/page.tsx
- ai/chat/page.tsx
- ai/audio/page.tsx
- ai/image/page.tsx
- ai/content/page.tsx
- ai/settings/page.tsx
- panel/page.tsx
- settings/page.tsx
- analytics/page.tsx
- media/page.tsx
- roles/[id]/edit/page.tsx
- roles/[id]/page.tsx
- roles/create/page.tsx
- roles/page.tsx
- blogs/page.tsx
- blogs/tags/page.tsx
- blogs/categories/page.tsx
- portfolios/page.tsx
- portfolios/options/page.tsx
- portfolios/tags/page.tsx
- portfolios/categories/page.tsx
- admins/permissions/page.tsx

## ✅ چیزهایی که حفظ شدن

### Permission System
- ✅ `ProtectedButton` usage
- ✅ `PermissionGate` components
- ✅ `usePermission` hooks
- ✅ PERMISSIONS constants
- ✅ منطق Permission checking
- ✅ استایل‌ها و UI

### مثال Permission که درست کار می‌کنه:
```typescript
<ProtectedButton 
  permission="admin.create"
  showDenyToast
  denyMessage="شما مجوز ایجاد ادمین ندارید"
>
  <Link to="/admins/create">
    افزودن ادمین
  </Link>
</ProtectedButton>
```

## 📝 فایل‌های باقیمانده

### Users (2 فایل)
- [ ] `/pages/users/create/page.tsx`
- [ ] `/pages/users/[id]/edit/page.tsx`

### Roles (4 فایل)
- [ ] `/pages/roles/page.tsx`
- [ ] `/pages/roles/create/page.tsx`
- [ ] `/pages/roles/[id]/page.tsx`
- [ ] `/pages/roles/[id]/edit/page.tsx`

### Blogs (9 فایل)
- [ ] `/pages/blogs/page.tsx`
- [ ] `/pages/blogs/(list)/create/page.tsx`
- [ ] `/pages/blogs/(list)/[id]/edit/page.tsx`
- [ ] `/pages/blogs/(list)/[id]/view/page.tsx`
- [ ] `/pages/blogs/categories/page.tsx`
- [ ] `/pages/blogs/categories/create/page.tsx`
- [ ] `/pages/blogs/categories/[id]/edit/page.tsx`
- [ ] `/pages/blogs/tags/page.tsx`
- [ ] `/pages/blogs/tags/create/page.tsx`
- [ ] `/pages/blogs/tags/[id]/edit/page.tsx`

### Portfolios (12 فایل)
- [ ] `/pages/portfolios/page.tsx`
- [ ] `/pages/portfolios/(list)/create/page.tsx`
- [ ] `/pages/portfolios/(list)/[id]/edit/page.tsx`
- [ ] `/pages/portfolios/(list)/[id]/view/page.tsx`
- [ ] `/pages/portfolios/categories/page.tsx`
- [ ] `/pages/portfolios/categories/create/page.tsx`
- [ ] `/pages/portfolios/categories/[id]/edit/page.tsx`
- [ ] `/pages/portfolios/tags/page.tsx`
- [ ] `/pages/portfolios/tags/create/page.tsx`
- [ ] `/pages/portfolios/tags/[id]/edit/page.tsx`
- [ ] `/pages/portfolios/options/page.tsx`
- [ ] `/pages/portfolios/options/create/page.tsx`
- [ ] `/pages/portfolios/options/[id]/edit/page.tsx`
- [ ] `/pages/portfolios/options/[id]/page.tsx`

### AI (7 فایل)
- [ ] `/pages/ai/models/page.tsx`
- [ ] `/pages/ai/chat/page.tsx`
- [ ] `/pages/ai/audio/page.tsx`
- [ ] `/pages/ai/image/page.tsx`
- [ ] `/pages/ai/content/page.tsx`
- [ ] `/pages/ai/settings/page.tsx`
- [ ] `/pages/ai/ai-unified/page.tsx`

### Other (13 فایل)
- [ ] `/pages/media/page.tsx`
- [ ] `/pages/analytics/page.tsx`
- [ ] `/pages/email/page.tsx`
- [ ] `/pages/ticket/page.tsx`
- [ ] `/pages/chatbot/page.tsx`
- [ ] `/pages/settings/page.tsx`
- [ ] `/pages/panel/page.tsx`
- [ ] `/pages/form-builder/page.tsx`
- [ ] `/pages/page/terms/page.tsx`
- [ ] `/pages/page/about/page.tsx`
- [ ] `/pages/admins/permissions/page.tsx`

## 🎯 اولویت‌های بعدی

1. **تکمیل Users** (2 فایل باقیمانده)
2. **Roles** (4 فایل - مهم برای Permission System)
3. **Media** (1 فایل - پرکاربرد)
4. **Blogs & Portfolios** (21 فایل - بیشترین تعداد)
5. **AI & Other** (20 فایل)

## ⚠️ نکات مهم

1. **Permission System دست نخورده باقی بمونه**
2. **استایل‌ها حفظ بشن**
3. **منطق business تغییر نکنه**
4. **فقط imports و navigation عوض بشه**

---

**آخرین به‌روزرسانی:** الان  
**وضعیت:** در حال پیشرفت 🔄
