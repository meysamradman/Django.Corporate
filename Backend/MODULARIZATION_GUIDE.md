# 📋 راهنمای مستقل‌سازی سیستم (Modularization Guide)

## 🎯 هدف

این داکیومنت راهنمای کامل برای جدا کردن کدهای مربوط به اپلیکیشن‌های خاص (blog, portfolio) از core system (user, permissions) است تا سیستم برای اضافه کردن اپلیکیشن‌های جدید (Real Estate, Shop) آماده شود.

---

## 📊 ساختار فعلی (Current Structure)

### Backend
```
Backend/src/
├── user/                    # ❌ شامل blog/portfolio dependencies
│   ├── permissions/
│   │   ├── modules/
│   │   │   └── content.py   # ❌ blog + portfolio permissions
│   │   ├── config.py        # ❌ blog_manager, portfolio_manager roles
│   │   ├── module_mappings.py  # ❌ blog, portfolio mappings
│   │   └── validator.py     # ❌ blog/portfolio context checks
│   ├── authorization/
│   │   └── __init__.py      # ❌ BlogManagerAccess, PortfolioManagerAccess
│   └── messages/
│       └── role.py           # ❌ blog_manager, portfolio_manager texts
│
├── blog/                    # ✅ مستقل
├── portfolio/               # ✅ مستقل
└── media/                   # ✅ مستقل (مرکزی)
```

### Frontend
```
admin/src/
├── core/                    # ❌ شامل blog/portfolio dependencies
│   ├── messages/
│   │   ├── modules/
│   │   │   ├── blog.ts      # ❌ باید خارج شود
│   │   │   └── portfolio.ts # ❌ باید خارج شود
│   │   ├── index.ts         # ❌ imports blog/portfolio
│   │   └── permissions.ts   # ❌ blog/portfolio translations
│   ├── permissions/
│   │   ├── config/
│   │   │   ├── roles.ts     # ❌ blog_manager, portfolio_manager
│   │   │   └── accessControl.ts  # ❌ blogRoutes, portfolioRoutes
│   │   ├── context/
│   │   │   └── PermissionContext.tsx  # ❌ canCreateBlog, canCreatePortfolio
│   │   └── hooks/
│   │       ├── useCanUpload.ts    # ❌ 'portfolio' | 'blog' context
│   │       └── useUserPermissions.ts  # ❌ ROLE_ACCESS_OVERRIDES
│   ├── config/
│   │   └── environment.ts   # ❌ PORTFOLIO_MEDIA_UPLOAD_MAX
│   └── components/
│       └── layout/
│           └── Sidebar/
│               └── SidebarMenu.tsx  # ❌ blog/portfolio menu items
│
├── components/
│   ├── blogs/               # ✅ مستقل
│   └── portfolios/          # ✅ مستقل
```

---

## 🏗️ ساختار پیشنهادی (Proposed Structure)

### Backend
```
Backend/src/
├── user/                    # ✅ فقط generic/core
│   ├── permissions/
│   │   ├── modules/
│   │   │   ├── base.py      # ✅ generic
│   │   │   ├── media.py     # ✅ generic
│   │   │   ├── users.py     # ✅ generic
│   │   │   └── # content.py حذف شود
│   │   ├── config.py        # ✅ بدون blog/portfolio
│   │   ├── module_mappings.py  # ✅ بدون blog/portfolio
│   │   └── validator.py     # ✅ بدون blog/portfolio context
│   ├── authorization/
│   │   └── __init__.py      # ✅ بدون BlogManagerAccess, PortfolioManagerAccess
│   └── messages/
│       └── role.py           # ✅ بدون blog_manager, portfolio_manager
│
├── corporate/               # 🆕 جدید - app-specific
│   ├── __init__.py
│   ├── apps.py
│   ├── permissions/
│   │   ├── __init__.py
│   │   ├── content.py        # از user/permissions/modules/content.py
│   │   ├── roles.py          # role configs برای corporate
│   │   ├── module_mappings.py  # mappings برای corporate
│   │   └── validators.py     # context validators
│   └── messages/
│       └── roles.py          # role texts برای corporate
│
├── blog/                    # ✅ مستقل
├── portfolio/               # ✅ مستقل
└── media/                   # ✅ مستقل (مرکزی)
```

### Frontend
```
admin/src/
├── core/                    # ✅ فقط generic
│   ├── permissions/
│   │   ├── config/
│   │   │   ├── roles.ts     # ✅ بدون blog/portfolio
│   │   │   └── accessControl.ts  # ✅ بدون blog/portfolio routes
│   │   ├── context/
│   │   │   └── PermissionContext.tsx  # ✅ dynamic permissions
│   │   └── hooks/
│   │       ├── useCanUpload.ts    # ✅ dynamic context
│   │       └── useUserPermissions.ts  # ✅ بدون hardcoded roles
│   ├── config/
│   │   └── environment.ts   # ✅ بدون app-specific configs
│   └── components/
│       └── layout/
│           └── Sidebar/
│               └── SidebarMenu.tsx  # ✅ dynamic menu items
│
├── apps/                    # 🆕 جدید
│   └── corporate/
│       ├── blog/
│       ├── portfolio/
│       ├── permissions/
│       │   ├── roles.ts
│       │   ├── accessControl.ts
│       │   └── hooks/
│       ├── messages/
│       │   ├── blog.ts
│       │   └── portfolio.ts
│       └── config/
│           └── environment.ts
│
└── components/
    ├── blogs/               # ✅ مستقل
    └── portfolios/          # ✅ مستقل
```

---

## 📝 لیست کامل تغییرات (Complete Change List)

### 🔴 Backend Changes

#### 1. `Backend/src/user/permissions/modules/content.py`
**Action:** حذف یا انتقال
- **Current:** شامل `CONTENT_PERMISSIONS` (blog + portfolio)
- **New Location:** `Backend/src/corporate/permissions/content.py`
- **Changes:**
  - تمام permissions مربوط به `blog.*` و `portfolio.*`
  - باید به corporate منتقل شود

#### 2. `Backend/src/user/permissions/config.py`
**Action:** حذف app-specific roles و modules
- **Remove from `SYSTEM_ROLES`:**
  - `blog_manager` role (lines 127-135)
  - `portfolio_manager` role (lines 136-150)
  - `content_manager` role → باید به corporate منتقل شود (lines 108-126)
- **Remove from `AVAILABLE_MODULES`:**
  - `blog` (lines 284-288)
  - `blog_categories` (lines 289-293)
  - `blog_tags` (lines 294-298)
  - `portfolio` (lines 299-303)
  - `portfolio_categories` (lines 304-308)
  - `portfolio_tags` (lines 309-313)
  - `portfolio_options` (lines 314-318)
  - `portfolio_option_values` (lines 319-323)
- **Update `super_admin` role:** حذف blog/portfolio از modules list

#### 3. `Backend/src/user/permissions/module_mappings.py`
**Action:** حذف blog و portfolio mappings
- **Remove:**
  - `'blog': ['blog', 'blog_categories', 'blog_tags', 'media']` (line 9)
  - `'portfolio': ['portfolio', 'portfolio_categories', 'portfolio_tags', 'portfolio_options', 'portfolio_option_values', 'media']` (line 10)

#### 4. `Backend/src/user/permissions/validator.py`
**Action:** حذف blog/portfolio context checks
- **Remove from `_check_context_permission()`:**
  - `if context_type == 'portfolio':` block (lines 60-65)
  - `if context_type == 'blog':` block (lines 67-72)
- **Note:** باید dynamic شود یا به corporate منتقل شود

#### 5. `Backend/src/user/permissions/permission_factory.py`
**Action:** بررسی و اصلاح
- **Current:** از `MODULE_MAPPINGS` استفاده می‌کند → `BlogManagerAccess` و `PortfolioManagerAccess` خودکار ساخته می‌شوند
- **Solution:** بعد از حذف blog/portfolio از `MODULE_MAPPINGS`، این classes دیگر ساخته نمی‌شوند (که درست است)

#### 6. `Backend/src/user/authorization/__init__.py`
**Action:** حذف exports
- **Remove:**
  - `BlogManagerAccess = _permission_classes.get('BlogManagerAccess')` (line 20)
  - `PortfolioManagerAccess = _permission_classes.get('PortfolioManagerAccess')` (line 21)
  - `ContentManagerAccess = BlogManagerAccess` (line 36)
  - از `__all__` list: `"BlogManagerAccess"`, `"PortfolioManagerAccess"` (lines 76-77)

#### 7. `Backend/src/user/messages/role.py`
**Action:** حذف role texts
- **Remove from `ROLE_TEXT`:**
  - `blog_manager` (lines 90-94)
  - `portfolio_manager` (lines 95-99)
  - `content_manager` → باید به corporate منتقل شود (lines 85-89)

#### 8. `Backend/src/user/permissions/__init__.py`
**Action:** بررسی imports
- اگر `content.py` را import می‌کند، باید حذف شود

#### 9. `Backend/src/user/permissions/registry.py`
**Action:** بررسی
- اگر `CONTENT_PERMISSIONS` را register می‌کند، باید حذف شود

---

### 🔴 Frontend Changes

#### 1. `admin/src/core/messages/modules/blog.ts`
**Action:** انتقال
- **New Location:** `admin/src/apps/corporate/messages/blog.ts`

#### 2. `admin/src/core/messages/modules/portfolio.ts`
**Action:** انتقال
- **New Location:** `admin/src/apps/corporate/messages/portfolio.ts`

#### 3. `admin/src/core/messages/index.ts`
**Action:** حذف imports/exports
- **Remove:**
  - Import statements برای blog و portfolio
  - Export statements برای blog و portfolio

#### 4. `admin/src/core/messages/permissions.ts`
**Action:** حذف translations
- **Remove:** تمام ترجمه‌های مربوط به blog و portfolio resources/roles/descriptions

#### 5. `admin/src/core/permissions/config/roles.ts`
**Action:** حذف app-specific roles
- **Remove:**
  - `blog_manager` role definition
  - `portfolio_manager` role definition
  - `content_manager` role definition (اگر وجود دارد)

#### 6. `admin/src/core/permissions/config/accessControl.ts`
**Action:** حذف app-specific routes
- **Remove:**
  - `blogRoutes` definition
  - `portfolioRoutes` definition
- **Update:** route matching logic برای dynamic routes

#### 7. `admin/src/core/permissions/context/PermissionContext.tsx`
**Action:** dynamic permissions
- **Remove:**
  - `canCreateBlog` permission
  - `canUpdateBlog` permission
  - `canDeleteBlog` permission
  - `canCreatePortfolio` permission
  - `canUpdatePortfolio` permission
  - `canDeletePortfolio` permission
  - `canUploadInContext` با hardcoded `'portfolio' | 'blog'` type
- **Replace with:** Dynamic permission checking based on app registry

#### 8. `admin/src/core/permissions/hooks/useCanUpload.ts`
**Action:** dynamic context type
- **Remove:** `context: 'portfolio' | 'blog'` hardcoded type
- **Replace with:** `context: string` یا dynamic type از app registry

#### 9. `admin/src/core/permissions/hooks/useUserPermissions.ts`
**Action:** حذف hardcoded roles
- **Remove from `ROLE_ACCESS_OVERRIDES`:**
  - `blog_manager` entries
  - `portfolio_manager` entries
- **Replace with:** Dynamic role loading از app registry

#### 10. `admin/src/core/config/environment.ts`
**Action:** حذف app-specific configs
- **Remove:**
  - `PORTFOLIO_MEDIA_UPLOAD_MAX` (یا هر config مشابه)
- **Note:** این configs باید به `admin/src/apps/corporate/config/environment.ts` منتقل شوند

#### 11. `admin/src/components/layout/Sidebar/SidebarMenu.tsx`
**Action:** dynamic menu items
- **Remove:** Hardcoded menu items برای blog و portfolio
- **Replace with:** Dynamic menu loading از app registry یا feature flags

---

## 🚀 مراحل پیاده‌سازی (Implementation Steps)

### Phase 1: Backend - ایجاد ساختار Corporate

#### Step 1.1: ایجاد دایرکتوری Corporate
```bash
mkdir -p Backend/src/corporate/permissions
mkdir -p Backend/src/corporate/messages
```

#### Step 1.2: ایجاد `Backend/src/corporate/__init__.py`
```python
default_app_config = 'src.corporate.apps.CorporateConfig'
```

#### Step 1.3: ایجاد `Backend/src/corporate/apps.py`
```python
from django.apps import AppConfig

class CorporateConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'src.corporate'
    verbose_name = 'Corporate'
```

#### Step 1.4: انتقال Content Permissions
- کپی `user/permissions/modules/content.py` → `corporate/permissions/content.py`
- به‌روزرسانی imports

#### Step 1.5: ایجاد Corporate Role Configs
- ایجاد `corporate/permissions/roles.py` با blog_manager, portfolio_manager, content_manager
- ایجاد `corporate/permissions/module_mappings.py` با blog و portfolio mappings

#### Step 1.6: حذف از User App
- حذف `user/permissions/modules/content.py`
- حذف blog/portfolio از `user/permissions/config.py`
- حذف blog/portfolio از `user/permissions/module_mappings.py`
- حذف blog/portfolio context checks از `user/permissions/validator.py`
- حذف exports از `user/authorization/__init__.py`
- حذف role texts از `user/messages/role.py`

#### Step 1.7: Integration
- ایجاد signal یا hook برای register کردن corporate permissions به user permission system
- یا استفاده از plugin/extension pattern

### Phase 2: Frontend - ایجاد ساختار Apps

#### Step 2.1: ایجاد دایرکتوری Apps
```bash
mkdir -p admin/src/apps/corporate/permissions
mkdir -p admin/src/apps/corporate/messages
mkdir -p admin/src/apps/corporate/config
```

#### Step 2.2: انتقال Messages
- انتقال `core/messages/modules/blog.ts` → `apps/corporate/messages/blog.ts`
- انتقال `core/messages/modules/portfolio.ts` → `apps/corporate/messages/portfolio.ts`

#### Step 2.3: انتقال Permissions Config
- ایجاد `apps/corporate/permissions/roles.ts` با blog_manager, portfolio_manager
- ایجاد `apps/corporate/permissions/accessControl.ts` با blogRoutes, portfolioRoutes

#### Step 2.4: حذف از Core
- حذف blog/portfolio از `core/messages/index.ts`
- حذف blog/portfolio translations از `core/messages/permissions.ts`
- حذف blog/portfolio roles از `core/permissions/config/roles.ts`
- حذف blog/portfolio routes از `core/permissions/config/accessControl.ts`

#### Step 2.5: Dynamic Permissions
- ایجاد App Registry system
- به‌روزرسانی `PermissionContext.tsx` برای dynamic permissions
- به‌روزرسانی `useCanUpload.ts` برای dynamic context
- به‌روزرسانی `useUserPermissions.ts` برای dynamic roles

#### Step 2.6: Dynamic Menu
- به‌روزرسانی `SidebarMenu.tsx` برای dynamic menu items
- استفاده از App Registry یا Feature Flags

### Phase 3: Testing & Validation

#### Step 3.1: Backend Tests
- تست permission system بدون blog/portfolio
- تست corporate permissions
- تست role assignments

#### Step 3.2: Frontend Tests
- تست permission checks
- تست menu rendering
- تست dynamic permissions

#### Step 3.3: Integration Tests
- تست end-to-end flows
- تست API endpoints
- تست admin panel functionality

---

## ⚠️ نکات مهم (Important Notes)

### 1. Backward Compatibility
- باید مطمئن شویم که تغییرات breaking changes ایجاد نمی‌کنند
- ممکن است نیاز به migration script برای existing roles باشد

### 2. Permission Registry
- باید یک سیستم registry برای dynamic permissions داشته باشیم
- هر app باید بتواند permissions خود را register کند

### 3. Role Management
- Roles باید از app-specific configs لود شوند
- Super admin باید به همه permissions دسترسی داشته باشد

### 4. Cache Invalidation
- بعد از تغییرات، cache باید invalidate شود
- Permission cache keys باید به‌روزرسانی شوند

### 5. Import Paths
- تمام import paths باید به‌روزرسانی شوند
- TypeScript paths در `tsconfig.json` باید بررسی شوند

### 6. Environment Variables
- App-specific configs باید از environment variables لود شوند
- Feature flags برای enable/disable apps

---

## ✅ چک‌لیست (Checklist)

### Backend
- [ ] ایجاد `Backend/src/corporate/` directory structure
- [ ] انتقال `content.py` به corporate
- [ ] ایجاد corporate role configs
- [ ] حذف blog/portfolio از `user/permissions/config.py`
- [ ] حذف blog/portfolio از `user/permissions/module_mappings.py`
- [ ] حذف blog/portfolio context checks از `user/permissions/validator.py`
- [ ] حذف exports از `user/authorization/__init__.py`
- [ ] حذف role texts از `user/messages/role.py`
- [ ] به‌روزرسانی `user/permissions/__init__.py`
- [ ] به‌روزرسانی `user/permissions/registry.py`
- [ ] ایجاد integration mechanism برای corporate permissions
- [ ] تست permission system
- [ ] تست role assignments
- [ ] به‌روزرسانی documentation

### Frontend
- [ ] ایجاد `admin/src/apps/corporate/` directory structure
- [ ] انتقال blog messages به corporate
- [ ] انتقال portfolio messages به corporate
- [ ] ایجاد corporate permissions configs
- [ ] حذف blog/portfolio از `core/messages/index.ts`
- [ ] حذف blog/portfolio translations از `core/messages/permissions.ts`
- [ ] حذف blog/portfolio roles از `core/permissions/config/roles.ts`
- [ ] حذف blog/portfolio routes از `core/permissions/config/accessControl.ts`
- [ ] Dynamic permissions در `PermissionContext.tsx`
- [ ] Dynamic context در `useCanUpload.ts`
- [ ] Dynamic roles در `useUserPermissions.ts`
- [ ] Dynamic menu در `SidebarMenu.tsx`
- [ ] حذف app-specific configs از `core/config/environment.ts`
- [ ] ایجاد App Registry system
- [ ] به‌روزرسانی TypeScript paths
- [ ] تست permission checks
- [ ] تست menu rendering
- [ ] تست dynamic permissions
- [ ] به‌روزرسانی documentation

### Integration
- [ ] تست end-to-end flows
- [ ] تست API endpoints
- [ ] تست admin panel functionality
- [ ] Cache invalidation
- [ ] Migration scripts (if needed)
- [ ] Documentation updates

---

## 🔄 Migration Strategy

### برای Existing Data
1. **Roles:** Existing roles باید migrate شوند
2. **Permissions:** Existing permissions باید preserve شوند
3. **User Assignments:** User role assignments باید حفظ شوند

### برای New Installations
1. Corporate app باید در `INSTALLED_APPS` اضافه شود
2. Corporate permissions باید register شوند
3. Default roles باید setup شوند

---

## 📚 References

- Django Architecture Pattern Documentation
- Permission System Documentation
- App-Users Documentation

---

## 📅 Timeline Estimate

- **Phase 1 (Backend):** 2-3 days
- **Phase 2 (Frontend):** 2-3 days
- **Phase 3 (Testing):** 1-2 days
- **Total:** 5-8 days

---

## 🎯 Success Criteria

1. ✅ `user` app هیچ dependency به blog/portfolio ندارد
2. ✅ `core` frontend هیچ dependency به blog/portfolio ندارد
3. ✅ Corporate app مستقل است و می‌تواند disable شود
4. ✅ سیستم آماده برای اضافه کردن Real Estate و Shop apps است
5. ✅ تمام tests pass می‌شوند
6. ✅ Documentation به‌روزرسانی شده است

---

**Last Updated:** 2025-01-XX
**Version:** 1.0.0
**Author:** Development Team
