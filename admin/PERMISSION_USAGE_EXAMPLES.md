# 🔐 راهنمای استفاده از Permission System در Frontend

این فایل نمونه‌های عملی برای استفاده از سیستم Permission در پنل ادمین را نشان می‌دهد.

---

## 📋 فهرست مطالب

1. [استفاده از Pre-computed UI Flags](#1-استفاده-از-pre-computed-ui-flags)
2. [Permission Check برای Media (Granular)](#2-permission-check-برای-media-granular)
3. [Permission Check برای Statistics (Granular)](#3-permission-check-برای-statistics-granular)
4. [استفاده از ProtectedButton](#4-استفاده-از-protectedbutton)
5. [استفاده از PermissionGate](#5-استفاده-از-permissiongate)
6. [Context-Aware Media Upload](#6-context-aware-media-upload)

---

## 1. استفاده از Pre-computed UI Flags

### ✅ سریع‌ترین روش (Zero overhead)

```tsx
'use client';

import { useUIPermissions } from '@/core/permissions';

export function MediaUploadButton() {
  // 🔥 O(1) - Pre-computed, no runtime check
  const { canUploadMedia, canUploadImage, canUploadVideo } = useUIPermissions();
  
  if (!canUploadMedia) {
    return <p>شما دسترسی آپلود ندارید</p>;
  }

  return (
    <div>
      <button>آپلود کلی</button>
      {canUploadImage && <button>آپلود عکس</button>}
      {canUploadVideo && <button>آپلود ویدیو</button>}
    </div>
  );
}
```

### با Shorthand Hooks:

```tsx
'use client';

import { 
  useCanUploadImage, 
  useCanUploadVideo,
  useCanViewUsersStats,
  useCanViewAdminsStats 
} from '@/core/permissions';

export function QuickCheck() {
  const canUploadImage = useCanUploadImage();
  const canUploadVideo = useCanUploadVideo();
  const canViewUsers = useCanViewUsersStats();
  const canViewAdmins = useCanViewAdminsStats();
  
  return (
    <div>
      {canUploadImage && <ImageUploader />}
      {canUploadVideo && <VideoUploader />}
      {canViewUsers && <UserStatistics />}
      {canViewAdmins && <AdminStatistics />}
    </div>
  );
}
```

---

## 2. Permission Check برای Media (Granular)

### بررسی دسترسی برای هر نوع Media:

```tsx
'use client';

import { useUIPermissions } from '@/core/permissions';
import { ProtectedButton } from '@/core/permissions';

export function MediaActionButtons({ mediaType }: { mediaType: 'image' | 'video' | 'audio' | 'document' }) {
  const {
    canUploadImage,
    canUploadVideo,
    canUploadAudio,
    canUploadDocument,
    canDeleteImage,
    canDeleteVideo,
    canDeleteAudio,
    canDeleteDocument,
    canUpdateImage,
    canUpdateVideo,
  } = useUIPermissions();
  
  // نمایش دکمه‌های مختلف بر اساس نوع فایل
  return (
    <div className="flex gap-2">
      {/* Upload Buttons */}
      {mediaType === 'image' && canUploadImage && (
        <button>آپلود عکس</button>
      )}
      {mediaType === 'video' && canUploadVideo && (
        <button>آپلود ویدیو</button>
      )}
      {mediaType === 'audio' && canUploadAudio && (
        <button>آپلود صوت</button>
      )}
      {mediaType === 'document' && canUploadDocument && (
        <button>آپلود سند</button>
      )}
      
      {/* Edit Buttons */}
      {mediaType === 'image' && canUpdateImage && (
        <button>ویرایش عکس</button>
      )}
      
      {/* Delete Buttons */}
      {mediaType === 'image' && canDeleteImage && (
        <button>حذف عکس</button>
      )}
      {mediaType === 'video' && canDeleteVideo && (
        <button>حذف ویدیو</button>
      )}
    </div>
  );
}
```

### با استفاده از ProtectedButton (توصیه می‌شود):

```tsx
'use client';

import { ProtectedButton } from '@/core/permissions';

export function TypedMediaUploader() {
  return (
    <div className="grid grid-cols-4 gap-4">
      {/* Upload Image */}
      <ProtectedButton 
        permission="media.image.upload"
        showDenyToast
        denyMessage="شما دسترسی آپلود عکس ندارید"
        onClick={() => handleImageUpload()}
      >
        آپلود عکس
      </ProtectedButton>
      
      {/* Upload Video */}
      <ProtectedButton 
        permission="media.video.upload"
        showDenyToast
        onClick={() => handleVideoUpload()}
      >
        آپلود ویدیو
      </ProtectedButton>
      
      {/* Upload Audio */}
      <ProtectedButton 
        permission="media.audio.upload"
        showDenyToast
        onClick={() => handleAudioUpload()}
      >
        آپلود صوت
      </ProtectedButton>
      
      {/* Upload Document */}
      <ProtectedButton 
        permission="media.document.upload"
        showDenyToast
        onClick={() => handleDocumentUpload()}
      >
        آپلود سند
      </ProtectedButton>
    </div>
  );
}
```

---

## 3. Permission Check برای Statistics (Granular)

### نمایش آمار بر اساس سطح دسترسی:

```tsx
'use client';

import { useUIPermissions } from '@/core/permissions';
import { PermissionGate } from '@/core/permissions';

export function StatisticsPage() {
  const {
    canViewDashboardStats,
    canViewUsersStats,
    canViewAdminsStats,
    canViewContentStats,
    canExportStats,
  } = useUIPermissions();
  
  return (
    <div className="space-y-6">
      {/* Dashboard Overview - همه ادمین‌ها */}
      {canViewDashboardStats && (
        <section>
          <h2>نمای کلی داشبورد</h2>
          <DashboardOverview />
        </section>
      )}
      
      {/* User Statistics - حساس */}
      {canViewUsersStats && (
        <section>
          <h2>آمار کاربران (حساس)</h2>
          <UserStatistics />
        </section>
      )}
      
      {/* Admin Statistics - خیلی حساس */}
      {canViewAdminsStats && (
        <section>
          <h2>آمار ادمین‌ها (خیلی حساس)</h2>
          <AdminStatistics />
        </section>
      )}
      
      {/* Content Statistics */}
      {canViewContentStats && (
        <section>
          <h2>آمار محتوا</h2>
          <ContentStatistics />
        </section>
      )}
      
      {/* Export Button */}
      {canExportStats && (
        <button onClick={handleExport}>
          خروجی Excel
        </button>
      )}
    </div>
  );
}
```

### با PermissionGate (Clean & Declarative):

```tsx
'use client';

import { PermissionGate } from '@/core/permissions';

export function StatisticsDashboard() {
  return (
    <div className="space-y-6">
      {/* Dashboard Stats - Available to all admins */}
      <PermissionGate permission="statistics.dashboard.read">
        <DashboardOverview />
      </PermissionGate>
      
      {/* Users Stats - Sensitive */}
      <PermissionGate 
        permission="statistics.users.read"
        fallback={<p>شما دسترسی به آمار کاربران ندارید</p>}
      >
        <UserStatistics />
      </PermissionGate>
      
      {/* Admins Stats - Highly Sensitive */}
      <PermissionGate 
        permission="statistics.admins.read"
        fallback={<p>شما دسترسی به آمار ادمین‌ها ندارید</p>}
      >
        <AdminStatistics />
      </PermissionGate>
      
      {/* Content Stats */}
      <PermissionGate permission="statistics.content.read">
        <ContentStatistics />
      </PermissionGate>
      
      {/* Export - Multiple permissions (requireAll) */}
      <PermissionGate 
        permission={['statistics.users.read', 'statistics.export']}
        requireAll
      >
        <ExportButton />
      </PermissionGate>
    </div>
  );
}
```

---

## 4. استفاده از ProtectedButton

### مثال کامل با تمام ویژگی‌ها:

```tsx
'use client';

import { ProtectedButton } from '@/core/permissions';

export function MediaActions() {
  return (
    <div className="flex gap-3">
      {/* Single Permission */}
      <ProtectedButton 
        permission="media.upload"
        onClick={handleUpload}
        showDenyToast
        denyMessage="شما دسترسی آپلود ندارید"
      >
        آپلود
      </ProtectedButton>
      
      {/* Multiple Permissions (ANY) */}
      <ProtectedButton 
        permission={['media.update', 'media.manage']}
        requireAll={false}
        onClick={handleEdit}
      >
        ویرایش
      </ProtectedButton>
      
      {/* Multiple Permissions (ALL) */}
      <ProtectedButton 
        permission={['media.delete', 'media.manage']}
        requireAll={true}
        onClick={handleDelete}
        variant="destructive"
      >
        حذف
      </ProtectedButton>
      
      {/* Granular Type-Specific Permission */}
      <ProtectedButton 
        permission="media.image.upload"
        onClick={handleImageUpload}
      >
        آپلود عکس
      </ProtectedButton>
    </div>
  );
}
```

---

## 5. استفاده از PermissionGate

### Conditional Rendering بر اساس Permission:

```tsx
'use client';

import { PermissionGate } from '@/core/permissions';

export function MediaLibrary() {
  return (
    <div>
      {/* Show upload section only if user has permission */}
      <PermissionGate permission="media.upload">
        <UploadSection />
      </PermissionGate>
      
      {/* Show admin tools only for admins with manage permission */}
      <PermissionGate 
        permission="media.manage"
        fallback={<p>شما دسترسی به ابزارهای مدیریتی ندارید</p>}
      >
        <AdminTools />
      </PermissionGate>
      
      {/* Multiple permissions - show if user has ANY */}
      <PermissionGate 
        permission={['media.upload', 'media.update', 'media.delete']}
        requireAll={false}
      >
        <MediaActions />
      </PermissionGate>
      
      {/* Multiple permissions - show only if user has ALL */}
      <PermissionGate 
        permission={['statistics.users.read', 'statistics.export']}
        requireAll={true}
      >
        <ExportUserStats />
      </PermissionGate>
    </div>
  );
}
```

---

## 6. Context-Aware Media Upload

### استفاده صحیح از canUploadInContext:

```tsx
'use client';

import { usePermission } from '@/core/permissions';

export function MediaUploadModal({ context }: { context: 'media_library' | 'portfolio' | 'blog' }) {
  const { canUploadInContext } = usePermission();
  
  const canUpload = canUploadInContext(context);
  
  if (!canUpload) {
    return (
      <div>
        <p>شما در این بخش دسترسی آپلود ندارید</p>
        {context === 'media_library' && (
          <p className="text-sm text-muted">
            برای آپلود در کتابخانه مرکزی، نیاز به یکی از این دسترسی‌ها دارید:
            media.upload، media.image.upload، media.video.upload، و غیره
          </p>
        )}
        {context === 'portfolio' && (
          <p className="text-sm text-muted">
            برای آپلود در نمونه‌کار، نیاز به دسترسی portfolio.create یا portfolio.update دارید
          </p>
        )}
        {context === 'blog' && (
          <p className="text-sm text-muted">
            برای آپلود در بلاگ، نیاز به دسترسی blog.create یا blog.update دارید
          </p>
        )}
      </div>
    );
  }
  
  return <MediaUploadForm />;
}
```

---

## 🎯 بهترین روش‌ها (Best Practices)

### ✅ **DO:**

1. **استفاده از Pre-computed UI Flags:**
   ```tsx
   const { canUploadMedia } = useUIPermissions(); // ✅ سریع
   ```

2. **استفاده از ProtectedButton برای دکمه‌ها:**
   ```tsx
   <ProtectedButton permission="media.upload" onClick={...}> // ✅
   ```

3. **استفاده از PermissionGate برای Sections:**
   ```tsx
   <PermissionGate permission="statistics.users.read"> // ✅
   ```

4. **استفاده از Granular Permissions:**
   ```tsx
   permission="media.image.upload" // ✅ دقیق و امن
   ```

### ❌ **DON'T:**

1. **استفاده مستقیم از hasPermission در render:**
   ```tsx
   const { hasPermission } = usePermission();
   if (hasPermission('media.upload')) { ... } // ❌ کند
   ```

2. **چک کردن permission در هر render:**
   ```tsx
   // ❌ این کد در هر render دوباره محاسبه می‌شه
   {permissionMap?.user_permissions.includes('media.upload') && <Button />}
   ```

3. **استفاده از Module-level permissions:**
   ```tsx
   permission="media" // ❌ نادرست - باید action داشته باشه
   permission="media.upload" // ✅ درست
   ```

---

## 📊 Performance Tips

### 🔥 سریع‌ترین روش:

```tsx
// ✅ O(1) - Pre-computed
const { canUploadMedia } = useUIPermissions();
```

### ⚡ روش متوسط:

```tsx
// ✅ O(1) Set lookup - خیلی سریع
const { hasPermission } = usePermission();
const canUpload = hasPermission('media.upload');
```

### 🐌 روش کند (اجتناب کنید):

```tsx
// ❌ O(n) array.includes - کند
const canUpload = permissionMap?.user_permissions.includes('media.upload');
```

---

## 🔐 Security Notes

1. **همیشه از Granular Permissions استفاده کنید:**
   - `media.image.upload` > `media.upload` ✅
   - `statistics.users.read` > `statistics.read` ✅

2. **برای عملیات حساس، Multiple permissions چک کنید:**
   ```tsx
   <ProtectedButton 
     permission={['statistics.admins.read', 'statistics.export']}
     requireAll={true}
   >
     خروجی آمار ادمین‌ها
   </ProtectedButton>
   ```

3. **Context-aware checks برای Media uploads:**
   ```tsx
   const canUpload = canUploadInContext(context); // ✅
   ```

---

## 📚 مثال‌های واقعی

### Media Page:

```tsx
'use client';

import { useUIPermissions, ProtectedButton } from '@/core/permissions';

export function MediaPage() {
  const {
    canReadMedia,
    canUploadMedia,
    canDeleteMedia,
    canUploadImage,
    canUploadVideo,
  } = useUIPermissions();
  
  if (!canReadMedia) {
    return <AccessDenied />;
  }
  
  return (
    <div>
      <div className="actions">
        <ProtectedButton permission="media.upload">
          آپلود کلی
        </ProtectedButton>
        
        <ProtectedButton permission="media.image.upload">
          آپلود عکس
        </ProtectedButton>
        
        <ProtectedButton permission="media.video.upload">
          آپلود ویدیو
        </ProtectedButton>
        
        <ProtectedButton 
          permission="media.delete"
          variant="destructive"
        >
          حذف انتخاب شده‌ها
        </ProtectedButton>
      </div>
      
      <MediaLibrary />
    </div>
  );
}
```

### Statistics Page:

```tsx
'use client';

import { PermissionGate, ProtectedButton } from '@/core/permissions';

export function StatisticsPage() {
  return (
    <div className="space-y-6">
      {/* همه ادمین‌ها می‌تونند ببینند */}
      <PermissionGate permission="statistics.dashboard.read">
        <DashboardStats />
      </PermissionGate>
      
      {/* فقط با دسترسی خاص */}
      <PermissionGate permission="statistics.users.read">
        <UserStats />
        
        <ProtectedButton 
          permission={['statistics.users.read', 'statistics.export']}
          requireAll
        >
          خروجی آمار کاربران
        </ProtectedButton>
      </PermissionGate>
      
      {/* خیلی حساس */}
      <PermissionGate 
        permission="statistics.admins.read"
        fallback={<SensitiveDataDenied />}
      >
        <AdminStats />
      </PermissionGate>
    </div>
  );
}
```

---

**نکته مهم:** تمام permission checks از Context استفاده می‌کنند که **5 دقیقه cache** دارد، پس performance عالی است! 🚀
