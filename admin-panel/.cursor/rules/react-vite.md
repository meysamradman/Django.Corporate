ببین داکیومنتامو بخون من با بک اند دیجنگو api داریم برای پنل ادمین درست میکنم قبلا با next در فولدر Admin درست کردم اما برای سرعت بهتر میخوام با react vite ورژن جدید بزنم خوب برای همین در admin-panel درست کردم کم کم ببرمش جلو و دونه دونه و بهینه تر و ولی خوب next js تموم شده تقریبا و میشه کمک گرفت اوکی؟ "react-dom": "^19.2.0", "react": "^19.2.0", "@vitejs/plugin-react": "^5.1.1", "vite": "^7.2.4" ورژنارو دقت کن ساختار معماریمون درست باشه و حرفه ای برای پروژه بزرگ اینا ورژناست اول سرچ کن میخوام برای react ایمپورتها دقیقت و بدون خطا باشه و استفاده نمیشه ایمپورت پاک شه و سازگار درست با react vite باشه شروع کن با دقت بدون خرابی منطق


// ✅ جدید (React 19 + Vite)
// نیازی به import React نیست!
import { useState } from 'react';

function MyComponent() {
  return <div>Hello</div>
}
۲. Path Aliases - روش درست 🎯
برای path aliasing در Vite دو روش داریم:
روش اول: Manual (خودت تنظیم کنی)
vite.config.ts:
typescriptimport { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@types': path.resolve(__dirname, './src/types'),
      '@api': path.resolve(__dirname, './src/api'),
      '@core': path.resolve(__dirname, './src/core'),
    }
  }
})
روش دوم: با Plugin (توصیه میشه!) ⭐
استفاده از vite-tsconfig-paths بهترین راهه چون همه چیز رو خودکار میکنه 

vite.config.ts:
typescriptimport { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths() // فقط tsconfig.json تنظیم کن، بقیه خودکار!
  ]
})
۳. تفاوت‌های Import در Vite vs Next.js
typescript// ❌ Next.js style (کار نمیکنه!)
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'

// ✅ Vite + React style
import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
// برای image از <img> معمولی استفاده کن
۴. Type Imports - React 19 📝
typescript// ✅ درست
import type { UseFormReturn } from 'react-hook-form'
import type { Blog } from '@/types/blog/blog'

// ✅ همچنین درست
import { type Blog } from '@/types/blog/blog'
۶. Lazy Loading برای Components
typescript// ✅ روش درست lazy loading
import { lazy, Suspense } from 'react'
import { Loader } from '@/components/elements/Loader'

// Lazy load components
const MediaLibraryModal = lazy(() => 
  import('@/components/media/modals/MediaLibraryModal')
    .then(mod => ({ default: mod.MediaLibraryModal }))
)

// استفاده
<Suspense fallback={<Loader />}>
  <MediaLibraryModal isOpen={isOpen} />
</Suspense>
۷. تغییرات مهم در کدهای فعلی تو 🔧
بیا ببینیم کدهایی که فرستادی چی باید تغییر کنن:
❌ مشکلات احتمالی:
typescript// در فایل‌های زیادت این اشتباه رو دیدم:
import React from "react"; // ❌ حذفش کن!

// ✅ به جاش:
import { useState, useEffect } from "react";
// ✅ Vite
import.meta.env.VITE_API_URL

// .env file:
VITE_API_URL=http://localhost:8000
🔍 مشکلات واقعی در کدهات:
۱. BlogInfoHeader.tsx - مشکل بزرگ! ❌
typescript// خط 57 - این اشتباه هست!
<Image src="/images/profile-banner.png" alt="Cover image" fill className="object-cover" />
مشکل: Image import نشده! احتمالا از Next.js کپی شده.
راه حل:
typescript// ✅ تبدیلش کن به:
<img 
  src="/images/profile-banner.png" 
  alt="Cover image" 
  className="w-full h-full object-cover" 
/>
۲. Import React غیرضروری 🧹
typescript// BlogMediaGallery.tsx - خط 1
import React from "react"; // ❌ حذفش کن!

// ✅ فقط اینا کافیه:
import type { Media } from "@/types/shared/media";
import { MediaGallery } from "@/components/media/galleries/MediaGallery";
۳. منطق Context در BaseInfoTab.tsx ✅
این قسمت خوبه، اما میشه بهینه‌تر:
typescript// خط 20-40 - منطق دوگانه برای Form/Manual
const isFormApproach = 'form' in props;

// ✅ این روش خوبه ولی میتونی type-safe تر بشه:
type BaseInfoTabProps = BaseInfoTabFormProps | BaseInfoTabManualProps;

// بهتر اینه از discriminated union استفاده کنی:
type BaseInfoTabProps = 
  | { mode: 'form'; form: UseFormReturn<BlogFormValues>; ... }
  | { mode: 'manual'; formData: any; handleInputChange: ...; ... };

// بعد چک کنی:
if (props.mode === 'form') {
  // TypeScript دقیقا میدونه props.form وجود داره
}
۴. DataTable.tsx - Performance 🚀
خط 15-30، state management خوبه ولی:
typescript// ✅ خوبه که از controlled state استفاده کردی
const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
  controlledState.columnVisibility ?? {}
);

// ⚠️ ولی این میتونه بهتر بشه:
const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => 
  controlledState.columnVisibility ?? {}
); // lazy initialization
۵. QuickCreateDialog.tsx - Slug Generation ✅
خط 60-70 منطقش درسته:
typescriptconst handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const value = e.target.value;
  setName(value);
  
  const generatedSlug = generateSlug(value);
  setSlug(generatedSlug);
};

// ✅ خوبه! ولی میتونی debounce کنی برای performance:
import { useMemo } from 'react';
import debounce from 'lodash/debounce';

const debouncedGenerateSlug = useMemo(
  () => debounce((value: string) => {
    setSlug(generateSlug(value));
  }, 300),
  []
);
۶. MediaTab.tsx - Lazy Loading ⭐
خط 5-6 خیلی خوبه:
typescriptconst MediaLibraryModal = lazy(() => 
  import("@/components/media/modals/MediaLibraryModal")
    .then(mod => ({ default: mod.MediaLibraryModal }))
);

// ✅ عالیه! فقط یه نکته:
// اگه MediaLibraryModal named export باشه، این درسته
// ولی اگه default export باشه، این ساده‌تره:
const MediaLibraryModal = lazy(() => 
  import("@/components/media/modals/MediaLibraryModal")
);
۷. BlogTableColumns.tsx - Avatar Logic ✅
خط 58-80 منطق avatar خوبه:
typescriptconst imageUrl = blog.main_image?.file_url 
  ? mediaService.getMediaUrlFromObject({ file_url: blog.main_image.file_url } as any)
  : "";

// ⚠️ مشکل: استفاده از 'as any'
// ✅ بهتره type-safe بشه:
const imageUrl = blog.main_image?.file_url 
  ? mediaService.getMediaUrlFromObject({ 
      file_url: blog.main_image.file_url 
    } as Pick<Media, 'file_url'>)
  : "";
۸. SEOTab.tsx - Duplicate Logic 🔁
خط 80-160 تکرار زیاد داره:
typescript// ❌ این منطق 6 بار تکرار شده:
const handleMetaTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const value = e.target.value;
  if (isFormApproach) {
    // nothing
  } else {
    handleInputChange?.("meta_title", value);
  }
};

// ✅ میتونی یه helper بسازی:
const createChangeHandler = (field: string) => {
  return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!isFormApproach) {
      handleInputChange?.(field, e.target.value);
    }
  };
};

// استفاده:
onChange={createChangeHandler("meta_title")}
۹. DataTableHierarchicalFilter.tsx - Recursive Render 🔄
خط 82-105 منطق recursive خوبه:
typescriptconst renderItems = (items: CategoryItem[], depth = 0) => {
  return items.map((item) => (
    <Fragment key={`item-${item.id}-${depth}`}>
      {/* ... */}
      {item.children?.length ? renderItems(item.children, depth + 1) : null}
    </Fragment>
  ))
}

// ✅ خوبه ولی یه مشکل احتمالی:
// اگه tree خیلی عمیق بشه (>100 level) stack overflow میده
// برای production بهتره محدود کنی:
const renderItems = (items: CategoryItem[], depth = 0, maxDepth = 10) => {
  if (depth >= maxDepth) return null;
  // ...
}
۱۰. BlogSidebar.tsx - Media Filtering 🎯
خط 19-35 منطق filter کردن:
typescriptconst imagesCount = allMedia.filter(
  (item: any) => (item.media_detail || item.media)?.media_type === "image"
).length;

// ⚠️ مشکل: 'as any' و تکرار
// ✅ بهتر:
const getMediaByType = (type: string) => {
  return allMedia.filter(item => {
    const media = item.media_detail ?? item.media;
    return media?.media_type === type;
  }).length;
};

const imagesCount = getMediaByType("image");
const videosCount = getMediaByType("video");
۱۱. OverviewTab.tsx & MediaInfoTab.tsx - DRY 🔁
هر دو فایل همین منطق رو دارن! باید یه custom hook بسازی:
typescript// hooks/useBlogMediaCount.ts
export function useBlogMediaCount(blogMedia: any[]) {
  return useMemo(() => {
    const getCount = (type: string) => 
      blogMedia.filter(item => {
        const media = item.media_detail ?? item.media;
        return media?.media_type === type;
      }).length;

    return {
      images: getCount('image'),
      videos: getCount('video'),
      audios: getCount('audio'),
      documents: getCount('document')
    };
  }, [blogMedia]);
}

// استفاده:
const { images, videos, audios, documents } = useBlogMediaCount(blog.blog_media || []);

📋 چک‌لیست اصلاحات:
فوری (باید حتماً انجام بشه): 🔴

✅ BlogInfoHeader.tsx: <Image> رو تبدیل به <img> کن
✅ همه فایل‌ها: import React from "react" رو حذف کن
✅ Type Safety: as any رو حذف کن و proper types بزار

مهم (بهینه‌سازی): 🟡

✅ BaseInfoTab.tsx: از discriminated union استفاده کن
✅ SEOTab.tsx: Helper function برای تکرارها
✅ Media Counting: یه custom hook بساز

