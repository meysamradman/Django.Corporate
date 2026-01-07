# معماری فرم‌ها و Validation در پنل ادمین

## 📁 ساختار فایل‌ها

### 1. Validation Schema (قوانین اعتبارسنجی)
**مسیر:** `src/components/{module}/validations/{entity}Schema.ts`

**مثال:**
- `src/components/real-estate/validations/typeSchema.ts`
- `src/components/portfolios/validations/portfolioSchema.ts`

**مسئولیت:**
- تعریف قوانین validation با Zod
- تعریف type ها و default values
- پیام‌های خطا

**ساختار:**
```typescript
import { z } from "zod";
import { msg } from "@/core/messages";

export const entityFormSchema = z.object({
  title: z.string()
    .min(1, { message: msg.blog("tagNameRequired") }) // ✅ از msg استفاده کنید
    .min(2, { message: msg.blog("tagNameMinLength") }),
  slug: z.string()
    .min(1, { message: msg.blog("tagSlugRequired") }),
  // ...
});

export type EntityFormValues = z.infer<typeof entityFormSchema>;

// ✅ بهتر: همه فیلدها را تعریف کنید (نه Partial)
export const entityFormDefaults: EntityFormValues = {
  title: "",
  slug: "",
  // همه فیلدهای required
} as EntityFormValues;
```

**⚠️ مهم:** همیشه از `msg` برای validation messages استفاده کنید:
- `msg.blog()` برای وبلاگ
- `msg.realEstate()` برای املاک
- `msg.portfolio()` برای نمونه‌کار
- `msg.validation()` برای validation عمومی

---

### 2. Form Component (کامپوننت فرم)
**مسیر:** `src/components/{module}/list/create/{TabName}Tab.tsx`

**مثال:**
- `src/components/real-estate/list/create/BaseInfoTab.tsx`
- `src/components/portfolios/list/create/BaseInfoTab.tsx`

**مسئولیت:**
- نمایش UI فرم
- استفاده از `FormFieldInput`, `FormFieldTextarea`
- نمایش خطاها از `errors.field?.message`

**ساختار:**
```typescript
import { FormFieldInput, FormFieldTextarea } from "@/components/forms/FormField";
import type { UseFormReturn } from "react-hook-form";

interface TabProps {
  form: UseFormReturn<FormValues>;
  errors?: Record<string, string>; // برای حالت useState
}

export default function BaseInfoTab({ form, errors }: TabProps) {
  const { register, formState: { errors: formErrors } } = form;
  
  return (
    <FormFieldInput
      label="عنوان"
      id="title"
      required
      error={formErrors.title?.message || errors?.title}
      {...register("title")}
    />
  );
}
```

---

### 3. Page Component (صفحه اصلی)
**مسیر:** `src/pages/{module}/{entity}/create/page.tsx`

**مثال:**
- `src/pages/real-estate/types/create/page.tsx`
- `src/pages/portfolios/(list)/create/page.tsx`

**مسئولیت:**
- مدیریت state با `react-hook-form`
- اتصال validation schema با `zodResolver`
- مدیریت mutation و error handling
- ارسال داده به API

**ساختار:**
```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { entityFormSchema, entityFormDefaults, type EntityFormValues } from '@/components/{module}/validations/{entity}Schema';
import { extractFieldErrors, hasFieldErrors } from "@/core/toast";

export default function CreateEntityPage() {
  // ✅ بهتر: بدون as any (اگر entityFormDefaults کامل باشد)
  const form = useForm<EntityFormValues>({
    resolver: zodResolver(entityFormSchema),
    defaultValues: entityFormDefaults,
    mode: "onSubmit",
  });

  const { register, formState: { errors, isSubmitting }, watch, setValue } = form;

  const mutation = useMutation({
    mutationFn: (data) => api.create(data),
    onSuccess: () => {
      // ✅ Success message از msg.crud یا مستقیم
      showSuccess(msg.crud("created", { item: "نوع ملک" }));
      // یا: showSuccess("نوع ملک با موفقیت ایجاد شد");
    },
    onError: (error) => {
      if (hasFieldErrors(error)) {
        const fieldErrors = extractFieldErrors(error);
        Object.entries(fieldErrors).forEach(([field, message]) => {
          form.setError(field as keyof EntityFormValues, {
            type: 'server',
            message: message as string
          });
        });
        
        // Toast کلی
        showError(error, { customMessage: "لطفاً خطاهای فرم را بررسی کنید" });
      } else {
        // General error - خودش تصمیم می‌گیرد (بک‌اند یا frontend)
        showError(error);
      }
    },
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    mutation.mutate(data);
  });

  return (
    <form onSubmit={handleSubmit}>
      <BaseInfoTab form={form} />
      <Button
        type="submit"
        disabled={mutation.isPending || isSubmitting}
      >
        {mutation.isPending || isSubmitting ? (
          <><Loader2 className="animate-spin" /> در حال ذخیره...</>
        ) : (
          <><Save /> ذخیره</>
        )}
      </Button>
    </form>
  );
}
```

---

### 4. Edit Mode (حالت ویرایش)
**مسیر:** `src/pages/{module}/{entity}/[id]/edit/page.tsx`

**مسئولیت:**
- بارگذاری داده موجود
- پر کردن فرم با `form.reset()`
- استفاده از همان validation schema

**ساختار:**
```typescript
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

export default function EditEntityPage({ id }: { id: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['entity', id],
    queryFn: () => api.getById(id),
  });

  const form = useForm<EntityFormValues>({
    resolver: zodResolver(entityFormSchema),
    defaultValues: entityFormDefaults,
  });

  // ✅ پر کردن فرم با داده موجود
  useEffect(() => {
    if (data) {
      form.reset({
        title: data.title,
        slug: data.slug,
        // ... سایر فیلدها
      });
    }
  }, [data, form]);

  const mutation = useMutation({
    mutationFn: (data) => api.update(id, data),
    // ...
  });

  // ...
}
```

---

## ✅ قوانین استفاده

### 1. همیشه از `react-hook-form` استفاده کنید
```typescript
// ✅ درست
const form = useForm({
  resolver: zodResolver(schema),
  defaultValues: defaults,
});

// ❌ اشتباه
const [formData, setFormData] = useState({});
```

### 2. همیشه از `FormFieldInput` و `FormFieldTextarea` استفاده کنید
```typescript
// ✅ درست
<FormFieldInput
  label="عنوان"
  id="title"
  error={errors.title?.message}
  {...register("title")}
/>

// ❌ اشتباه
<Input value={formData.title} onChange={...} />
```

### 3. خطاها را از `formState.errors` بگیرید
```typescript
// ✅ درست
const { formState: { errors } } = form;
error={errors.title?.message}

// ❌ اشتباه
const [errors, setErrors] = useState({});
```

### 4. Validation Schema را در فایل جداگانه قرار دهید
```typescript
// ✅ درست
// validations/typeSchema.ts
export const typeFormSchema = z.object({...});

// ❌ اشتباه
// page.tsx
const schema = z.object({...}); // داخل page
```

### 5. خطاهای سرور را با `extractFieldErrors` مدیریت کنید
```typescript
// ✅ درست
if (hasFieldErrors(error)) {
  const fieldErrors = extractFieldErrors(error);
  Object.entries(fieldErrors).forEach(([field, message]) => {
    form.setError(field as keyof EntityFormValues, {
      type: 'server',
      message: message as string
    });
  });
}
```

### 6. از `as any` استفاده نکنید
```typescript
// ❌ اشتباه
resolver: zodResolver(schema) as any,
defaultValues: defaults as any,

// ✅ درست - اگر entityFormDefaults کامل باشد
resolver: zodResolver(schema),
defaultValues: defaults,
```

### 7. Loading States را مدیریت کنید
```typescript
// ✅ درست
const { formState: { isSubmitting } } = form;

<Button
  type="submit"
  disabled={mutation.isPending || isSubmitting}
>
  {mutation.isPending || isSubmitting ? (
    <><Loader2 className="animate-spin" /> در حال ذخیره...</>
  ) : (
    <><Save /> ذخیره</>
  )}
</Button>
```

---

## 🚀 پیشنهادات پیشرفته (اختیاری)

### 1. Custom Hook برای منطق مشترک
**مسیر:** `src/hooks/useEntityForm.ts`

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback } from "react";
import { entityFormSchema, entityFormDefaults, type EntityFormValues } from '@/components/{module}/validations/{entity}Schema';
import { extractFieldErrors, hasFieldErrors } from "@/core/toast";

export function useEntityForm(defaultValues?: Partial<EntityFormValues>) {
  const form = useForm<EntityFormValues>({
    resolver: zodResolver(entityFormSchema),
    defaultValues: { ...entityFormDefaults, ...defaultValues },
    mode: "onSubmit",
  });

  const handleServerErrors = useCallback((error: any) => {
    if (hasFieldErrors(error)) {
      const fieldErrors = extractFieldErrors(error);
      Object.entries(fieldErrors).forEach(([field, message]) => {
        form.setError(field as keyof EntityFormValues, {
          type: 'server',
          message: message as string
        });
      });
    }
  }, [form]);

  return { form, handleServerErrors };
}

// استفاده:
const { form, handleServerErrors } = useEntityForm();
```

### 2. Context برای جلوگیری از Prop Drilling
**مسیر:** `src/contexts/FormContext.tsx`

```typescript
import { createContext, useContext } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { EntityFormValues } from '@/components/{module}/validations/{entity}Schema';

const FormContext = createContext<UseFormReturn<EntityFormValues> | null>(null);

export function FormProvider({ form, children }: { 
  form: UseFormReturn<EntityFormValues>;
  children: React.ReactNode;
}) {
  return <FormContext.Provider value={form}>{children}</FormContext.Provider>;
}

export function useFormContext() {
  const context = useContext(FormContext);
  if (!context) throw new Error("useFormContext must be used within FormProvider");
  return context;
}

// استفاده در Page:
<FormProvider form={form}>
  <BaseInfoTab />
  <DetailsTab />
</FormProvider>

// استفاده در Tab:
const form = useFormContext(); // بدون prop drilling
```

### 3. Dirty State Tracking (هشدار قبل از خروج)
```typescript
import { useEffect } from "react";

export default function CreateEntityPage() {
  const form = useForm<EntityFormValues>({...});
  const { formState: { isDirty } } = form;

  // ✅ هشدار قبل از خروج اگر فرم تغییر کرده
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // ...
}
```

### 4. Optimistic Updates
```typescript
const mutation = useMutation({
  mutationFn: (data) => api.create(data),
  onMutate: async (newData) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['entities'] });
    
    // Snapshot previous value
    const previousEntities = queryClient.getQueryData(['entities']);
    
    // Optimistically update
    queryClient.setQueryData(['entities'], (old: any) => [...old, newData]);
    
    return { previousEntities };
  },
  onError: (err, newData, context) => {
    // Rollback on error
    queryClient.setQueryData(['entities'], context?.previousEntities);
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['entities'] });
  },
});
```

---

## 🔄 جریان داده

```
1. User Input
   ↓
2. react-hook-form (مدیریت state)
   ↓
3. Zod Validation (بررسی قوانین)
   ↓
4. نمایش خطا در FormFieldInput
   ↓
5. Submit → API
   ↓
6. خطای سرور → form.setError()
```

---

## 📝 چک‌لیست ایجاد فرم جدید

### Create Mode
- [ ] ایجاد Validation Schema در `validations/{entity}Schema.ts`
- [ ] تعریف `FormValues` type و `defaultValues` (بدون Partial)
- [ ] ایجاد Form Component در `list/create/{Tab}Tab.tsx`
- [ ] استفاده از `FormFieldInput` با `error={errors.field?.message}`
- [ ] ایجاد Page Component با `react-hook-form`
- [ ] اتصال schema با `zodResolver` (بدون `as any`)
- [ ] مدیریت خطاهای سرور با `extractFieldErrors` و `hasFieldErrors`
- [ ] **مهم:** Validation errors فقط Inline (بدون Toast)
- [ ] **مهم:** Server field errors = Inline + Toast کلی
- [ ] **مهم:** General errors = فقط Toast
- [ ] اضافه کردن Loading States
- [ ] تست validation و نمایش خطاها

### Edit Mode (اگر نیاز است)
- [ ] ایجاد Edit Page در `[id]/edit/page.tsx`
- [ ] استفاده از `useQuery` برای بارگذاری داده
- [ ] استفاده از `form.reset()` برای پر کردن فرم
- [ ] استفاده از `useMutation` برای update
- [ ] تست ویرایش و validation

---

## 🎯 مثال کامل

### Validation Schema
```typescript
// components/real-estate/validations/typeSchema.ts
import { msg } from "@/core/messages";

export const propertyTypeFormSchema = z.object({
  title: z.string()
    .min(1, { message: msg.realEstate().validation.typeTitleRequired })
    .min(3, { message: msg.realEstate().validation.typeTitleMinLength }),
  slug: z.string()
    .min(1, { message: msg.realEstate().validation.slugRequired }),
});
```

### Form Component
```typescript
// components/real-estate/list/create/BaseInfoTab.tsx
<FormFieldInput
  label="عنوان"
  error={errors.title?.message}
  {...register("title")}
/>
```

### Page Component
```typescript
// pages/real-estate/types/create/page.tsx
const form = useForm({
  resolver: zodResolver(propertyTypeFormSchema),
  defaultValues: propertyTypeFormDefaults,
});
```

---

## 📊 استراتژی Toast vs Inline Error

### جدول تصمیم‌گیری

| نوع خطا | Inline Error | Toast | مثال |
|---------|--------------|-------|------|
| **Validation Errors (فرم)** | ✅ اصلی | ❌ اضافه | "عنوان الزامی است" |
| **Server Field Errors (422/400)** | ✅ اصلی | ✅ کلی | "لطفاً خطاهای فرم را بررسی کنید" |
| **General Errors (network, 500)** | ❌ | ✅ ضروری | "خطا در ارتباط با سرور" |
| **Success Messages** | ❌ | ✅ ضروری | "با موفقیت ذخیره شد" |
| **Permission Errors** | ❌ | ✅ ضروری | "شما دسترسی ندارید" |

### ✅ استراتژی پیشنهادی

#### 1️⃣ Validation Errors → فقط Inline
```typescript
// ✅ درست - فقط قرمز کردن input
<FormFieldInput
  label="عنوان"
  error={errors.title?.message} // ← همین کافیه
  {...register("title")}
/>

// ❌ اشتباه - Toast اضافی برای validation
onSubmit: (data) => {
  if (!data.title) {
    showError("عنوان الزامی است"); // ← غیر ضروری و آزاردهنده
  }
}
```

**چرا؟**
- کاربر می‌تونه خطا رو کنار input ببینه
- Context واضح‌تره (می‌دونه کدوم فیلد مشکل داره)
- Toast برای validation آزاردهنده و spam است

#### 2️⃣ Submit Success → حتماً Toast
```typescript
// ✅ درست
onSuccess: () => {
  showSuccess("نوع ملک با موفقیت ایجاد شد"); // ← این ضروریه
  navigate("/real-estate/types");
}
```

**چرا؟**
- کاربر باید بازخورد واضح بگیره
- معمولاً redirect می‌شه، پس inline message نمی‌بینه

#### 3️⃣ Server Errors → هر دو!

**الف) خطای فیلد خاص → Inline + Toast کلی**
```typescript
// ✅ درست
onError: (error: any) => {
  if (hasFieldErrors(error)) {
    // 1️⃣ خطاهای فیلد → Inline
    const fieldErrors = extractFieldErrors(error);
    Object.entries(fieldErrors).forEach(([field, message]) => {
      form.setError(field as keyof EntityFormValues, {
        type: 'server',
        message: message as string
      });
    });
    
    // 2️⃣ پیام کلی → Toast
    showError(error, { customMessage: "لطفاً خطاهای فرم را بررسی کنید" });
  }
}
```

**ب) خطای کلی (بدون فیلد مشخص) → فقط Toast**
```typescript
// ✅ درست
onError: (error: any) => {
  if (!hasFieldErrors(error)) {
    // خطاهای کلی: network، permission، 500، etc
    const errorMessage = error?.response?.data?.message || 
                        error?.response?.data?.metaData?.message || 
                        "خطا در ایجاد نوع ملک";
    showError(errorMessage);
  }
}
```

#### 4️⃣ Network/System Errors → Toast
```typescript
// ✅ درست - خطاهای سیستمی
catch (error) {
  showError("خطا در برقراری ارتباط با سرور");
}
```

### 🎯 مثال کامل (Best Practice)

```typescript
const createTypeMutation = useMutation({
  mutationFn: (data) => realEstateApi.createType(data),
  
  onSuccess: () => {
    // ✅ SUCCESS → Toast
    showSuccess("نوع ملک با موفقیت ایجاد شد");
    queryClient.invalidateQueries({ queryKey: ['property-types'] });
    navigate("/real-estate/types");
  },
  
  onError: (error: any) => {
    // ✅ FIELD ERRORS → Inline + Toast کلی
    if (hasFieldErrors(error)) {
      const fieldErrors = extractFieldErrors(error);
      
      Object.entries(fieldErrors).forEach(([field, message]) => {
        form.setError(field as keyof EntityFormValues, {
          type: 'server',
          message: message as string
        });
      });
      
      // پیام کلی برای راهنمایی کاربر
      showError(error, { customMessage: "لطفاً خطاهای فرم را بررسی کنید" });
    } 
    // ✅ GENERAL ERRORS → فقط Toast
    else {
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data?.metaData?.message || 
                          "خطا در ایجاد نوع ملک";
      showError(errorMessage);
    }
  },
});
```

### 📋 جدول تصمیم‌گیری سریع

| وضعیت | Inline Error | Toast | مثال |
|-------|--------------|-------|------|
| فیلد خالیه | ✅ | ❌ | "عنوان الزامی است" |
| فرمت ایمیل اشتباه | ✅ | ❌ | "ایمیل معتبر نیست" |
| چند فیلد خطا داره | ✅ | ✅ (کلی) | "لطفاً خطاها را بررسی کنید" |
| Unique constraint | ✅ | ✅ (کلی) | "این نامک قبلاً استفاده شده" |
| Network error | ❌ | ✅ | "خطا در ارتباط با سرور" |
| Permission denied | ❌ | ✅ | "شما دسترسی ندارید" |
| ذخیره موفق | ❌ | ✅ | "با موفقیت ذخیره شد" |
| 500 Internal Error | ❌ | ✅ | "خطای سرور" |

### 💡 نکات اضافی

#### 1️⃣ Auto-scroll به اولین خطا (اختیاری)
```typescript
onError: (error) => {
  if (hasFieldErrors(error)) {
    // تنظیم خطاها
    setFieldErrors(error);
    
    // scroll به اولین فیلد با خطا
    setTimeout(() => {
      const firstError = document.querySelector('[aria-invalid="true"]');
      firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }
}
```

#### 2️⃣ Toast duration براساس اهمیت
```typescript
showError("خطای شبکه", { duration: 5000 }); // طولانی‌تر
showSuccess("ذخیره شد", { duration: 2000 }); // کوتاه‌تر
```

#### 3️⃣ استفاده از `showToast: false` برای جلوگیری از Toast
```typescript
// اگر فقط می‌خواهید خطا را استخراج کنید بدون نمایش Toast
const errorMessage = showError(error, { showToast: false });
```

### ⚠️ مشکلات Toast زیاد

```typescript
// ❌ اشتباه - Toast برای هر فیلد
onSubmit: (data) => {
  if (!data.title) showError("عنوان الزامی است");
  if (!data.slug) showError("نامک الزامی است");
  if (!data.description) showError("توضیحات الزامی است");
  // کاربر با 3 تا Toast spam می‌شه! 😡
}

// ✅ درست - فقط inline errors
// react-hook-form خودش validation می‌کنه و خطاها inline نمایش داده می‌شن
```

### 🎯 خلاصه استراتژی

```
📝 Validation Errors (فرم)
   └── ✅ Inline Error (قرمز + پیام)
   └── ❌ Toast (آزاردهنده است)

✅ Success
   └── ✅ Toast (ضروری)

❌ General Errors (network, permission, 500)
   └── ✅ Toast (ضروری)

⚠️ Server Field Errors (422/400)
   └── ✅ Inline Error (برای هر فیلد)
   └── ✅ Toast کلی (راهنمایی کاربر)
```

**نکته مهم:** 
- `extractFieldErrors` و `hasFieldErrors` از `@/core/toast` برای تشخیص خطاهای فیلد استفاده می‌کنند (status 422 یا 400)
- این توابع خطاهای سرور را از `error.response._data` استخراج می‌کنند
- برای جلوگیری از Toast می‌توانید از `showError(error, { showToast: false })` استفاده کنید

---

## 📝 منبع پیام‌ها (Messages Source)

### ⚠️ مهم: همه پیام‌ها از بک‌اند نمی‌آیند!

#### 1️⃣ Validation Messages → Frontend (محلی)
```typescript
// ✅ درست - از msg استفاده کنید
import { msg } from "@/core/messages";

export const blogTagFormSchema = z.object({
  name: z.string()
    .min(1, { message: msg.blog("tagNameRequired") })
    .min(2, { message: msg.blog("tagNameMinLength") }),
  slug: z.string()
    .min(1, { message: msg.blog("tagSlugRequired") }),
});
```

**منابع:**
- `msg.blog()` → `@/core/messages/modules/blog.ts`
- `msg.realEstate()` → `@/core/messages/modules/real_estate.ts`
- `msg.validation()` → `@/core/messages/validation.ts`
- `msg.portfolio()` → `@/core/messages/modules/portfolio.ts`

**این پیام‌ها در frontend تعریف شده‌اند و از بک‌اند نمی‌آیند!**

#### 2️⃣ Success Messages → Frontend (محلی)
```typescript
// ✅ درست - از msg.crud استفاده کنید
import { msg } from "@/core/messages";

onSuccess: () => {
  showSuccess(msg.crud("created", { item: "تگ" }));
  // یا
  showSuccess("تگ با موفقیت ایجاد شد"); // مستقیم
}
```

**منابع:**
- `msg.crud()` → `@/core/messages/ui.ts`
- پیام‌های CRUD: `created`, `updated`, `deleted`, `saved`, `activated`, `deactivated`

#### 3️⃣ Error Messages → ترکیبی (Frontend + Backend)

**الف) Field Errors (422/400) → Backend**
```typescript
// خطاهای فیلد از error.response._data می‌آیند (از بک‌اند)
if (hasFieldErrors(error)) {
  const fieldErrors = extractFieldErrors(error);
  // fieldErrors از error.response._data استخراج می‌شود
}
```

**ب) General Error Messages → ترکیبی**
```typescript
// در showError:
// 1. اگر customMessage باشد → از آن استفاده می‌شود
// 2. اگر status 422 یا 409 باشد و error.response.message وجود داشته باشد → از بک‌اند
// 3. در غیر این صورت → از HTTP_ERROR_MESSAGES (frontend)

showError(error, { customMessage: "پیام سفارشی" });
// یا
showError(error); // خودش تصمیم می‌گیرد
```

**منابع Frontend:**
- `HTTP_ERROR_MESSAGES` → `@/core/messages/errors.ts`
- برای status code های: 400, 401, 403, 404, 408, 409, 422, 429, 500, 502, 503, 504

**منابع Backend:**
- `error.response.message` → فقط برای status 422 و 409
- `error.response._data` → برای field errors (422/400)

#### 4️⃣ خلاصه منبع پیام‌ها

| نوع پیام | منبع | مثال |
|---------|------|------|
| **Validation** | Frontend | `msg.blog("tagNameRequired")` |
| **Success** | Frontend | `msg.crud("created", { item: "تگ" })` |
| **Field Errors** | Backend | `error.response._data` |
| **General Errors (422/409)** | Backend (اگر باشد) | `error.response.message` |
| **General Errors (سایر)** | Frontend | `HTTP_ERROR_MESSAGES[500]` |

### 📋 مثال کامل استفاده

```typescript
// 1. Validation Schema - از msg استفاده کنید
export const blogTagFormSchema = z.object({
  name: z.string()
    .min(1, { message: msg.blog("tagNameRequired") })
    .min(2, { message: msg.blog("tagNameMinLength") }),
});

// 2. Success - از msg.crud استفاده کنید
onSuccess: () => {
  showSuccess(msg.crud("created", { item: "تگ" }));
  // یا مستقیم:
  showSuccess("تگ با موفقیت ایجاد شد");
}

// 3. Error Handling
onError: (error: any) => {
  if (hasFieldErrors(error)) {
    // Field errors از بک‌اند می‌آیند
    const fieldErrors = extractFieldErrors(error);
    // ...
    
    // Toast کلی - می‌توانید customMessage بدهید
    showError(error, { customMessage: "لطفاً خطاهای فرم را بررسی کنید" });
  } else {
    // General error - خودش تصمیم می‌گیرد (بک‌اند یا frontend)
    showError(error);
  }
}
```

### ⚠️ نکات مهم

1. **Validation messages همیشه از frontend می‌آیند** - از `msg.blog()`, `msg.realEstate()` و غیره استفاده کنید
2. **Success messages همیشه از frontend می‌آیند** - از `msg.crud()` استفاده کنید
3. **Field errors از بک‌اند می‌آیند** - از `extractFieldErrors()` استفاده کنید
4. **General errors ترکیبی هستند** - `showError()` خودش تصمیم می‌گیرد
5. **برای 422/409**: اگر `error.response.message` باشد، از بک‌اند استفاده می‌شود
6. **برای سایر status codes**: از `HTTP_ERROR_MESSAGES` (frontend) استفاده می‌شود

---

## ⚠️ رفع خطای TypeScript در zodResolver

### مشکل: `Type 'Resolver<...>' is not assignable`

**علت:**
- عدم تطابق type های schema و defaultValues
- استفاده نادرست از `.optional().or(z.literal(""))`
- ترکیب نادرست `.default()` و `.optional()`

**راه حل:**

#### 1️⃣ برای فیلدهای با default: فقط `.default()`
```typescript
selectedTags: z.array(z.any()).default([]),
is_active: z.boolean().default(true),
status: z.enum(["draft", "published"]).default("draft"),
extra_attributes: z.record(z.string(), z.any()).default({}),
```

#### 2️⃣ برای فیلدهای optional: فقط `.optional()`
```typescript
description: z.string().optional(),
meta_title: z.string().max(70).optional(),
```

#### 3️⃣ برای nullable: `.nullable().optional()`
```typescript
featuredImage: z.any().nullable().optional(),
og_image: z.any().nullable().optional(),
```

#### 4️⃣ برای string های خالی: فقط `.optional()` (بدون `.or(z.literal(""))`)
```typescript
// ❌ اشتباه - باعث پیچیدگی type می‌شود
short_description: z.string()
  .max(300)
  .optional()
  .or(z.literal("")),

// ✅ درست - ساده و واضح
short_description: z.string()
  .max(300)
  .optional(),
```

**استثنا:** فقط برای URL ها می‌توانید از `.optional().or(z.literal(""))` استفاده کنید:
```typescript
canonical_url: z.string()
  .url({ message: msg.validation("urlInvalid") })
  .optional()
  .or(z.literal("")),  // ← فقط برای URL ها این OK است
```

#### 5️⃣ استفاده صحیح از defaults:
```typescript
export const entityFormDefaults: Partial<EntityFormValues> = {
  name: "",
  selectedTags: [],  // مطابق با .default([])
  is_active: true,   // مطابق با .default(true)
  description: "",    // optional، پس می‌تواند "" باشد
};
```

#### 6️⃣ بدون `as any`:
```typescript
// ✅ درست
const form = useForm<EntityFormValues>({
  resolver: zodResolver(entityFormSchema),
  defaultValues: entityFormDefaults,
});

// ❌ اشتباه
const form = useForm<EntityFormValues>({
  resolver: zodResolver(entityFormSchema) as any,
  defaultValues: entityFormDefaults as any,
});
```

#### 📋 قاعده کلی:
| حالت | استفاده | مثال |
|------|---------|------|
| Required با مقدار خاص | `.default(value)` | `is_active: z.boolean().default(true)` |
| Optional (می‌تواند undefined باشد) | `.optional()` | `description: z.string().optional()` |
| Nullable (می‌تواند null باشد) | `.nullable()` | `featuredImage: z.any().nullable()` |
| Nullable + Optional | `.nullable().optional()` | `og_image: z.any().nullable().optional()` |
| Array خالی | `.default([])` | `selectedTags: z.array(z.any()).default([])` |
| String خالی | `.optional()` | `meta_title: z.string().optional()` |
| URL خالی | `.optional().or(z.literal(""))` | `canonical_url: z.string().url().optional().or(z.literal(""))` |

#### 🎯 مثال کامل:
```typescript
export const schema = z.object({
  name: z.string().min(1),              // required
  description: z.string().optional(),    // optional
  tags: z.array(z.any()).default([]),   // با default
  image: z.any().nullable().optional(),  // nullable + optional
  is_active: z.boolean().default(true), // با default
});

export type EntityFormValues = z.infer<typeof schema>;

export const defaults: Partial<EntityFormValues> = {
  name: "",
  description: "",
  tags: [],
  image: null,
  is_active: true,
};
```

#### ⚠️ چیزهایی که باید اجتناب کنید:

**❌ اشتباه 1: ترکیب `.optional()` و `.or(z.literal(""))` برای string های معمولی**
```typescript
// ❌ اشتباه - باعث پیچیدگی type می‌شود
short_description: z.string()
  .max(300)
  .optional()
  .or(z.literal("")),

// ✅ درست
short_description: z.string()
  .max(300)
  .optional(),
```

**❌ اشتباه 2: استفاده از `as any` در defaults**
```typescript
// ❌ اشتباه
export const blogFormDefaults = {
  name: "",
  // ...
} as any;

// ✅ درست
export const blogFormDefaults: Partial<BlogFormValues> = {
  name: "",
  // ...
};
```

**❌ اشتباه 3: ترکیب `.default()` و `.optional()`**
```typescript
// ❌ اشتباه
is_active: z.boolean().default(true).optional(),

// ✅ درست
is_active: z.boolean().default(true),
```

**❌ اشتباه 4: ترتیب نادرست `.optional()` و `.default()`**
```typescript
// ❌ اشتباه
extra_attributes: z.record(z.string(), z.any()).optional().default({}),

// ✅ درست
extra_attributes: z.record(z.string(), z.any()).default({}),
```

#### 🎯 چک‌لیست برای جلوگیری از مشکل:
- [ ] فیلدهای با `.default()` در defaults هم مقدار دارند
- [ ] فیلدهای `.optional()` در defaults می‌توانند undefined یا "" باشند
- [ ] از `.optional().or(z.literal(""))` فقط برای URL استفاده شده
- [ ] `defaultValues` از type `FormValues` است (نه `Partial<FormValues>` و نه `as any`)
- [ ] `resolver` بدون `as any` استفاده شده
- [ ] همه فیلدهای required در defaults تعریف شده‌اند
- [ ] از `.default().optional()` استفاده نشده
- [ ] از `z.input<typeof schema>` برای type استفاده شده (نه `z.infer`)

#### 🔑 نکته مهم: استفاده از `z.input` به جای `z.infer`

**مشکل:** `zodResolver` از `z.input` استفاده می‌کند، نه `z.infer`. اگر از `z.infer` استفاده کنید، ممکن است خطای type mismatch بگیرید.

**راه حل:**
```typescript
// ✅ درست - استفاده از z.input
export type BlogFormValues = z.input<typeof blogFormSchema>;

// ❌ اشتباه - z.infer ممکن است با zodResolver مشکل داشته باشد
export type BlogFormValues = z.infer<typeof blogFormSchema>;
```

**چرا؟**
- `z.input` → type ورودی schema (قبل از validation)
- `z.output` → type خروجی schema (بعد از validation و اعمال defaults)
- `z.infer` → معمولاً همان `z.output` است
- `zodResolver` از `z.input` استفاده می‌کند، پس باید type ما هم `z.input` باشد

---

## ⚠️ نکات مهم

1. **همیشه از `react-hook-form` استفاده کنید** - نه `useState`
2. **خطاها را از `formState.errors` بگیرید** - نه state جداگانه
3. **Validation Schema را جدا نگه دارید** - قابلیت استفاده مجدد
4. **از `FormFieldInput` استفاده کنید** - نمایش خودکار خطاها
5. **خطاهای سرور را با `form.setError` تنظیم کنید** - یکپارچگی
6. **از `as any` استفاده نکنید** - type safety را حفظ کنید
7. **Loading States را مدیریت کنید** - UX بهتر
8. **Dirty State Tracking** - هشدار قبل از خروج
9. **⚠️ Validation errors فقط Inline** - Toast اضافه نکنید (آزاردهنده است)
10. **⚠️ Server field errors = Inline + Toast کلی** - راهنمایی کاربر
11. **⚠️ General errors = فقط Toast** - برای network، permission، 500

---

## 📊 مقایسه با استانداردهای صنعت

| معیار | استاندارد | وضعیت شما | نتیجه |
|-------|-----------|-----------|-------|
| **Separation of Concerns** | ✅ | ✅ | عالی |
| **Type Safety** | ✅ | ✅ | عالی |
| **Validation** | ✅ Zod/Yup | ✅ Zod | عالی |
| **Form Library** | ✅ RHF/Formik | ✅ RHF | عالی |
| **Error Handling** | ✅ | ✅ | عالی |
| **Reusability** | ✅ | ✅ | عالی |
| **Documentation** | 🟡 معمولاً ضعیف | ✅ **عالی** | **شما بهترید!** |
| **Loading States** | ✅ | ✅ | عالی |
| **Edit Mode** | ✅ | ✅ | عالی |

---

## 🎯 سطح معماری

```
Junior    |━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━|
Mid-level |━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━| 
Senior    |━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━| ← شما اینجایید! ⭐
```

**این معماری حرفه‌ای و استاندارد است!** 💯

---

**آخرین بروزرسانی:** 2025-01-05

