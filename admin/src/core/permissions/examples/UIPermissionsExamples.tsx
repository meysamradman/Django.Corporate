'use client';

import { useUIPermissions, ProtectedButton, usePermission } from '@/core/permissions';
import { Button } from '@/components/elements/Button';
import { Save, Upload, Trash2, Edit } from 'lucide-react';

export function AISettingsExample() {
  const { canManageAI } = useUIPermissions();

  if (!canManageAI) {
    return <div>شما دسترسی به این بخش ندارید</div>;
  }

  return (
    <div>
      <Button onClick={() => {}}>
        <Edit />
        ویرایش Provider
      </Button>

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

export function FormsSettingsExample() {
  const { canManageForms } = useUIPermissions();

  return (
    <div>
      <Button onClick={() => {}}>
        افزودن فیلد
      </Button>

      <Button onClick={() => {}}>
        <Trash2 />
        حذف
      </Button>

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

export function BlogListExample() {
  const { canCreateBlog } = useUIPermissions();

  return (
    <div>
      <h1>لیست مقالات</h1>

      {canCreateBlog && (
        <Button onClick={() => window.location.href = '/blogs/create'}>
          ایجاد مقاله جدید
        </Button>
      )}

      <ProtectedButton
        permission="blog.create"
        onClick={() => window.location.href = '/blogs/create'}
      >
        ایجاد مقاله
      </ProtectedButton>
    </div>
  );
}

export function BlogFormExample() {
  return (
    <div>
      <h1>ایجاد مقاله جدید</h1>

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

export function MediaLibraryExample() {
  const { canUploadMedia, canDeleteMedia } = useUIPermissions();

  return (
    <div>
      {canUploadMedia && (
        <Button onClick={() => {}}>
          <Upload />
          آپلود رسانه
        </Button>
      )}

      <ProtectedButton
        permission="media.upload"
        onClick={() => {}}
      >
        <Upload />
        آپلود
      </ProtectedButton>

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

export function MediaLibraryModalExample({ context }: { context: 'portfolio' | 'blog' | 'media_library' }) {
  const { canUploadInContext } = usePermission();
  const { canCreatePortfolio, canUpdatePortfolio } = useUIPermissions();

  const canUpload = canUploadInContext(context);

  return (
    <div>
      {canUpload && (
        <Button onClick={() => {}}>
          <Upload />
          آپلود در {context}
        </Button>
      )}

      {context === 'media_library' && <p>نیاز به media.upload</p>}
      {context === 'portfolio' && <p>نیاز به portfolio.create یا portfolio.update</p>}
      {context === 'blog' && <p>نیاز به blog.create یا blog.update</p>}
    </div>
  );
}

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

export function OldWayExample() {
  const { hasPermission } = usePermission();

  return (
    <div>
      {hasPermission('settings.manage') && <Button>Save</Button>}
      {hasPermission('media.upload') && <Button>Upload</Button>}
      {hasPermission('blog.create') && <Button>Create</Button>}
    </div>
  );
}

export function NewWayExample() {
  const { canManageSettings, canUploadMedia, canCreateBlog } = useUIPermissions();

  return (
    <div>
      {canManageSettings && <Button>Save</Button>}
      {canUploadMedia && <Button>Upload</Button>}
      {canCreateBlog && <Button>Create</Button>}
    </div>
  );
}
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

export function SidebarMenuItemExample() {
  const {
    canCreateBlog,
    canUpdateBlog,
    canDeleteBlog,
  } = useUIPermissions();

  const hasAnyBlogAccess = canCreateBlog || canUpdateBlog || canDeleteBlog;

  if (!hasAnyBlogAccess) {
    return null;
  }

  return (
    <div className="menu-item">
      <span>وبلاگ</span>
      {!canCreateBlog && <span className="badge">فقط مشاهده</span>}
    </div>
  );
}
