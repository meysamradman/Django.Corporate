# 🔄 راهنمای تبدیل Next.js به React + Vite

## تغییرات اصلی که باید انجام بشه:

### 1. ایمپورت‌های Navigation

#### ❌ Next.js (قبل):
```typescript
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
```

#### ✅ React Router (بعد):
```typescript
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { lazy } from "react";
```

### 2. استفاده از Router

#### ❌ Next.js (قبل):
```typescript
const router = useRouter();
router.push("/admins");
router.push(`/admins/${id}/edit`);
```

#### ✅ React Router (بعد):
```typescript
const navigate = useNavigate();
navigate("/admins");
navigate(`/admins/${id}/edit`);
```

### 3. Link Component

#### ❌ Next.js (قبل):
```tsx
<Link href="/admins/create">
  افزودن ادمین
</Link>
```

#### ✅ React Router (بعد):
```tsx
<Link to="/admins/create">
  افزودن ادمین
</Link>
```

### 4. Dynamic Imports

#### ❌ Next.js (قبل):
```typescript
const DataTable = dynamic(
  () => import("@/components/tables/DataTable").then(mod => ({ default: mod.DataTable })),
  { ssr: false }
);
```

#### ✅ React (بعد):
```typescript
const DataTable = lazy(() => import("@/components/tables/DataTable").then(mod => ({ default: mod.DataTable })));
```

### 5. Client Directive

#### ❌ Next.js (قبل):
```typescript
"use client";

import React from "react";
```

#### ✅ React (بعد):
```typescript
import React from "react";
```

## Permission System - بدون تغییر!

### ✅ این‌ها رو نباید تغییر بدیم:

```typescript
// ✅ درست - Permission imports
import { ProtectedButton } from "@/components/admins/permissions";
import { usePermission } from "@/components/admins/permissions";
import { PERMISSIONS } from "@/components/admins/permissions/constants/permissions";

// ✅ درست - Permission usage
<ProtectedButton 
  permission="admin.create"
  showDenyToast
  denyMessage="شما مجوز ایجاد ادمین ندارید"
>
  <Link to="/admins/create">
    افزودن ادمین
  </Link>
</ProtectedButton>

// ✅ درست - Permission hooks
const { hasPermission, ui } = usePermission();
if (hasPermission(PERMISSIONS.BLOG.CREATE)) {
  // ...
}
```

## نمونه کامل تبدیل

### ❌ قبل (Next.js):
```typescript
"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ProtectedButton } from "@/core/permissions";

const DataTable = dynamic(
  () => import("@/components/tables/DataTable"),
  { ssr: false }
);

export default function AdminsPage() {
  const router = useRouter();

  const handleEdit = (id: number) => {
    router.push(`/admins/${id}/edit`);
  };

  return (
    <div>
      <ProtectedButton permission="admin.create">
        <Link href="/admins/create">
          افزودن ادمین
        </Link>
      </ProtectedButton>
      <DataTable />
    </div>
  );
}
```

### ✅ بعد (React + Vite):
```typescript
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { lazy, Suspense } from "react";
import { ProtectedButton } from "@/components/admins/permissions";

const DataTable = lazy(() => import("@/components/tables/DataTable"));

export default function AdminsPage() {
  const navigate = useNavigate();

  const handleEdit = (id: number) => {
    navigate(`/admins/${id}/edit`);
  };

  return (
    <div>
      <ProtectedButton permission="admin.create">
        <Link to="/admins/create">
          افزودن ادمین
        </Link>
      </ProtectedButton>
      <Suspense fallback={<div>Loading...</div>}>
        <DataTable />
      </Suspense>
    </div>
  );
}
```

## چک‌لیست تبدیل

- [ ] حذف `"use client"`
- [ ] تبدیل `useRouter` به `useNavigate`
- [ ] تبدیل `router.push()` به `navigate()`
- [ ] تبدیل `Link href` به `Link to`
- [ ] تبدیل `dynamic()` به `lazy()`
- [ ] اضافه کردن `Suspense` برای lazy components
- [ ] **حفظ** تمام Permission imports و usage
- [ ] **حفظ** تمام استایل‌ها
- [ ] **حفظ** منطق Permission

## ⚠️ نکات مهم

1. **Permission System رو دست نزن!** همه چیز درست کار می‌کنه
2. **استایل‌ها رو حفظ کن** - فقط imports رو تغییر بده
3. **منطق Permission رو تغییر نده** - دقیقاً مثل Next.js باید باشه
4. **ProtectedButton** و **PermissionGate** رو دست نزن
5. **PERMISSIONS constants** رو تغییر نده

## فایل‌هایی که باید تبدیل بشن

تمام فایل‌های `page.tsx` در پوشه `src/pages/` که از Next.js استفاده می‌کنن.

تعداد: **46 فایل**

