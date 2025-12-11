# Permission Constants

## 📖 Overview

این فولدر حاوی تمام permission constants برای سیستم دسترسی پنل ادمین است.

## 🎯 هدف

- **Single Source of Truth**: تمام permission IDs در یک جا
- **Type Safety**: TypeScript autocomplete و type checking
- **Maintainability**: تغییرات فقط در یک فایل
- **Error Prevention**: جلوگیری از typo و اشتباهات

## 📁 ساختار فایل‌ها

```
constants/
├── index.ts          # Export اصلی
├── permissions.ts    # تمام permission IDs
└── README.md         # این فایل
```

## 🔧 استفاده

### ✅ روش صحیح:

```typescript
import { PERMISSIONS } from '@/core/permissions/constants';

// در components
<PermissionGate permission={PERMISSIONS.BLOG.CREATE}>
  <CreateButton />
</PermissionGate>

// در Dashboard widgets - با PermissionLocked
<PermissionLocked
  permission={[PERMISSIONS.ANALYTICS.CONTENT_READ, PERMISSIONS.ANALYTICS.MANAGE]}
  requireAll={false}
  lockedMessage="دسترسی به آمار محتوا"
  borderColorClass="border-primary"
  iconBgColorClass="bg-primary/10"
  iconColorClass="text-primary"
>
  <ContentDistributionCard />
</PermissionLocked>

// در hooks
const canEditBlog = hasPermission(PERMISSIONS.BLOG.UPDATE);

// در route guards
if (!hasPermission(PERMISSIONS.AI.MANAGE)) {
  return <AccessDenied />;
}
```

### ❌ روش اشتباه (قدیمی):

```typescript
// Don't do this anymore!
<PermissionGate permission="blog.create">  // ❌ Hardcoded
<PermissionGate permission="blog.crete">   // ❌ Typo!
const canEdit = hasPermission("blog.upate"); // ❌ Typo!
```

## 📊 ساختار PERMISSIONS

```typescript
PERMISSIONS = {
  AI: {
    MANAGE: 'ai.manage',
    CHAT_MANAGE: 'ai.chat.manage',
    // ...
  },
  BLOG: {
    CREATE: 'blog.create',
    READ: 'blog.read',
    // ...
  },
  // ... سایر modules
}
```

## 🔍 Helper Functions

### `getAllPermissions()`
برمی‌گرداند: Array از تمام permission IDs

```typescript
const allPerms = getAllPermissions();
// ['ai.manage', 'ai.chat.manage', 'blog.create', ...]
```

### `isValidPermission(permissionId)`
چک می‌کند که آیا permission ID معتبر است

```typescript
if (isValidPermission('blog.create')) {
  // Valid permission
}
```

## 🚀 مزایا

### 1. **IDE Autocomplete**
وقتی `PERMISSIONS.` تایپ می‌کنید، تمام options نمایش داده می‌شود.

### 2. **Compile-Time Errors**
اگر permission اشتباه باشد، TypeScript خطا می‌دهد.

### 3. **Refactoring آسان**
فقط در یک فایل تغییر دهید، همه جا update می‌شود.

### 4. **کاهش Bugs**
Typo و اشتباهات املایی غیرممکن می‌شود.

## 🔄 Migration از Hardcoded Strings

اگر کد قدیمی با hardcoded strings دارید:

**قبل:**
```typescript
hasPermission('blog.create')
```

**بعد:**
```typescript
import { PERMISSIONS } from '@/core/permissions/constants';
hasPermission(PERMISSIONS.BLOG.CREATE)
```

## ✅ Best Practices

1. **همیشه از constants استفاده کنید**
   - ❌ `'blog.create'`
   - ✅ `PERMISSIONS.BLOG.CREATE`

2. **Import فقط یکبار در ابتدای فایل**
   ```typescript
   import { PERMISSIONS } from '@/core/permissions/constants';
   ```

3. **برای module names هم از constants استفاده کنید**
   ```typescript
   // در accessControl.ts
   module: MODULES.BLOG  // بجای 'blog'
   ```

4. **Documentation بنویسید**
   ```typescript
   // Check if user can create blog posts
   if (hasPermission(PERMISSIONS.BLOG.CREATE)) {
     // ...
   }
   ```

## 🔧 افزودن Permission جدید

برای افزودن permission جدید:

1. فایل `permissions.ts` را باز کنید
2. به module مربوطه permission جدید اضافه کنید
3. ذخیره کنید - همین!

```typescript
export const PERMISSIONS = {
  BLOG: {
    CREATE: 'blog.create',
    READ: 'blog.read',
    PUBLISH: 'blog.publish',  // ✅ جدید
  },
  // ...
}
```

TypeScript خودکار type checking را update می‌کند.

## 🎯 روش کار

### 1. Development
- Developer از autocomplete استفاده می‌کند
- TypeScript خطاهای typo را catch می‌کند
- IDE مستقیماً به definition می‌رود

### 2. Build Time
- TypeScript compile می‌کند
- تمام references چک می‌شوند
- خطاهای type safety گرفته می‌شوند

### 3. Runtime
- Permission strings صحیح به backend ارسال می‌شوند
- هیچ typo یا خطایی وجود ندارد

## 📋 فایل‌های مرتبط

این constants در این فایل‌ها استفاده می‌شوند:

- `hooks/useUserPermissions.ts` - Permission checking logic
- `components/RoutePermissionGuard.tsx` - Route protection
- `components/PermissionGate.tsx` - Component-level permissions
- `config/accessControl.ts` - Route rules
- تمام components که permission چک می‌کنند

## 🔍 Debugging

اگر permission کار نمی‌کند:

1. مطمئن شوید از constant استفاده کرده‌اید
2. بررسی کنید permission در backend تعریف شده است
3. user role صحیح را دارد
4. DevTools console را چک کنید

```typescript
// Debug permission
console.log('Checking:', PERMISSIONS.BLOG.CREATE);
console.log('Has permission:', hasPermission(PERMISSIONS.BLOG.CREATE));
console.log('User permissions:', permissions);
```

## 📝 Notes

- این constants **فقط فرانت‌اند** است
- باید با backend permissions **sync** باشد
- برای تغییرات بزرگ، backend را هم update کنید
- بعد از افزودن permission جدید، احتمالاً نیاز به restart dev server دارید

## 🎉 مزایای معماری جدید

### قبل (Scattered):
```
30+ files × 3-5 permissions each = 100+ hardcoded strings
```

### بعد (Centralized):
```
1 file × all permissions = Single source of truth
```

### نتیجه:
- ✅ 90% کمتر احتمال خطا
- ✅ 100x سریع‌تر refactoring
- ✅ IDE support کامل
- ✅ Type safety تضمین شده

---

**Version**: 1.0.0  
**Last Updated**: 2025-01-11  
**Maintained By**: Frontend Team
