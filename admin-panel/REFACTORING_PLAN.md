# 📋 برنامه تقسیم و Refactoring فایل‌های پنل ادمین

> **هدف**: تقسیم فایل‌های بزرگ به کامپوننت‌های کوچک‌تر و قابل استفاده مجدد  
> **تاریخ**: 2025-01-05  
> **اولویت**: بالا

---

## 📊 خلاصه اجرایی

| دسته | تعداد فایل | وضعیت | اولویت |
|------|-----------|-------|--------|
| **Property Pages** | 2 | 🔴 نیاز به تقسیم | بالا |
| **Property Components** | 1 | 🔴 نیاز به تقسیم | بالا |
| **Blog Components** | 1 | 🔴 نیاز به تقسیم | بالا |
| **Portfolio Components** | 1 | 🔴 نیاز به تقسیم | بالا |
| **Role Pages** | 1 | 🔴 نیاز به تقسیم | بالا |
| **Type Pages** | 1 | 🟡 قابل بهبود | متوسط |

---

## 🔴 اولویت بالا - نیاز به تقسیم فوری

### 1️⃣ Property Edit Page
**فایل**: `admin-panel/src/pages/real-estate/properties/[id]/edit/page.tsx`  
**خطوط**: 703 خط  
**مشکل**: فایل بسیار بزرگ، منطق پیچیده، state management زیاد

#### تقسیم پیشنهادی:

```
admin-panel/src/pages/real-estate/properties/[id]/edit/
├── page.tsx (150 خط) - فقط orchestration
├── hooks/
│   ├── usePropertyEdit.ts (200 خط) - منطق فرم و mutation
│   ├── usePropertyData.ts (100 خط) - data fetching و parsing
│   └── usePropertyMedia.ts (80 خط) - مدیریت media
└── components/
    └── PropertyEditTabs.tsx (100 خط) - مدیریت تب‌ها
```

**جزئیات تقسیم**:

1. **`hooks/usePropertyEdit.ts`**:
   - منطق `useForm`
   - `updatePropertyMutation`
   - `handleSubmit`
   - Error handling
   - Tab switching logic

2. **`hooks/usePropertyData.ts`**:
   - `useQuery` برای fetch property
   - `useEffect` برای populate form
   - Parse و transform data
   - Media parsing

3. **`hooks/usePropertyMedia.ts`**:
   - State management برای media
   - Handlers برای labels, tags, features
   - Media collection logic

4. **`components/PropertyEditTabs.tsx`**:
   - Tab structure
   - Tab content rendering
   - Skeleton loading

---

### 2️⃣ Property Create Page
**فایل**: `admin-panel/src/pages/real-estate/properties/create/page.tsx`  
**خطوط**: 653 خط  
**مشکل**: مشابه edit page، منطق تکراری

#### تقسیم پیشنهادی:

```
admin-panel/src/pages/real-estate/properties/create/
├── page.tsx (120 خط) - فقط orchestration
├── hooks/
│   ├── usePropertyCreate.ts (180 خط) - منطق فرم و mutation
│   ├── usePropertyFormData.ts (100 خط) - form data management
│   └── usePropertyLocation.ts (80 خط) - location management
└── components/
    └── PropertyCreateTabs.tsx (100 خط) - مدیریت تب‌ها
```

**جزئیات تقسیم**:

1. **`hooks/usePropertyCreate.ts`**:
   - منطق `useForm`
   - `createPropertyMutation`
   - Validation logic
   - Error handling

2. **`hooks/usePropertyFormData.ts`**:
   - Form data watching
   - Auto-slug generation
   - Form state management

3. **`hooks/usePropertyLocation.ts`**:
   - Location state
   - Region/District management
   - Map integration

---

### 3️⃣ Property BaseInfoTab Component
**فایل**: `admin-panel/src/components/real-estate/list/create/BaseInfoTab.tsx`  
**خطوط**: 831 خط  
**مشکل**: بزرگ‌ترین کامپوننت، منطق پیچیده، UI زیاد

#### تقسیم پیشنهادی:

```
admin-panel/src/components/real-estate/list/create/BaseInfoTab/
├── BaseInfoTab.tsx (150 خط) - main component
├── components/
│   ├── PropertyBasicFields.tsx (150 خط) - title, slug, description
│   ├── PropertyTypeSelector.tsx (100 خط) - type و state selection
│   ├── PropertyAgentSelector.tsx (100 خط) - agent و agency selection
│   ├── PropertyLabelsSection.tsx (120 خط) - labels management
│   ├── PropertyTagsSection.tsx (120 خط) - tags management
│   └── PropertyFeaturesSection.tsx (120 خط) - features management
└── hooks/
    ├── usePropertyTypes.ts (50 خط) - fetch types و states
    ├── usePropertyAgents.ts (50 خط) - fetch agents و agencies
    └── usePropertySelections.ts (80 خط) - labels, tags, features logic
```

**جزئیات تقسیم**:

1. **`components/PropertyBasicFields.tsx`**:
   - Title input
   - Slug input با auto-generation
   - Short description
   - Description editor

2. **`components/PropertyTypeSelector.tsx`**:
   - Property type select
   - State select
   - Status select

3. **`components/PropertyAgentSelector.tsx`**:
   - Agent select
   - Agency select

4. **`components/PropertyLabelsSection.tsx`**:
   - Labels list
   - Label selection UI
   - Label management

5. **`components/PropertyTagsSection.tsx`**:
   - Tags list
   - Tag selection UI
   - Tag management

6. **`components/PropertyFeaturesSection.tsx`**:
   - Features list
   - Feature selection UI
   - Feature management

---

## 🟡 اولویت متوسط - بررسی نیاز

### 4️⃣ Blog BaseInfoTab Component
**فایل**: `admin-panel/src/components/blogs/list/create/BaseInfoTab.tsx`  
**خطوط**: 660 خط  
**وضعیت**: نیاز به تقسیم

#### تقسیم پیشنهادی:

```
admin-panel/src/components/blogs/list/create/BaseInfoTab/
├── BaseInfoTab.tsx (120 خط) - main component
├── components/
│   ├── BlogBasicFields.tsx (150 خط) - title, slug, description
│   ├── BlogCategoriesSection.tsx (200 خط) - categories management
│   └── BlogTagsSection.tsx (200 خط) - tags management
└── hooks/
    ├── useBlogCategories.ts (60 خط) - fetch categories
    ├── useBlogTags.ts (60 خط) - fetch tags
    └── useBlogSelections.ts (80 خط) - selection logic
```

**جزئیات تقسیم**:

1. **`components/BlogBasicFields.tsx`**:
   - Title input
   - Slug input با auto-generation
   - Short description
   - Description editor

2. **`components/BlogCategoriesSection.tsx`**:
   - Categories list
   - Category selection UI
   - Quick create dialog
   - Category management

3. **`components/BlogTagsSection.tsx`**:
   - Tags list
   - Tag selection UI
   - Quick create dialog
   - Tag management

---

### 5️⃣ Portfolio BaseInfoTab Component
**فایل**: `admin-panel/src/components/portfolios/list/create/BaseInfoTab.tsx`  
**خطوط**: 849 خط  
**وضعیت**: نیاز به تقسیم

#### تقسیم پیشنهادی:

```
admin-panel/src/components/portfolios/list/create/BaseInfoTab/
├── BaseInfoTab.tsx (120 خط) - main component
├── components/
│   ├── PortfolioBasicFields.tsx (150 خط) - title, slug, description
│   ├── PortfolioCategoriesSection.tsx (180 خط) - categories management
│   ├── PortfolioTagsSection.tsx (180 خط) - tags management
│   └── PortfolioOptionsSection.tsx (180 خط) - options management
└── hooks/
    ├── usePortfolioCategories.ts (60 خط) - fetch categories
    ├── usePortfolioTags.ts (60 خط) - fetch tags
    ├── usePortfolioOptions.ts (60 خط) - fetch options
    └── usePortfolioSelections.ts (100 خط) - selection logic
```

**جزئیات تقسیم**:

1. **`components/PortfolioBasicFields.tsx`**:
   - Title input
   - Slug input با auto-generation
   - Short description
   - Description editor
   - Status select

2. **`components/PortfolioCategoriesSection.tsx`**:
   - Categories list
   - Category selection UI
   - Quick create dialog
   - Category management

3. **`components/PortfolioTagsSection.tsx`**:
   - Tags list
   - Tag selection UI
   - Quick create dialog
   - Tag management

4. **`components/PortfolioOptionsSection.tsx`**:
   - Options list
   - Option selection UI
   - Quick create dialog
   - Option management

---

### 6️⃣ Role Edit Page
**فایل**: `admin-panel/src/pages/roles/[id]/edit/page.tsx`  
**خطوط**: 853 خط  
**وضعیت**: نیاز به تقسیم

#### تقسیم پیشنهادی:

```
admin-panel/src/pages/roles/[id]/edit/
├── page.tsx (150 خط) - فقط orchestration
├── hooks/
│   ├── useRoleEdit.ts (250 خط) - منطق فرم و mutation
│   ├── useRolePermissions.ts (200 خط) - permission management
│   └── useRoleData.ts (100 خط) - data fetching
└── components/
    ├── RoleBasicInfo.tsx (100 خط) - basic info form
    ├── RolePermissionsTable.tsx (150 خط) - permissions table
    └── RolePermissionSections.tsx (100 خط) - permission sections
```

**جزئیات تقسیم**:

1. **`hooks/useRoleEdit.ts`**:
   - منطق `useForm`
   - `updateRoleMutation`
   - `handleSubmit`
   - Error handling

2. **`hooks/useRolePermissions.ts`**:
   - Permission state management
   - Permission toggle logic
   - Permission grouping
   - Analytics permissions
   - AI permissions
   - Management permissions

3. **`hooks/useRoleData.ts`**:
   - `useQuery` برای fetch role
   - `useQuery` برای fetch permissions
   - Data parsing و transformation

4. **`components/RoleBasicInfo.tsx`**:
   - Name input
   - Description textarea

5. **`components/RolePermissionsTable.tsx`**:
   - Standard permissions table
   - Permission selection UI
   - Permission grouping

6. **`components/RolePermissionSections.tsx`**:
   - Analytics permissions card
   - AI permissions card
   - Management permissions card

---

### 7️⃣ Property Type Edit Page
**فایل**: `admin-panel/src/pages/real-estate/types/[id]/edit/page.tsx`  
**خطوط**: 453 خط  
**وضعیت**: قابل قبول، اما می‌تواند بهتر شود

#### تقسیم پیشنهادی (اختیاری):

```
admin-panel/src/pages/real-estate/types/[id]/edit/
├── page.tsx (150 خط)
├── hooks/
│   └── usePropertyTypeEdit.ts (200 خط)
└── components/
    └── PropertyTypeForm.tsx (100 خط)
```

---

## 📝 الگوی تقسیم استاندارد

### ساختار پیشنهادی برای صفحات بزرگ:

```typescript
// page.tsx - فقط orchestration
export default function EntityEditPage() {
  const { form, mutation, handlers } = useEntityEdit();
  const { data, isLoading } = useEntityData();
  
  return (
    <EntityEditLayout>
      <EntityEditTabs {...handlers} />
      <EntityEditSaveBar mutation={mutation} />
    </EntityEditLayout>
  );
}
```

### ساختار پیشنهادی برای کامپوننت‌های بزرگ:

```typescript
// BaseInfoTab.tsx - main component
export default function BaseInfoTab(props: BaseInfoTabProps) {
  const { types, agents } = useEntityData();
  
  return (
    <div>
      <BasicFields {...props} />
      <TypeSelector types={types} {...props} />
      <AgentSelector agents={agents} {...props} />
      <SelectionsSection {...props} />
    </div>
  );
}
```

---

## 🎯 مزایای تقسیم

1. **قابلیت استفاده مجدد**: کامپوننت‌های کوچک‌تر قابل استفاده در جاهای دیگر
2. **قابلیت تست**: تست کردن کامپوننت‌های کوچک‌تر آسان‌تر است
3. **خوانایی**: کد خواناتر و قابل نگهداری‌تر
4. **Performance**: Code splitting بهتر
5. **همکاری تیمی**: چند نفر می‌توانند همزمان روی بخش‌های مختلف کار کنند

---

## 📋 چک‌لیست اجرا

### مرحله 1: Property Edit Page
- [ ] ایجاد `hooks/usePropertyEdit.ts`
- [ ] ایجاد `hooks/usePropertyData.ts`
- [ ] ایجاد `hooks/usePropertyMedia.ts`
- [ ] ایجاد `components/PropertyEditTabs.tsx`
- [ ] Refactor `page.tsx`
- [ ] تست کامل

### مرحله 2: Property Create Page
- [ ] ایجاد `hooks/usePropertyCreate.ts`
- [ ] ایجاد `hooks/usePropertyFormData.ts`
- [ ] ایجاد `hooks/usePropertyLocation.ts`
- [ ] ایجاد `components/PropertyCreateTabs.tsx`
- [ ] Refactor `page.tsx`
- [ ] تست کامل

### مرحله 3: Property BaseInfoTab
- [ ] ایجاد `components/PropertyBasicFields.tsx`
- [ ] ایجاد `components/PropertyTypeSelector.tsx`
- [ ] ایجاد `components/PropertyAgentSelector.tsx`
- [ ] ایجاد `components/PropertyLabelsSection.tsx`
- [ ] ایجاد `components/PropertyTagsSection.tsx`
- [ ] ایجاد `components/PropertyFeaturesSection.tsx`
- [ ] ایجاد `hooks/usePropertyTypes.ts`
- [ ] ایجاد `hooks/usePropertyAgents.ts`
- [ ] ایجاد `hooks/usePropertySelections.ts`
- [ ] Refactor `BaseInfoTab.tsx`
- [ ] تست کامل

### مرحله 4: Blog BaseInfoTab
- [ ] ایجاد `components/BlogBasicFields.tsx`
- [ ] ایجاد `components/BlogCategoriesSection.tsx`
- [ ] ایجاد `components/BlogTagsSection.tsx`
- [ ] ایجاد `hooks/useBlogCategories.ts`
- [ ] ایجاد `hooks/useBlogTags.ts`
- [ ] ایجاد `hooks/useBlogSelections.ts`
- [ ] Refactor `BaseInfoTab.tsx`
- [ ] تست کامل

### مرحله 5: Portfolio BaseInfoTab
- [ ] ایجاد `components/PortfolioBasicFields.tsx`
- [ ] ایجاد `components/PortfolioCategoriesSection.tsx`
- [ ] ایجاد `components/PortfolioTagsSection.tsx`
- [ ] ایجاد `components/PortfolioOptionsSection.tsx`
- [ ] ایجاد `hooks/usePortfolioCategories.ts`
- [ ] ایجاد `hooks/usePortfolioTags.ts`
- [ ] ایجاد `hooks/usePortfolioOptions.ts`
- [ ] ایجاد `hooks/usePortfolioSelections.ts`
- [ ] Refactor `BaseInfoTab.tsx`
- [ ] تست کامل

### مرحله 6: Role Edit Page
- [ ] ایجاد `hooks/useRoleEdit.ts`
- [ ] ایجاد `hooks/useRolePermissions.ts`
- [ ] ایجاد `hooks/useRoleData.ts`
- [ ] ایجاد `components/RoleBasicInfo.tsx`
- [ ] ایجاد `components/RolePermissionsTable.tsx`
- [ ] ایجاد `components/RolePermissionSections.tsx`
- [ ] Refactor `page.tsx`
- [ ] تست کامل

---

## ⚠️ نکات مهم

1. **حفظ منطق**: همه منطق باید حفظ شود، فقط ساختار تغییر می‌کند
2. **Type Safety**: همه type ها باید حفظ شوند
3. **Error Handling**: Error handling باید در همه hook ها باشد
4. **Testing**: بعد از هر تقسیم، تست کامل انجام شود
5. **Documentation**: کامنت‌های مناسب اضافه شود

---

## 📊 آمار

- **کل فایل‌های نیاز به تقسیم**: 6 فایل (اولویت بالا)
- **فایل‌های قابل بهبود**: 1 فایل (اولویت متوسط)
- **تخمین زمان**: 4-5 روز برای اولویت بالا
- **تخمین زمان**: 1 روز برای اولویت متوسط
- **کل خطوط کد**: ~4,500 خط که باید تقسیم شود
- **تخمین خطوط بعد از تقسیم**: ~6,000 خط (کامپوننت‌های کوچک‌تر)

---

**آخرین بروزرسانی**: 2025-01-05

