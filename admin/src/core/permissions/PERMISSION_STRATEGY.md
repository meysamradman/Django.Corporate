# 🔥 استراتژی Permission برای دکمه‌ها و لینک‌ها

## 📋 فهرست مطالب
1. [ایده کلی](#ایده-کلی)
2. [دکمه "ایجاد" در لیست](#1-دکمه-ایجاد-در-لیست)
3. [دکمه "ذخیره" در صفحات Create/Edit](#2-دکمه-ذخیره-در-صفحات-createedit)
4. [دکمه "ذخیره" در صفحات Settings](#3-دکمه-ذخیره-در-صفحات-settings)
5. [لینک‌های ستون اول (Name Column)](#4-لینکهای-ستون-اول-name-column)
6. [دکمه‌های درون لیست (Row Actions)](#5-دکمههای-درون-لیست-row-actions)
7. [مثال‌های عملی برای هر ماژول](#مثالهای-عملی-برای-هر-ماژول)
8. [استراتژی کلی برای Settings و Panel](#⚙️-settings-تنظیمات-وبسایت-و-panel-تنظیمات-پنل)
9. [خلاصه استراتژی](#خلاصه-استراتژی)

---

## ایده کلی
به جای اینکه برای همه دکمه‌ها `ProtectedButton` با toast استفاده کنیم، از استراتژی ترکیبی استفاده می‌کنیم:

**قاعده کلی:**
- **دکمه‌های اصلی (Create, Save در Settings)**: `ProtectedButton` با toast
- **دکمه‌های درون لیست (Row Actions)**: `permission` در `DataTableRowAction` (disable بدون toast)
- **لینک‌های ستون اول**: `ProtectedLink` (disable بدون toast)
- **دکمه Save در Create/Edit**: `Button` معمولی (RouteGuard چک می‌کند)

### 1. دکمه‌های اصلی (Main Buttons)

#### الف) دکمه "ایجاد" در لیست
**استفاده از `ProtectedButton` با toast**

```tsx
<ProtectedButton 
  permission="blog.create"
  onClick={() => router.push("/blogs/create")}
  showDenyToast={true}
  denyMessage="شما دسترسی لازم برای ایجاد وبلاگ را ندارید"
>
  <Plus />
  ایجاد وبلاگ
</ProtectedButton>
```

**چرا toast؟**
- کاربر باید بداند چرا نمی‌تواند عملیات را انجام دهد
- فقط یک دکمه است، toast مزاحم نیست

#### ب) دکمه "ذخیره" در صفحات Create/Edit
**استفاده از `Button` معمولی (نه ProtectedButton)**

```tsx
// در صفحات create/edit (مثل /blogs/create, /users/create)
<Button onClick={handleSave} disabled={isSubmitting}>
  <Save />
  ذخیره
</Button>
```

**چرا ProtectedButton نیست؟**
- `RoutePermissionGuard` چک می‌کند که کاربر permission برای create/update دارد
- اگر کاربر به صفحه آمده، یعنی permission دارد
- پس دکمه Save نیاز به ProtectedButton ندارد

#### ج) دکمه "ذخیره" در صفحات Settings
**استفاده از `ProtectedButton` با toast**

```tsx
// در صفحات settings (مثل /settings/panel, /settings/page/about)
<ProtectedButton 
  permission="panel.update"
  onClick={handleSave}
  showDenyToast={true}
>
  <Save />
  ذخیره تغییرات
</ProtectedButton>
```

**چرا ProtectedButton؟**
- Route guard فقط read را چک می‌کند (base permission)
- برای update باید ProtectedButton استفاده کنیم

---

## 4. لینک‌های ستون اول (Name Column Links)
**استفاده از `ProtectedLink` (disable بدون toast)**

این لینک‌ها:
- ستون اول (نام/عنوان) در جداول که به view/edit می‌رود
- در بعضی صفحات مثل users و admins، view و edit یکی هستند

**مثال برای Users (view و edit یکی هستند):**
```tsx
// admin/src/components/users/UserTableColumns.tsx
import { ProtectedLink } from "@/core/permissions";

{
  accessorKey: "profile.full_name",
  cell: ({ row }) => {
    const user = row.original;
    return (
      <ProtectedLink 
        href={`/users/${user.id}/edit`} 
        permission="users.update"
        className="flex items-center gap-3"
      >
        <Avatar>...</Avatar>
        <div>{fullName}</div>
      </ProtectedLink>
    );
  },
}
```

**مثال برای Admins (view و edit یکی هستند):**
```tsx
// admin/src/components/admins/AdminTableColumns.tsx
import { ProtectedLink } from "@/core/permissions";

{
  accessorKey: "profile.full_name",
  cell: ({ row }) => {
    const admin = row.original;
    return (
      <ProtectedLink 
        href={`/admins/${admin.id}/edit`} 
        permission="admin.update"
        className="flex items-center gap-3"
      >
        <Avatar>...</Avatar>
        <div>{fullName}</div>
      </ProtectedLink>
    );
  },
}
```

**مثال برای Blogs (view و edit جدا هستند):**
```tsx
// admin/src/components/blogs/list/BlogTableColumns.tsx
import { ProtectedLink } from "@/core/permissions";

{
  accessorKey: "title",
  cell: ({ row }) => {
    const blog = row.original;
    return (
      <ProtectedLink 
        href={`/blogs/${blog.id}/view`} 
        permission="blog.read"
        className="flex items-center gap-3"
      >
        <Avatar>...</Avatar>
        <div>{blog.title}</div>
      </ProtectedLink>
    );
  },
}
```

**مثال برای Portfolios (view و edit جدا هستند):**
```tsx
// admin/src/components/portfolios/list/PortfolioTableColumns.tsx
import { ProtectedLink } from "@/core/permissions";

{
  accessorKey: "title",
  cell: ({ row }) => {
    const portfolio = row.original;
    return (
      <ProtectedLink 
        href={`/portfolios/${portfolio.id}/view`} 
        permission="portfolio.read"
        className="flex items-center gap-3"
      >
        <Avatar>...</Avatar>
        <div>{portfolio.title}</div>
      </ProtectedLink>
    );
  },
}
```

**مثال برای Categories:**
```tsx
// admin/src/components/blogs/categories/list/CategoryTableColumns.tsx
import { ProtectedLink } from "@/core/permissions";

{
  accessorKey: "name",
  cell: ({ row }) => {
    const category = row.original;
    return (
      <ProtectedLink 
        href={`/blogs/categories/${category.id}/edit`} 
        permission="blog_categories.update"
        className="flex items-center gap-3"
      >
        <Avatar>...</Avatar>
        <div>{category.name}</div>
      </ProtectedLink>
    );
  },
}
```

**مثال برای Tags:**
```tsx
// admin/src/components/blogs/tags/list/TagTableColumns.tsx
import { ProtectedLink } from "@/core/permissions";

{
  accessorKey: "name",
  cell: ({ row }) => (
    <ProtectedLink 
      href={`/blogs/tags/${row.original.id}/edit`} 
      permission="blog_tags.update"
      className="table-cell-primary table-cell-wide"
    >
      {row.original.name}
    </ProtectedLink>
  ),
}
```

**استراتژی:**
- اگر کاربر permission ندارد، لینک disable می‌شود (opacity-50, pointer-events-none)
- بدون toast (چون در لیست است)
- کاربر می‌بیند که لینک وجود دارد اما برایش فعال نیست

**نکته مهم:**
- برای **Users و Admins**: از `permission="users.update"` و `permission="admin.update"` استفاده می‌کنیم (چون view و edit یکی هستند)
- برای **Blogs و Portfolios**: از `permission="blog.read"` و `permission="portfolio.read"` استفاده می‌کنیم (چون view و edit جدا هستند)

---

## 5. دکمه‌های درون لیست (Row Actions)
**استفاده از `permission` در `DataTableRowAction` (disable بدون toast)**

این دکمه‌ها:
- دکمه "ویرایش" در هر row
- دکمه "حذف" در هر row
- دکمه‌های action در dropdown

**مثال:**
```tsx
const rowActions: DataTableRowAction<Blog>[] = [
  {
    label: "ویرایش",
    icon: <Edit className="w-4 h-4" />,
    onClick: (blog) => router.push(`/blogs/${blog.id}/edit`),
    permission: "blog.update", // 🔥 فقط disable می‌شود (نه حذف، نه toast)
  },
  {
    label: "حذف",
    icon: <Trash className="w-4 h-4" />,
    onClick: (blog) => handleDelete(blog.id),
    isDestructive: true,
    permission: "blog.delete", // 🔥 فقط disable می‌شود (نه حذف، نه toast)
  },
];
```

**استراتژی:**
- اگر کاربر می‌تواند لیست را ببیند (read permission)، همه دکمه‌ها را نشان می‌دهیم
- اگر permission ندارد، دکمه را **disable** می‌کنیم (نه حذف)
- بدون toast (چون در لیست است و ممکن است 100 row باشد)

**چرا disable نه حذف؟**
- کاربر می‌بیند که این action وجود دارد اما برایش فعال نیست
- UX بهتر: می‌فهمد که باید permission بگیرد
- بدون مزاحمت toast

---

## مثال‌های عملی برای هر ماژول

### 📝 Blogs (وبلاگ)

#### 1. دکمه "ایجاد" در لیست:
```tsx
// admin/src/app/(dashboard)/blogs/page.tsx
import { ProtectedButton } from "@/core/permissions";

<ProtectedButton 
  permission="blog.create"
  onClick={() => router.push("/blogs/create")}
  showDenyToast={true}
  denyMessage="شما دسترسی لازم برای ایجاد وبلاگ را ندارید"
>
  <Plus />
  ایجاد وبلاگ
</ProtectedButton>
```

#### 2. Row Actions در جدول:
```tsx
// admin/src/app/(dashboard)/blogs/page.tsx
import { useBlogColumns } from "@/components/blogs/list/BlogTableColumns";

const rowActions: DataTableRowAction<Blog>[] = [
  {
    label: "ویرایش",
    icon: <Edit className="w-4 h-4" />,
    onClick: (blog) => router.push(`/blogs/${blog.id}/edit`),
    permission: "blog.update", // ✅ فقط disable می‌شود (نه حذف، نه toast)
  },
  {
    label: "حذف",
    icon: <Trash className="w-4 h-4" />,
    onClick: (blog) => handleDelete(blog.id),
    isDestructive: true,
    permission: "blog.delete", // ✅ فقط disable می‌شود (نه حذف، نه toast)
  },
];

const columns = useBlogColumns(rowActions);
```

#### 3. لینک ستون اول (عنوان):
```tsx
// admin/src/components/blogs/list/BlogTableColumns.tsx
// (قبلاً در بخش 4 توضیح داده شد)
<ProtectedLink 
  href={`/blogs/${blog.id}/view`} 
  permission="blog.read"
>
  {blog.title}
</ProtectedLink>
```

#### 4. دکمه "ذخیره" در صفحه Create/Edit:
```tsx
// admin/src/app/(dashboard)/blogs/(list)/create/page.tsx
// ❌ ProtectedButton استفاده نمی‌کنیم!
<Button onClick={handleSave} disabled={isSubmitting}>
  <Save />
  ذخیره
</Button>
// دلیل: RoutePermissionGuard چک می‌کند که کاربر permission دارد
```

---

### 👥 Users (کاربران)

#### 1. دکمه "ایجاد" در لیست:
```tsx
// admin/src/app/(dashboard)/users/page.tsx
<ProtectedButton 
  permission="users.create"
  onClick={() => router.push("/users/create")}
  showDenyToast={true}
>
  <Plus />
  ایجاد کاربر
</ProtectedButton>
```

#### 2. Row Actions:
```tsx
const rowActions: DataTableRowAction<UserWithProfile>[] = [
  {
    label: "ویرایش",
    icon: <Edit />,
    onClick: (user) => router.push(`/users/${user.id}/edit`),
    permission: "users.update", // ✅ فقط disable می‌شود
  },
  {
    label: "حذف",
    icon: <Trash />,
    onClick: (user) => handleDelete(user.id),
    isDestructive: true,
    permission: "users.delete", // ✅ فقط disable می‌شود
  },
];
```

#### 3. لینک ستون اول (نام):
```tsx
// admin/src/components/users/UserTableColumns.tsx
<ProtectedLink 
  href={`/users/${user.id}/edit`} 
  permission="users.update" // ✅ view و edit یکی هستند
>
  {fullName}
</ProtectedLink>
```

---

### 👨‍💼 Admins (ادمین‌ها)

#### 1. دکمه "ایجاد" در لیست:
```tsx
<ProtectedButton 
  permission="admin.create"
  onClick={() => router.push("/admins/create")}
  showDenyToast={true}
>
  <Plus />
  ایجاد ادمین
</ProtectedButton>
```

#### 2. Row Actions:
```tsx
const rowActions: DataTableRowAction<AdminWithProfile>[] = [
  {
    label: "ویرایش",
    icon: <Edit />,
    onClick: (admin) => router.push(`/admins/${admin.id}/edit`),
    permission: "admin.update", // ✅ فقط disable می‌شود
  },
  {
    label: "حذف",
    icon: <Trash />,
    onClick: (admin) => handleDelete(admin.id),
    isDestructive: true,
    permission: "admin.delete", // ✅ فقط disable می‌شود
  },
];
```

#### 3. لینک ستون اول (نام):
```tsx
// admin/src/components/admins/AdminTableColumns.tsx
<ProtectedLink 
  href={`/admins/${admin.id}/edit`} 
  permission="admin.update" // ✅ view و edit یکی هستند
>
  {fullName}
</ProtectedLink>
```

---

### 🎨 Portfolios (نمونه‌کارها)

#### 1. دکمه "ایجاد":
```tsx
<ProtectedButton 
  permission="portfolio.create"
  onClick={() => router.push("/portfolios/create")}
  showDenyToast={true}
>
  <Plus />
  ایجاد نمونه‌کار
</ProtectedButton>
```

#### 2. Row Actions:
```tsx
const rowActions: DataTableRowAction<Portfolio>[] = [
  {
    label: "ویرایش",
    icon: <Edit />,
    onClick: (portfolio) => router.push(`/portfolios/${portfolio.id}/edit`),
    permission: "portfolio.update",
  },
  {
    label: "حذف",
    icon: <Trash />,
    onClick: (portfolio) => handleDelete(portfolio.id),
    isDestructive: true,
    permission: "portfolio.delete",
  },
];
```

#### 3. لینک ستون اول:
```tsx
<ProtectedLink 
  href={`/portfolios/${portfolio.id}/view`} 
  permission="portfolio.read" // ✅ view و edit جدا هستند
>
  {portfolio.title}
</ProtectedLink>
```

---

### ⚙️ Settings (تنظیمات وب‌سایت) و Panel (تنظیمات پنل)

**🔥 استراتژی کلی: یک permission برای هر قسمت (manage)**

برای Settings و Panel، از استراتژی **کلی** استفاده می‌کنیم:
- یک permission برای هر قسمت (مثلا `pages.manage`, `forms.manage`, `panel.manage`)
- نه read/update/delete جداگانه
- یا permission داده می‌شود یا نمی‌شود (کلی)

#### 1. Settings (تنظیمات وب‌سایت):

##### صفحات (Pages):
```tsx
// admin/src/components/page/AboutPageForm.tsx
<ProtectedButton 
  onClick={handleSave} 
  permission="pages.manage"
  disabled={saving}
  showDenyToast={true}
  denyMessage="شما دسترسی لازم برای مدیریت صفحات وب را ندارید"
>
  <Save />
  ذخیره تغییرات
</ProtectedButton>
```

**Route Rule:**
```tsx
// admin/src/core/permissions/config/accessControl.ts
createRule({
  id: "settings-page-about",
  pattern: /^\/settings\/page\/about\/?$/,
  module: "pages",
  action: "manage", // ✅ یک permission کلی
  description: "صفحه درباره ما",
})
```

##### فرم‌ها (Forms):
```tsx
// Route Rule
createRule({
  id: "settings-form",
  pattern: /^\/settings\/form\/?$/,
  module: "forms",
  action: "manage", // ✅ یک permission کلی
  description: "فرم‌ها",
})
```

##### تنظیمات عمومی (General Settings):
```tsx
// Route Rule
createRule({
  id: "settings-general",
  pattern: /^\/settings\/general\/?$/,
  module: "settings",
  action: "manage", // ✅ یک permission کلی
  description: "تنظیمات عمومی",
})
```

#### 2. Panel (تنظیمات پنل ادمین):

##### تنظیمات پنل:
```tsx
// admin/src/app/(dashboard)/settings/panel/PanelSettingsForm.tsx
<ProtectedButton 
  type="submit" 
  permission="panel.manage"
  disabled={isSubmitting || !hasChanges}
  showDenyToast={true}
  denyMessage="شما دسترسی لازم برای مدیریت تنظیمات پنل را ندارید"
>
  <Save />
  ذخیره تغییرات
</ProtectedButton>
```

**Route Rule:**
```tsx
createRule({
  id: "settings-panel",
  pattern: /^\/settings\/panel\/?$/,
  module: "panel",
  action: "manage", // ✅ یک permission کلی
  description: "تنظیمات پنل",
})
```

##### تنظیمات AI:
```tsx
// Route Rule
createRule({
  id: "settings-ai",
  pattern: /^\/settings\/ai\/?$/,
  module: "ai",
  action: "manage", // ✅ یک permission کلی
  description: "تنظیمات هوش مصنوعی",
})
```

**نکته مهم:** 
- در Settings و Panel، RouteGuard با `action: "manage"` چک می‌کند
- اگر کاربر `pages.manage` داشته باشد، می‌تواند همه صفحات را ببیند و ویرایش کند
- اگر کاربر `panel.manage` داشته باشد، می‌تواند همه تنظیمات پنل را ببیند و ویرایش کند
- **نه read/update/delete جداگانه** - فقط یک permission کلی

---

### 📧 Email (ایمیل)

**🔥 استراتژی: چهار permission مجزا**

برای Email، از چهار permission استفاده می‌کنیم:
- **`email.read`**: خواندن (لیست، جزئیات، آمار/صندوق)
- **`email.create`**: ایجاد/ارسال/پاسخ به ایمیل
- **`email.update`**: به‌روزرسانی/mark_as_read/save_as_draft
- **`email.delete`**: حذف پیام‌های ایمیل

**Route Rule:**
```tsx
// admin/src/core/permissions/config/accessControl.ts
createRule({
  id: "email-center",
  pattern: /^\/email\/?$/,
  module: "email",
  action: "read", // ✅ برای خواندن (صندوق)
  description: "مدیریت ایمیل",
})
```

**Backend Usage:**
```python
# Backend/src/email/views/email_views.py

# خواندن
def list(self, request, *args, **kwargs):
    if not PermissionValidator.has_permission(request.user, 'email.read'):
        # ...

def retrieve(self, request, *args, **kwargs):
    if not PermissionValidator.has_permission(request.user, 'email.read'):
        # ...

def stats(self, request):
    if not PermissionValidator.has_permission(request.user, 'email.read'):
        # ...

# ایجاد/ارسال/پاسخ
def create(self, request, *args, **kwargs):
    # AllowAny - برای فرم تماس عمومی
    # اما برای ادمین‌ها، باید email.create داشته باشند

# به‌روزرسانی/عملیات دیگر
def update(self, request, *args, **kwargs):
    if not PermissionValidator.has_permission(request.user, 'email.update'):
        # ...

def destroy(self, request, *args, **kwargs):
    if not PermissionValidator.has_permission(request.user, 'email.delete'):
        # ...

def mark_as_read(self, request, pk=None):
    if not PermissionValidator.has_permission(request.user, 'email.update'):
        # ...

def mark_as_replied(self, request, pk=None):
    if not PermissionValidator.has_permission(request.user, 'email.update'):
        # ...

def save_as_draft(self, request, pk=None):
    if not PermissionValidator.has_permission(request.user, 'email.update'):
        # ...
```

**نکته مهم:**
- `email.read`: برای خواندن لیست، جزئیات، آمار (صندوق)
- `email.create`: برای ایجاد، ارسال، و پاسخ به ایمیل‌ها
- `email.update`: برای به‌روزرسانی، mark_as_read، mark_as_replied، save_as_draft
- `email.delete`: برای حذف پیام‌های ایمیل
- `create` (فرم تماس): عمومی است (AllowAny) - برای کاربران عادی

---

## مزایا

✅ **UX بهتر**: بدون مزاحمت toast در لیست‌ها  
✅ **Performance**: همه چیز از cache می‌آید  
✅ **ساده**: فقط `permission` اضافه می‌کنیم  
✅ **انعطاف‌پذیر**: می‌توانیم toast را فعال/غیرفعال کنیم  

---

## 📌 نکات مهم و قوانین

### ✅ قوانین کلی:

1. **دکمه "ایجاد" در لیست**: همیشه `ProtectedButton` با `showDenyToast={true}`
2. **دکمه "ذخیره" در Create/Edit**: همیشه `Button` معمولی (RoutePermissionGuard چک می‌کند)
3. **دکمه "ذخیره" در Settings**: همیشه `ProtectedButton` با `showDenyToast={true}` (route guard فقط read را چک می‌کند)
4. **لینک ستون اول**: همیشه `ProtectedLink` (disable بدون toast)
5. **دکمه‌های درون لیست (Row Actions)**: فقط `permission` در `DataTableRowAction` (disable بدون toast)

### 🔑 Permission Mapping:

| ماژول | Create | Read | Update | Delete | View/Edit | Manage (کلی) |
|-------|--------|------|--------|--------|-----------|--------------|
| **Users** | `users.create` | `users.read` | `users.update` | `users.delete` | یکی هستند → `users.update` | - |
| **Admins** | `admin.create` | `admin.read` | `admin.update` | `admin.delete` | یکی هستند → `admin.update` | - |
| **Blogs** | `blog.create` | `blog.read` | `blog.update` | `blog.delete` | جدا هستند → `blog.read` برای view | - |
| **Portfolios** | `portfolio.create` | `portfolio.read` | `portfolio.update` | `portfolio.delete` | جدا هستند → `portfolio.read` برای view | - |
| **Categories** | `blog_categories.create` | `blog_categories.read` | `blog_categories.update` | `blog_categories.delete` | یکی هستند → `blog_categories.update` | - |
| **Tags** | `blog_tags.create` | `blog_tags.read` | `blog_tags.update` | `blog_tags.delete` | یکی هستند → `blog_tags.update` | - |
| **Panel Settings** | - | - | - | - | - | **`panel.manage`** ✅ |
| **Pages** | - | - | - | - | - | **`pages.manage`** ✅ |
| **Forms** | - | - | - | - | - | **`forms.manage`** ✅ |
| **General Settings** | - | - | - | - | - | **`settings.manage`** ✅ |
| **AI Settings** | - | - | - | - | - | **`ai.manage`** ✅ |
| **Email** | **`email.create`** ✅ | **`email.read`** ✅ | **`email.update`** ✅ | **`email.delete`** ✅ | - | - |

**نکته:** 
- برای Settings و Panel، **فقط** از **`manage`** permissions استفاده می‌کنیم (یک permission کلی)
- برای Email، از چهار permission مجزا استفاده می‌کنیم:
  - **`email.read`**: خواندن لیست، جزئیات، آمار (صندوق)
  - **`email.create`**: ایجاد، ارسال، و پاسخ به ایمیل‌ها
  - **`email.update`**: به‌روزرسانی، mark_as_read، mark_as_replied، save_as_draft
  - **`email.delete`**: حذف پیام‌های ایمیل

### 🎯 Multiple Permissions:

می‌توانیم array استفاده کنیم:

```tsx
// OR logic (یکی از permissions کافی است)
permission: ["blog.update", "blog.delete"]

// AND logic (همه permissions لازم است)
permission: ["blog.update", "blog.delete"], requireAllPermissions: true
```

### ⚠️ نکات امنیتی:

1. **همیشه در بک‌اند هم چک کنید**: Frontend فقط برای UX است، امنیت در بک‌اند است
2. **RoutePermissionGuard**: برای صفحات create/edit استفاده می‌شود
3. **Base Permissions**: بعضی permissions مثل `panel.read` و `page.read` برای همه ادمین‌ها آزاد است
4. **SuperAdmin**: همه permissions را دارد، اما بهتر است کد را طوری بنویسیم که superadmin هم چک شود

---

## 📊 خلاصه استراتژی

| نوع دکمه/لینک | محل | Component | Toast | مثال |
|---------|-----|-----------|-------|------|
| **Create Button** | بالای لیست | `ProtectedButton` | ✅ بله | دکمه "ایجاد وبلاگ" |
| **Save Button** | صفحات Create/Edit | `Button` معمولی | ❌ نه | دکمه "ذخیره" در `/blogs/create` |
| **Save Button** | صفحات Settings | `ProtectedButton` | ✅ بله | دکمه "ذخیره" در `/settings/panel` |
| **Name Column Link** | ستون اول جدول | `ProtectedLink` | ❌ نه | لینک نام در جدول users |
| **Row Actions** | Dropdown در جدول | `permission` در `DataTableRowAction` | ❌ نه | دکمه "ویرایش" در dropdown |

---

## 🔍 چک‌لیست برای هر ماژول جدید

وقتی یک ماژول جدید اضافه می‌کنید، این موارد را چک کنید:

- [ ] دکمه "ایجاد" در لیست: `ProtectedButton` با toast
- [ ] دکمه "ذخیره" در صفحه create: `Button` معمولی
- [ ] دکمه "ذخیره" در صفحه edit: `Button` معمولی
- [ ] لینک ستون اول: `ProtectedLink` با permission مناسب
- [ ] Row Actions (ویرایش): `permission` در `DataTableRowAction`
- [ ] Row Actions (حذف): `permission` در `DataTableRowAction`
- [ ] Route rules در `accessControl.ts`: برای create, edit, view
- [ ] Backend permissions: در `PermissionRegistry` ثبت شده

---

## 📚 فایل‌های مرتبط

### Frontend:
- **Components**: `admin/src/core/permissions/components/`
  - `ProtectedButton.tsx`: دکمه‌های محافظت‌شده با toast
  - `ProtectedLink.tsx`: لینک‌های محافظت‌شده بدون toast
  - `PermissionGate.tsx`: شرطی کردن render
  - `RoutePermissionGuard.tsx`: محافظت از routes

- **Types**: `admin/src/types/shared/table.ts`
  - `DataTableRowAction`: نوع برای row actions با permission

- **Config**: `admin/src/core/permissions/config/accessControl.ts`
  - Route rules برای هر صفحه

- **Hooks**: `admin/src/core/permissions/hooks/`
  - `usePermission.ts`: hook اصلی برای permission checks
  - `useUserPermissions.ts`: hook برای module/action checks

### Backend:
- **🔥 فایل مرکزی**: `Backend/src/user/permissions/permissions_config.py`
  - **این فایل Single Source of Truth است!**
  - همه permission‌ها در این فایل تعریف می‌شوند
  - فقط این فایل را ویرایش کنید، بقیه خودکار به‌روز می‌شوند

- **Registry**: `Backend/src/user/permissions/registry.py`
  - از `permissions_config.py` می‌خواند (خودکار)
  - نیازی به ویرایش دستی نیست

- **Factory**: `Backend/src/user/permissions/permission_factory.py`
  - از `registry.py` می‌خواند و permission classes می‌سازد (خودکار)
  - نیازی به ویرایش دستی نیست

- **Roles Config**: `Backend/src/user/authorization/roles_config.py`
  - تعریف نقش‌های سیستم (System Roles)
  - تعریف modules و actions برای هر نقش

---

## 🔥 فایل مرکزی: permissions_config.py

### چرا فایل مرکزی؟
قبلاً باید در 3 فایل تغییر می‌دادیم:
1. `registry.py` - برای تعریف permission
2. `admin_permission.py` - برای permission classes
3. `roles_config.py` - برای نقش‌ها

**مشکل:** خیلی سخت بود و اشتباه می‌شد!

### راه‌حل: فایل مرکزی
**فقط یک فایل:** `Backend/src/user/permissions/permissions_config.py`

### جریان کار (خودکار):
```
permissions_config.py (شما اینجا تغییر می‌دهید)
    ↓
registry.py (خودکار از config می‌خواند)
    ↓
permission_factory.py (خودکار از registry می‌خواند)
    ↓
admin_permission.py (خودکار از factory استفاده می‌کند)
```

### مثال: اضافه کردن permission جدید

فقط در `permissions_config.py` اضافه کنید:

```python
'new.permission': {
    'module': 'new',
    'action': 'manage',
    'display_name': 'New Permission',
    'description': 'Description here',
    'requires_superadmin': False,  # اختیاری
}
```

**همه چیز خودکار می‌شود:**
- ✅ در `registry.py` ثبت می‌شود
- ✅ در `permission_factory.py` class ساخته می‌شود
- ✅ در `admin_permission.py` قابل استفاده است

### مزایا:
- ✅ فقط یک فایل
- ✅ بدون تکرار
- ✅ بدون کاهش سرعت (cache شده)
- ✅ بدون اشتباه

---

**آخرین به‌روزرسانی**: این مستند باید همیشه به‌روز باشد. هر تغییر در استراتژی باید در اینجا ثبت شود.

