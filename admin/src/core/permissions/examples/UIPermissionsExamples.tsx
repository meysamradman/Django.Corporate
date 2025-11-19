/**
 * 🚀 مثال‌های عملی استفاده از سیستم Permission بهینه شده
 * 
 * این فایل شامل مثال‌های واقعی برای نحوه استفاده از UI Permission flags است
 */

'use client';

import { useUIPermissions, ProtectedButton, usePermission } from '@/core/permissions';
import { Button } from '@/components/elements/Button';
import { Save, Upload, Trash2, Edit } from 'lucide-react';

// ═══════════════════════════════════════════════════════
// 1️⃣ Settings Apps - فقط Save button Protected
// ═══════════════════════════════════════════════════════

/**
 * مثال: AI Settings Component
 * ✅ فقط دکمه Save Protected هست
 * ❌ دکمه Edit/Add Provider عادی هست
 */
export function AISettingsExample() {
  const { canManageAI } = useUIPermissions();

  // ✅ استفاده از pre-computed flag برای conditional rendering
  if (!canManageAI) {
    return <div>شما دسترسی به این بخش ندارید</div>;
  }

  return (
    <div>
      {/* ❌ دکمه Edit عادی - بدون Protection */}
      <Button onClick={() => {}}>
        <Edit />
        ویرایش Provider
      </Button>

      {/* ✅ فقط Save Protected */}
      <ProtectedButton
        permission="ai.manage"
        onClick={() => {}}
        showDenyToast={true}
        denyMessage="دسترسی به مدیریت AI ندارید"
      >
        <Save />
        ذخیره
      </ProtectedButton>
    </div>
  );
}

/**
 * مثال: Forms Settings Component
 */
export function FormsSettingsExample() {
  const { canManageForms } = useUIPermissions();

  return (
    <div>
      {/* ❌ دکمه Create عادی */}
      <Button onClick={() => {}}>
        افزودن فیلد
      </Button>

      {/* ❌ دکمه Delete عادی */}
      <Button onClick={() => {}}>
        <Trash2 />
        حذف
      </Button>

      {/* ✅ فقط Save در Dialog Protected */}
      <ProtectedButton
        permission="forms.manage"
        onClick={() => {}}
      >
        <Save />
        ذخیره
      </ProtectedButton>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// 2️⃣ CRUD Apps - Create button + RouteGuard
// ═══════════════════════════════════════════════════════

/**
 * مثال: Blog List Component
 * ✅ Create button Protected
 * ✅ Save در فرم توسط RouteGuard چک میشه
 */
export function BlogListExample() {
  const { canCreateBlog } = useUIPermissions();

  return (
    <div>
      <h1>لیست مقالات</h1>

      {/* ✅ Create button Protected */}
      {canCreateBlog && (
        <Button onClick={() => window.location.href = '/blogs/create'}>
          ایجاد مقاله جدید
        </Button>
      )}

      {/* یا با ProtectedButton */}
      <ProtectedButton
        permission="blog.create"
        onClick={() => window.location.href = '/blogs/create'}
      >
        ایجاد مقاله
      </ProtectedButton>
    </div>
  );
}

/**
 * مثال: Blog Create/Edit Form
 * ❌ دکمه Save نیازی به ProtectedButton نداره
 * ✅ RouteGuard خودکار چک می‌کنه
 */
export function BlogFormExample() {
  return (
    <div>
      <h1>ایجاد مقاله جدید</h1>

      {/* ❌ عادی - RouteGuard خودش چک می‌کنه */}
      <Button onClick={() => {}}>
        <Save />
        ذخیره
      </Button>

      <Button onClick={() => {}}>
        ذخیره پیش‌نویس
      </Button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// 3️⃣ Media App - Context-aware Upload
// ═══════════════════════════════════════════════════════

/**
 * مثال: Media Library (مرکزی)
 * ✅ نیاز به media.upload
 */
export function MediaLibraryExample() {
  const { canUploadMedia, canDeleteMedia } = useUIPermissions();

  return (
    <div>
      {/* ✅ Upload button Protected */}
      {canUploadMedia && (
        <Button onClick={() => {}}>
          <Upload />
          آپلود رسانه
        </Button>
      )}

      {/* یا با ProtectedButton */}
      <ProtectedButton
        permission="media.upload"
        onClick={() => {}}
      >
        <Upload />
        آپلود
      </ProtectedButton>

      {/* ✅ Delete button Protected */}
      <ProtectedButton
        permission="media.delete"
        onClick={() => {}}
      >
        <Trash2 />
        حذف
      </ProtectedButton>
    </div>
  );
}

/**
 * مثال: Media Library Modal در Portfolio/Blog
 * ✅ Context-aware permission check
 */
export function MediaLibraryModalExample({ context }: { context: 'portfolio' | 'blog' | 'media_library' }) {
  const { canUploadInContext } = usePermission();
  const { canCreatePortfolio, canUpdatePortfolio } = useUIPermissions();

  // ✅ Context-aware check
  const canUpload = canUploadInContext(context);

  return (
    <div>
      {canUpload && (
        <Button onClick={() => {}}>
          <Upload />
          آپلود در {context}
        </Button>
      )}

      {/* توضیحات */}
      {context === 'media_library' && <p>نیاز به media.upload</p>}
      {context === 'portfolio' && <p>نیاز به portfolio.create یا portfolio.update</p>}
      {context === 'blog' && <p>نیاز به blog.create یا blog.update</p>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// 4️⃣ استفاده از Multiple Permissions
// ═══════════════════════════════════════════════════════

/**
 * مثال: Dashboard Component
 * نمایش کارت‌های مختلف بر اساس دسترسی‌ها
 */
export function DashboardExample() {
  const {
    canCreateBlog,
    canCreatePortfolio,
    canUploadMedia,
    canManageSettings,
    canManageAI,
  } = useUIPermissions();

  return (
    <div className="grid grid-cols-3 gap-4">
      {canCreateBlog && (
        <div className="card">
          <h3>مدیریت وبلاگ</h3>
          <Button>ایجاد مقاله</Button>
        </div>
      )}

      {canCreatePortfolio && (
        <div className="card">
          <h3>نمونه کارها</h3>
          <Button>افزودن نمونه کار</Button>
        </div>
      )}

      {canUploadMedia && (
        <div className="card">
          <h3>مدیا</h3>
          <Button>آپلود فایل</Button>
        </div>
      )}

      {canManageSettings && (
        <div className="card">
          <h3>تنظیمات</h3>
          <Button>مدیریت تنظیمات</Button>
        </div>
      )}

      {canManageAI && (
        <div className="card">
          <h3>هوش مصنوعی</h3>
          <Button>تنظیمات AI</Button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// 5️⃣ Performance Comparison
// ═══════════════════════════════════════════════════════

/**
 * ❌ روش قدیمی (کند)
 */
export function OldWayExample() {
  const { hasPermission } = usePermission();

  // ❌ محاسبه در هر رندر
  return (
    <div>
      {hasPermission('settings.manage') && <Button>Save</Button>}
      {hasPermission('media.upload') && <Button>Upload</Button>}
      {hasPermission('blog.create') && <Button>Create</Button>}
    </div>
  );
}

/**
 * ✅ روش جدید (سریع)
 */
export function NewWayExample() {
  const { canManageSettings, canUploadMedia, canCreateBlog } = useUIPermissions();

  // ✅ از قبل محاسبه شده - صفر overhead
  return (
    <div>
      {canManageSettings && <Button>Save</Button>}
      {canUploadMedia && <Button>Upload</Button>}
      {canCreateBlog && <Button>Create</Button>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// 6️⃣ Custom Hook برای Logic پیچیده
// ═══════════════════════════════════════════════════════

/**
 * مثال: Custom hook برای Portfolio permissions
 */
export function usePortfolioPermissions() {
  const { canCreatePortfolio, canUpdatePortfolio, canDeletePortfolio } = useUIPermissions();

  return {
    canCreate: canCreatePortfolio,
    canEdit: canUpdatePortfolio,
    canDelete: canDeletePortfolio,
    hasAnyAccess: canCreatePortfolio || canUpdatePortfolio || canDeletePortfolio,
    hasFullAccess: canCreatePortfolio && canUpdatePortfolio && canDeletePortfolio,
  };
}

/**
 * استفاده از Custom Hook
 */
export function PortfolioPageExample() {
  const { canCreate, canEdit, hasAnyAccess } = usePortfolioPermissions();

  if (!hasAnyAccess) {
    return <div>دسترسی ندارید</div>;
  }

  return (
    <div>
      {canCreate && <Button>ایجاد نمونه کار</Button>}
      {canEdit && <Button>ویرایش</Button>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// 7️⃣ Conditional UI بر اساس چند Permission
// ═══════════════════════════════════════════════════════

/**
 * مثال: Sidebar Menu Item
 */
export function SidebarMenuItemExample() {
  const {
    canCreateBlog,
    canUpdateBlog,
    canDeleteBlog,
  } = useUIPermissions();

  const hasAnyBlogAccess = canCreateBlog || canUpdateBlog || canDeleteBlog;

  if (!hasAnyBlogAccess) {
    return null; // مخفی کردن منو
  }

  return (
    <div className="menu-item">
      <span>وبلاگ</span>
      {!canCreateBlog && <span className="badge">فقط مشاهده</span>}
    </div>
  );
}
