---
trigger: manual
---
# 🚀 راهنمای جامع Dynamic Import - Next.js 15 پنل ادمین (2025)

> **مخصوص پنل ادمین با Django Backend + Next.js 15 App Router**  
> **هدف**: سرعت بالا | CSR فقط | SEO غیر مهم | Bundle Size بسیار مهم

### الگو 3: Rich Text Editor

```tsx
// src/components/example/ContentTab.tsx
"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/elements/Skeleton";

const EditorSkeleton = () => (
  <div className="border rounded-lg overflow-hidden">
    <div className="border-b bg-gray-50 p-2">
      <Skeleton className="h-8 w-full" />
    </div>
    <div className="p-4 min-h-[400px]">
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  </div>
);

const TipTapEditor = dynamic(
  () => import("@/components/forms/TipTapEditor"),
  { 
    ssr: false,
    loading: () => <EditorSkeleton />
  }
);

export default function ContentTab() {
  return (
    <div>
      <TipTapEditor onChange={(html) => console.log(html)} />
    </div>
  );
}
```

---

## 📝 نکات مهم Next.js 15 (2025)

### 1. همیشه `"use client"` در بالای فایل

```tsx
// ✅ درست - الزامی در Next.js 15
"use client";

import dynamic from "next/dynamic";

const Modal = dynamic(() => import("./Modal"), { ssr: false });
```

**چرا؟** Dynamic Import با `ssr: false` فقط در Client Components کار می‌کند!

---

### 2. همیشه Loading State تعریف کنید

```tsx
// ❌ اشتباه - بدون loading state
const Modal = dynamic(() => import("./Modal"), { ssr: false });

// ✅ درست - با loading state
const Modal = dynamic(
  () => import("./Modal"),
  { 
    ssr: false,
    loading: () => <Loader />
  }
);
```

**چرا؟** بدون loading state، صفحه خالی می‌ماند و UX بد می‌شود!

---

### 3. استفاده از Skeleton به جای Loader (بهتر)

```tsx
// ⚠️ قابل قبول - Loader ساده
loading: () => <Loader />

// ✅ بهتر - Skeleton شبیه UI واقعی
loading: () => <TabSkeleton />
```

**چرا؟** Skeleton تجربه کاربری بهتری می‌دهد (Skeleton Screen Pattern)!

---

### 4. Default Export برای Dynamic Import

```tsx
// ❌ پیچیده - Named Export
const Modal = dynamic(
  () => import("./Modal").then(mod => ({ default: mod.Modal })),
  { ssr: false }
);

// ✅ ساده‌تر - Default Export
// در فایل Modal.tsx:
export default function Modal() { ... }

// در فایل استفاده‌کننده:
const Modal = dynamic(() => import("./Modal"), { ssr: false });
```

**چرا؟** Default Export خیلی ساده‌تر و خواناتر است!

---

### 5. Conditional Rendering برای Modal

```tsx
// ❌ اشتباه - Modal همیشه render میشه
<Modal isOpen={isOpen} />

// ✅ درست - Modal فقط با state render میشه
{isOpen && <Modal isOpen={isOpen} />}
```

**چرا؟** اگر همیشه render شود، Dynamic Import بیخودی است!

---

## ✅ Checklist پیاده‌سازی

### فاز 1 (این هفته): Modal Components
- [ ] `src/app/(dashboard)/media/page.tsx`
  - [ ] MediaLibraryModal
  - [ ] MediaDetailsModal
  - [ ] MediaUploadModal
- [ ] `src/app/(dashboard)/blogs/create/page.tsx`
  - [ ] BlogPreviewModal
- [ ] `src/app/(dashboard)/portfolios/create/page.tsx`
  - [ ] PortfolioPreviewModal

**زمان:** 2-3 ساعت  
**تاثیر:** ~70KB کاهش

---

### فاز 2 (هفته آینده): Tab-based Pages
- [ ] `src/app/(dashboard)/blogs/create/page.tsx`
  - [ ] BaseInfoTab
  - [ ] ContentTab
  - [ ] MediaTab
  - [ ] SEOTab
- [ ] `src/app/(dashboard)/portfolios/create/page.tsx`
  - [ ] BaseInfoTab
  - [ ] ContentTab
  - [ ] MediaTab
  - [ ] SEOTab
- [ ] `src/app/(dashboard)/users/[id]/edit/page.tsx`
  - [ ] ProfileTab
  - [ ] SecurityTab
  - [ ] PermissionsTab

**زمان:** 4-5 ساعت  
**تاثیر:** ~300KB کاهش

---

### فاز 3 (ماه آینده): Editor & AI
- [ ] TipTap Editor در ContentTab
- [ ] `src/app/(dashboard)/ai/image/page.tsx`
  - [ ] AIImageGenerator
- [ ] `src/app/(dashboard)/ai/chat/page.tsx`
  - [ ] AIChatbot
- [ ] `src/app/(dashboard)/ai/content/page.tsx`
  - [ ] AIContentGenerator

**زمان:** 3-4 ساعت  
**تاثیر:** ~200KB کاهش

---

### فاز 4 (در صورت نیاز): Charts
- [ ] `src/app/(dashboard)/page.tsx`
  - [ ] StatisticsChart
  - [ ] RevenueChart

**زمان:** 1-2 ساعت  
**تاثیر:** ~60KB کاهش

---

## 🧪 تست و بررسی Performance

### 1. تست Local Development

```bash
# 1. شروع dev server
npm run dev

# 2. باز کردن Chrome DevTools
# Network > Disable Cache > Throttling: Fast 3G

# 3. تست Modal
# - کلیک روی دکمه Modal
# - بررسی Network tab: آیا Modal جداگانه لود شد؟

# 4. تست Tab
# - کلیک روی تب‌های مختلف
# - بررسی Network tab: آیا هر تب جداگانه لود شد؟
```

---

### 2. تست Production Build

```bash
# 1. Build production
npm run build

# 2. بررسی Bundle Size
# در Console باید چیزی شبیه این ببینید:
# Route (app)                                Size     First Load JS
# ├ ƒ /                                      145 kB          220 kB
# ├ ƒ /blogs/create                          35 kB           110 kB  ← کاهش یافته!
# ├ ○ /blogs/[id]/edit                       35 kB           110 kB  ← کاهش یافته!

# 3. اجرای production
npm run start

# 4. تست با Lighthouse
# Chrome DevTools > Lighthouse > Run
```

---

### 3. Bundle Analyzer (پیشنهادی)

```bash
# 1. نصب bundle analyzer
npm install --save-dev @next/bundle-analyzer

# 2. اضافه کردن به next.config.js
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  // ... سایر تنظیمات
});

# 3. اجرا و بررسی
ANALYZE=true npm run build

# 4. مقایسه قبل و بعد
# - قبل: Modal در Initial Bundle
# - بعد: Modal در Chunk جداگانه
```

---

### 4. Lighthouse Performance Metrics

**اهداف برای پنل ادمین:**
- Performance Score: 90+ ✅
- First Contentful Paint (FCP): <1s ✅
- Time to Interactive (TTI): <2s ✅
- Total Blocking Time (TBT): <200ms ✅

---

## 🚀 خلاصه نهایی

### ✅ استفاده کنید (با `ssr: false`):
1. **Modal Components** (اولویت 1) - ~24KB per Modal
2. **Tab Components** (اولویت 2) - ~40KB per Tab
3. **TipTap Editor** (اولویت 3) - ~80-120KB
4. **AI Components** (اولویت 4) - ~40-80KB per Component
5. **Charts** (اولویت 5) - ~40-60KB

**جمع کاهش:** ~400-600KB

---

### ❌ استفاده نکنید:
1. **Small Components** (<10KB) - Button, Input, Card, Badge
2. **Layout Components** - Header, Sidebar, Footer
3. **Provider Components** - QueryProvider, ThemeProvider
4. **DataTable** - فقط 10-15KB + critical path
5. **صفحات لیست ساده** - بدون تب

---

### 🎯 قانون ساده:

```
Modal + Tab + Editor + AI + Chart = Dynamic Import با ssr: false ✅
همه چیز دیگر = Import معمولی ✅
```

---

### 📊 نتیجه نهایی:

| معیار | قبل | بعد | بهبود |
|-------|-----|-----|-------|
| **Initial Bundle** | 650KB | 220KB | **66% ↓** |
| **Time to Interactive** | 4.2s | 1.9s | **55% ↓** |
| **First Contentful Paint** | 1.5s | 0.9s | **40% ↓** |
| **Lighthouse Score** | 58 | 92 | **+34 امتیاز** |

---

## 🔗 منابع مفید

### داکیومنت رسمی Next.js:
- [Dynamic Import](https://nextjs.org/docs/app/building-your-application/optimizing/lazy-loading)
- [Code Splitting](https://nextjs.org/docs/app/building-your-application/optimizing/bundle-analyzer)

### ابزارهای Performance:
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [Bundle Analyzer](https://www.npmjs.com/package/@next/bundle-analyzer)
- [webpack-bundle-analyzer](https://www.npmjs.com/package/webpack-bundle-analyzer)

---

**تاریخ:** 2025-12-10  
**Next.js:** 15.x App Router  
**Backend:** Django REST Framework  
**هدف:** CSR فقط | سرعت بالا | SEO غیر مهم  
**وضعیت:** ✅ آماده استفاده در Production

---

## 🎨 مورد ویژه: مدیا مرکزی (Global Media Library Modal)

### مشخصات Media Library شما:

```
✅ Popup/Modal است
✅ در همه صفحات استفاده می‌شود (blogs, portfolios, users, etc.)
✅ سنگین است (~40-80KB) - شامل: Image Preview, Upload, Filters, Pagination
✅ فقط با کلیک کاربر باز می‌شود
```

### ❌ راه حل اشتباه (که نباید استفاده کنید):

```tsx
// ❌ اشتباه 1: Import معمولی در همه صفحات
// src/app/(dashboard)/blogs/create/page.tsx
import { MediaLibraryModal } from "@/components/media/MediaLibraryModal";

export default function BlogCreatePage() {
  return (
    <div>
      {/* Modal در Initial Bundle تمام صفحات! */}
      <MediaLibraryModal />
    </div>
  );
}
```

**مشکل:** Modal در Initial Bundle تمام صفحات قرار می‌گیرد = 40-80KB اضافه در هر صفحه!

---

### ✅ راه حل درست: Global State + Dynamic Import

بهترین روش برای Media Library که در همه جا استفاده می‌شود:

#### مرحله 1: ایجاد Global State (Zustand یا Context)

```tsx
// src/stores/useMediaStore.ts
"use client";

import { create } from "zustand";

interface MediaItem {
  id: string;
  url: string;
  title: string;
  type: "image" | "video" | "document";
}

interface MediaStoreState {
  // State
  isOpen: boolean;
  selectedMedia: MediaItem | null;
  mode: "select" | "upload" | "view";
  
  // Callback برای برگشت media انتخاب شده
  onSelectCallback: ((media: MediaItem) => void) | null;
  
  // Actions
  openMediaLibrary: (onSelect?: (media: MediaItem) => void) => void;
  closeMediaLibrary: () => void;
  selectMedia: (media: MediaItem) => void;
  setMode: (mode: "select" | "upload" | "view") => void;
}

export const useMediaStore = create<MediaStoreState>((set, get) => ({
  // Initial State
  isOpen: false,
  selectedMedia: null,
  mode: "select",
  onSelectCallback: null,
  
  // باز کردن Modal
  openMediaLibrary: (onSelect) => {
    set({ 
      isOpen: true, 
      mode: "select",
      onSelectCallback: onSelect || null 
    });
  },
  
  // بستن Modal
  closeMediaLibrary: () => {
    set({ 
      isOpen: false, 
      selectedMedia: null,
      onSelectCallback: null 
    });
  },
  
  // انتخاب Media
  selectMedia: (media) => {
    const { onSelectCallback, closeMediaLibrary } = get();
    
    set({ selectedMedia: media });
    
    // اگر callback داشته باشیم، فراخوانی و بستن Modal
    if (onSelectCallback) {
      onSelectCallback(media);
      closeMediaLibrary();
    }
  },
  
  // تغییر حالت
  setMode: (mode) => set({ mode }),
}));
```

---

#### مرحله 2: ایجاد Global Modal Provider

```tsx
// src/components/providers/MediaLibraryProvider.tsx
"use client";

import dynamic from "next/dynamic";
import { useMediaStore } from "@/stores/useMediaStore";
import { Loader } from "@/components/elements/Loader";

// ✅ Dynamic Import با ssr: false
const MediaLibraryModal = dynamic(
  () => import("@/components/media/MediaLibraryModal"),
  { 
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-lg p-8">
          <Loader size="lg" text="در حال بارگذاری کتابخانه رسانه..." />
        </div>
      </div>
    )
  }
);

export default function MediaLibraryProvider() {
  const isOpen = useMediaStore((state) => state.isOpen);
  
  // ✅ فقط وقتی Modal باز است render میشه
  if (!isOpen) return null;
  
  return <MediaLibraryModal />;
}
```

---

#### مرحله 3: اضافه کردن Provider به Root Layout

```tsx
// src/app/(dashboard)/layout.tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import MediaLibraryProvider from "@/components/providers/MediaLibraryProvider";

const queryClient = new QueryClient();

export default function DashboardLayout({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1">
          <Header />
          {children}
        </main>
      </div>
      
      {/* ✅ Global Media Library Modal */}
      <MediaLibraryProvider />
    </QueryClientProvider>
  );
}
```

---

#### مرحله 4: استفاده در صفحات مختلف

```tsx
// src/app/(dashboard)/blogs/create/page.tsx
"use client";

import { useState } from "react";
import { useMediaStore } from "@/stores/useMediaStore";
import { Button } from "@/components/elements/Button";
import { Image as ImageIcon } from "lucide-react";

export default function BlogCreatePage() {
  const [featuredImage, setFeaturedImage] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]);
  
  const openMediaLibrary = useMediaStore((state) => state.openMediaLibrary);
  
  return (
    <div className="space-y-6">
      {/* Featured Image */}
      <div>
        <label className="block text-sm font-medium mb-2">
          تصویر شاخص
        </label>
        
        {featuredImage ? (
          <div className="relative">
            <img 
              src={featuredImage.url} 
              alt={featuredImage.title}
              className="w-full h-48 object-cover rounded-lg"
            />
            <Button 
              size="sm"
              onClick={() => {
                // ✅ باز کردن Modal با callback
                openMediaLibrary((media) => {
                  setFeaturedImage(media);
                });
              }}
            >
              تغییر تصویر
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            className="w-full h-48"
            onClick={() => {
              // ✅ باز کردن Modal با callback
              openMediaLibrary((media) => {
                setFeaturedImage(media);
              });
            }}
          >
            <ImageIcon className="w-8 h-8 mb-2" />
            انتخاب تصویر شاخص
          </Button>
        )}
      </div>
      
      {/* Gallery Images */}
      <div>
        <label className="block text-sm font-medium mb-2">
          گالری تصاویر
        </label>
        
        <div className="grid grid-cols-4 gap-4">
          {galleryImages.map((img) => (
            <img 
              key={img.id}
              src={img.url} 
              alt={img.title}
              className="w-full h-32 object-cover rounded-lg"
            />
          ))}
          
          <Button
            variant="outline"
            className="w-full h-32"
            onClick={() => {
              // ✅ باز کردن Modal با callback
              openMediaLibrary((media) => {
                setGalleryImages((prev) => [...prev, media]);
              });
            }}
          >
            <ImageIcon className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </div>
  );
}
```

---

#### استفاده در Portfolio:

```tsx
// src/app/(dashboard)/portfolios/create/page.tsx
"use client";

import { useState } from "react";
import { useMediaStore } from "@/stores/useMediaStore";
import { Button } from "@/components/elements/Button";

export default function PortfolioCreatePage() {
  const [thumbnail, setThumbnail] = useState(null);
  const openMediaLibrary = useMediaStore((state) => state.openMediaLibrary);
  
  return (
    <div>
      <Button
        onClick={() => {
          // ✅ همان Modal، صفحه متفاوت
          openMediaLibrary((media) => {
            setThumbnail(media);
          });
        }}
      >
        انتخاب Thumbnail
      </Button>
    </div>
  );
}
```

---

#### استفاده در User Profile:

```tsx
// src/app/(dashboard)/users/[id]/edit/page.tsx
"use client";

import { useState } from "react";
import { useMediaStore } from "@/stores/useMediaStore";
import { Avatar } from "@/components/elements/Avatar";

export default function UserEditPage() {
  const [avatar, setAvatar] = useState(null);
  const openMediaLibrary = useMediaStore((state) => state.openMediaLibrary);
  
  return (
    <div>
      <Avatar 
        src={avatar?.url}
        onClick={() => {
          // ✅ همان Modal، برای آواتار
          openMediaLibrary((media) => {
            setAvatar(media);
          });
        }}
      />
    </div>
  );
}
```

---

### 🎯 چرا این روش بهترین است؟

#### ✅ مزایا:

1. **Single Bundle** - Modal فقط یکبار لود می‌شود (نه در هر صفحه)
2. **Lazy Loading** - فقط وقتی کاربر کلیک می‌کنه لود میشه
3. **Global Access** - از همه جا قابل استفاده
4. **Type-Safe** - با TypeScript کاملاً ایمن
5. **Callback Pattern** - برگشت data به صفحه فراخوان‌کننده
6. **Memory Efficient** - وقتی بسته میشه unmount میشه

#### ❌ راه‌های اشتباه که نباید استفاده کنید:

```tsx
// ❌ اشتباه 1: Import در هر صفحه
import { MediaLibraryModal } from "@/components/media/MediaLibraryModal";

// ❌ اشتباه 2: Dynamic Import در هر صفحه (تکراری!)
const MediaLibraryModal = dynamic(() => import("..."));

// ❌ اشتباه 3: Props Drilling
<MediaLibraryModal isOpen={...} onSelect={...} />

// ✅ درست: Global State + Provider
const openMediaLibrary = useMediaStore(state => state.openMediaLibrary);
```

---

### 📊 تاثیر Performance:

#### قبل (Import در هر صفحه):
```
- Blog Create Page: 650KB (شامل 50KB Modal)
- Portfolio Create Page: 670KB (شامل 50KB Modal)
- User Edit Page: 620KB (شامل 50KB Modal)
- جمع: 150KB Modal تکراری! ❌
```

#### بعد (Global Provider + Dynamic Import):
```
- Blog Create Page: 600KB (بدون Modal)
- Portfolio Create Page: 620KB (بدون Modal)
- User Edit Page: 570KB (بدون Modal)
- Modal: 50KB (فقط یکبار، وقتی لازم باشه) ✅
- جمع: 100KB کاهش! ✅
```

---

### 🔧 Media Library Modal Component

```tsx
// src/components/media/MediaLibraryModal.tsx
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useMediaStore } from "@/stores/useMediaStore";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function MediaLibraryModal() {
  const { isOpen, mode, closeMediaLibrary, selectMedia } = useMediaStore();
  const [selectedTab, setSelectedTab] = useState("library");
  
  // Fetch media from API
  const { data, isLoading } = useQuery({
    queryKey: ["media-library"],
    queryFn: () => fetch("/api/media").then(r => r.json()),
    enabled: isOpen, // ✅ فقط وقتی Modal باز است fetch کن
  });
  
  return (
    <Dialog open={isOpen} onOpenChange={closeMediaLibrary}>
      <DialogContent className="max-w-5xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>کتابخانه رسانه</DialogTitle>
        </DialogHeader>
        
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList>
            <TabsTrigger value="library">کتابخانه</TabsTrigger>
            <TabsTrigger value="upload">آپلود</TabsTrigger>
          </TabsList>
          
          <TabsContent value="library" className="space-y-4">
            {isLoading ? (
              <div>در حال بارگذاری...</div>
            ) : (
              <div className="grid grid-cols-4 gap-4">
                {data?.results?.map((media) => (
                  <div
                    key={media.id}
                    className="cursor-pointer hover:opacity-80 transition"
                    onClick={() => selectMedia(media)}
                  >
                    <img 
                      src={media.url} 
                      alt={media.title}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <p className="text-sm mt-1 truncate">{media.title}</p>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="upload">
            {/* Upload Form */}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
```

---

### 🎯 خلاصه برای Media Library:

```
1. Global State (Zustand) ✅
2. Global Provider در Root Layout ✅
3. Dynamic Import با ssr: false ✅
4. Conditional Render (فقط وقتی isOpen) ✅
5. Callback Pattern برای برگشت data ✅
```

**نتیجه:** یک Media Library سریع، قابل استفاده در همه جا، بدون تکرار کد! 🚀

---

## 💡 نکات نهایی

1. **اولویت با Modal شروع کنید** - بالاترین تاثیر با کمترین زمان
2. **Media Library را Global کنید** - تکرار نکنید در صفحات
3. **Skeleton UI را جدی بگیرید** - تفاوت UX را می‌سازد
4. **DataTable را Dynamic نکنید** - critical path است
5. **تست قبل از Deploy** - Bundle Size را چک کنید
6. **تدریجی پیاده کنید** - نه یکباره همه چیز

---

**موفق باشید! 🚀**

## 📋 خلاصه اجرایی

**یک جمله طلایی:**
```
Modal + Tab + Editor + AI + Chart = Dynamic Import با ssr: false
Button + Input + Card + Header + Layout = Import معمولی
```

**نتیجه مورد انتظار:**
- ✅ 60-70% کاهش Initial Bundle Size
- ✅ 45-55% بهبود Time to Interactive (TTI)
- ✅ 30-40% بهبود First Contentful Paint (FCP)
- ✅ Lighthouse Score: 65 → 90+

---

## 🎯 ساختار فولدر پروژه شما

```
src/
├── app/
│   ├── (dashboard)/
│   │   ├── layout.tsx              → Client Component با "use client"
│   │   ├── page.tsx                → Dashboard صفحه اصلی
│   │   ├── media/
│   │   │   └── page.tsx           → لیست رسانه‌ها
│   │   ├── blogs/
│   │   │   ├── page.tsx           → لیست بلاگ‌ها  
│   │   │   ├── create/
│   │   │   │   └── page.tsx       → ایجاد بلاگ (با تب)
│   │   │   └── [id]/
│   │   │       └── edit/
│   │   │           └── page.tsx   → ویرایش بلاگ (با تب)
│   │   ├── portfolios/
│   │   │   └── ... (مشابه blogs)
│   │   ├── users/
│   │   │   ├── page.tsx           → لیست کاربران
│   │   │   └── [id]/edit/
│   │   │       └── page.tsx       → ویرایش کاربر
│   │   └── ai/
│   │       ├── image/page.tsx
│   │       ├── chat/page.tsx
│   │       └── content/page.tsx
│   └── api/
│       └── [...slug]/route.ts      → Proxy به Django Backend
│
└── components/
    ├── blogs/
    │   ├── create/
    │   │   ├── BaseInfoTab.tsx     → تب اطلاعات پایه
    │   │   ├── ContentTab.tsx      → تب محتوا
    │   │   ├── MediaTab.tsx        → تب رسانه
    │   │   └── SEOTab.tsx          → تب سئو
    │   └── modals/
    │       └── BlogPreviewModal.tsx
    ├── media/
    │   └── modals/
    │       ├── MediaLibraryModal.tsx
    │       ├── MediaDetailsModal.tsx
    │       └── MediaUploadModal.tsx
    ├── forms/
    │   └── TipTapEditor.tsx         → Rich Text Editor
    ├── tables/
    │   └── DataTable.tsx            → @tanstack/react-table
    ├── ai/
    │   ├── image/AIImageGenerator.tsx
    │   └── chatbot/AIChatbot.tsx
    └── elements/
        ├── Button.tsx               → کامپوننت‌های کوچک
        ├── Input.tsx
        ├── Card.tsx
        ├── Loader.tsx
        └── Skeleton.tsx
```

---

## ✅ کجا باید Dynamic Import استفاده کنیم؟

### 🔴 اولویت 1: Modal Components (بالاترین تاثیر)

**چرا؟**
- Modal فقط با کلیک کاربر لود می‌شود
- نباید در Initial Bundle باشد
- معمولاً 15-30KB سایز دارد

**کجا؟**
```
src/app/(dashboard)/media/page.tsx
src/app/(dashboard)/blogs/create/page.tsx
src/app/(dashboard)/blogs/[id]/edit/page.tsx
src/app/(dashboard)/portfolios/create/page.tsx
src/app/(dashboard)/users/[id]/edit/page.tsx
```

**نحوه پیاده‌سازی:**

```tsx
// src/app/(dashboard)/media/page.tsx
"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/elements/Button";
import { Loader } from "@/components/elements/Loader";

// ✅ Modal Components - Dynamic Import با ssr: false
const MediaLibraryModal = dynamic(
  () => import("@/components/media/modals/MediaLibraryModal"),
  { 
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-lg p-8">
          <Loader size="lg" />
        </div>
      </div>
    )
  }
);

const MediaUploadModal = dynamic(
  () => import("@/components/media/modals/MediaUploadModal"),
  { 
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <Loader size="lg" />
      </div>
    )
  }
);

export default function MediaPage() {
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  return (
    <div>
      <Button onClick={() => setIsLibraryOpen(true)}>
        کتابخانه رسانه
      </Button>
      <Button onClick={() => setIsUploadOpen(true)}>
        آپلود فایل
      </Button>

      {/* Modal فقط وقتی render میشه که state باز باشه */}
      {isLibraryOpen && (
        <MediaLibraryModal 
          isOpen={isLibraryOpen}
          onClose={() => setIsLibraryOpen(false)}
        />
      )}

      {isUploadOpen && (
        <MediaUploadModal 
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
        />
      )}
    </div>
  );
}
```

**نکته مهم:**
```tsx
// ❌ اشتباه - Modal همیشه لود میشه
<MediaLibraryModal isOpen={isLibraryOpen} onClose={...} />

// ✅ درست - Modal فقط با state لود میشه
{isLibraryOpen && <MediaLibraryModal isOpen={isLibraryOpen} onClose={...} />}
```

**تاثیر:** ~24KB کاهش per Modal

---

### 🟠 اولویت 2: صفحات با Tab (Blog/Portfolio Create/Edit)

**چرا؟**
- کاربر فقط یک تب رو می‌بینه
- بقیه تب‌ها نباید Initial Bundle باشند
- هر تب معمولاً 30-60KB سایز دارد

**کجا؟**
```
src/app/(dashboard)/blogs/create/page.tsx
src/app/(dashboard)/blogs/[id]/edit/page.tsx
src/app/(dashboard)/portfolios/create/page.tsx
src/app/(dashboard)/users/[id]/edit/page.tsx
```

**نحوه پیاده‌سازی:**

```tsx
// src/app/(dashboard)/blogs/create/page.tsx
"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/elements/Skeleton";

// ✅ Skeleton شبیه UI واقعی تب
const TabSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Card سمت چپ */}
      <div className="flex-1 border rounded-lg p-6">
        <Skeleton className="h-6 w-32 mb-4" />
        <Skeleton className="h-10 w-full mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
      
      {/* Card سمت راست */}
      <div className="w-full lg:w-[420px] border rounded-lg p-6">
        <Skeleton className="h-6 w-24 mb-4" />
        <Skeleton className="h-10 w-full mb-3" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  </div>
);

// ✅ Dynamic Import برای هر تب
const BaseInfoTab = dynamic(
  () => import("@/components/blogs/create/BaseInfoTab"),
  { 
    ssr: false,
    loading: () => <TabSkeleton />
  }
);

const ContentTab = dynamic(
  () => import("@/components/blogs/create/ContentTab"),
  { 
    ssr: false,
    loading: () => <TabSkeleton />
  }
);

const MediaTab = dynamic(
  () => import("@/components/blogs/create/MediaTab"),
  { 
    ssr: false,
    loading: () => <TabSkeleton />
  }
);

const SEOTab = dynamic(
  () => import("@/components/blogs/create/SEOTab"),
  { 
    ssr: false,
    loading: () => <TabSkeleton />
  }
);

export default function BlogCreatePage() {
  const [activeTab, setActiveTab] = useState("base-info");

  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">ایجاد بلاگ جدید</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="base-info">اطلاعات پایه</TabsTrigger>
          <TabsTrigger value="content">محتوا</TabsTrigger>
          <TabsTrigger value="media">رسانه</TabsTrigger>
          <TabsTrigger value="seo">سئو</TabsTrigger>
        </TabsList>

        {/* فقط تب فعال render میشه */}
        <TabsContent value="base-info">
          <BaseInfoTab />
        </TabsContent>

        <TabsContent value="content">
          <ContentTab />
        </TabsContent>

        <TabsContent value="media">
          <MediaTab />
        </TabsContent>

        <TabsContent value="seo">
          <SEOTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

**تاثیر:** ~150KB کاهش per صفحه (4 تب × 40KB)

---

### 🟡 اولویت 3: Rich Text Editor (TipTap/Quill)

**چرا؟**
- Editor خیلی سنگین است (~80-120KB)
- نیاز به browser APIs دارد (window, document)
- فقط در تب محتوا استفاده می‌شود

**کجا؟**
```
src/components/blogs/create/ContentTab.tsx
src/components/portfolios/create/ContentTab.tsx
```

**نحوه پیاده‌سازی:**

```tsx
// src/components/blogs/create/ContentTab.tsx
"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/elements/Skeleton";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { FileText } from "lucide-react";

// ✅ Editor Skeleton
const EditorSkeleton = () => (
  <div className="border rounded-lg overflow-hidden">
    {/* Toolbar */}
    <div className="border-b bg-gray-50 p-2 flex gap-2">
      <Skeleton className="h-8 w-8 rounded" />
      <Skeleton className="h-8 w-8 rounded" />
      <Skeleton className="h-8 w-8 rounded" />
      <div className="w-px h-8 bg-gray-300 mx-2" />
      <Skeleton className="h-8 w-8 rounded" />
      <Skeleton className="h-8 w-8 rounded" />
    </div>
    
    {/* Content Area */}
    <div className="p-4 min-h-[400px] space-y-3">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  </div>
);

// ✅ TipTap Editor - Dynamic Import
const TipTapEditor = dynamic(
  () => import("@/components/forms/TipTapEditor"),
  { 
    ssr: false,
    loading: () => <EditorSkeleton />
  }
);

export default function ContentTab() {
  return (
    <div className="space-y-6">
      <CardWithIcon icon={FileText} title="محتوای بلاگ">
        <TipTapEditor 
          placeholder="محتوای بلاگ خود را بنویسید..."
          onChange={(html) => console.log(html)}
        />
      </CardWithIcon>
    </div>
  );
}
```

**در Editor Component:**

```tsx
// src/components/forms/TipTapEditor.tsx
"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";

interface TipTapEditorProps {
  placeholder?: string;
  initialContent?: string;
  onChange?: (html: string) => void;
}

// ✅ Default Export برای Dynamic Import
export default function TipTapEditor({ 
  placeholder, 
  initialContent,
  onChange 
}: TipTapEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: initialContent || "",
    editorProps: {
      attributes: {
        class: "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none min-h-[400px] p-4",
      },
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
  });

  return (
    <div className="border rounded-lg">
      {/* Toolbar */}
      <div className="border-b bg-gray-50 p-2 flex gap-2">
        <button
          onClick={() => editor?.chain().focus().toggleBold().run()}
          className={editor?.isActive("bold") ? "bg-gray-200" : ""}
        >
          Bold
        </button>
        {/* ... other toolbar buttons */}
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />
    </div>
  );
}
```

**تاثیر:** ~80-120KB کاهش

---

### 🟢 اولویت 4: AI Components

**چرا؟**
- AI Components سنگین هستند (~40-80KB)
- نیاز به browser APIs دارند
- فقط در صفحات خاص استفاده می‌شوند

**کجا؟**
```
src/app/(dashboard)/ai/image/page.tsx
src/app/(dashboard)/ai/chat/page.tsx
src/app/(dashboard)/ai/content/page.tsx
```

**نحوه پیاده‌سازی:**

```tsx
// src/app/(dashboard)/ai/image/page.tsx
"use client";

import dynamic from "next/dynamic";
import { Loader } from "@/components/elements/Loader";

// ✅ AI Component - Dynamic Import
const AIImageGenerator = dynamic(
  () => import("@/components/ai/image/AIImageGenerator"),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-[600px]">
        <Loader size="lg" text="در حال بارگذاری AI..." />
      </div>
    )
  }
);

export default function AIImagePage() {
  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">تولید تصویر با AI</h1>
      <AIImageGenerator />
    </div>
  );
}
```

**تاثیر:** ~40-80KB کاهش per component

---

### 🔵 اولویت 5: Charts (Dashboard)

**چرا؟**
- Chart libraries سنگین هستند (~40-60KB)
- معمولاً در پایین صفحه هستند (below fold)

**کجا؟**
```
src/app/(dashboard)/page.tsx (Dashboard اصلی)
```

**نحوه پیاده‌سازی:**

```tsx
// src/app/(dashboard)/page.tsx
"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/elements/Skeleton";
import { Card } from "@/components/elements/Card";

// ✅ Chart Skeleton
const ChartSkeleton = () => (
  <div className="h-[350px] space-y-3 p-4">
    <div className="flex justify-between items-center mb-4">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-8 w-24" />
    </div>
    <div className="flex items-end justify-between h-[250px]">
      {Array.from({ length: 7 }).map((_, i) => (
        <Skeleton 
          key={i} 
          className="w-12" 
          style={{ height: `${Math.random() * 100 + 50}%` }}
        />
      ))}
    </div>
    <div className="flex justify-around pt-2">
      {Array.from({ length: 7 }).map((_, i) => (
        <Skeleton key={i} className="h-3 w-8" />
      ))}
    </div>
  </div>
);

// ✅ Chart - Dynamic Import
const StatisticsChart = dynamic(
  () => import("@/components/dashboard/StatisticsChart"),
  { 
    ssr: false,
    loading: () => <ChartSkeleton />
  }
);

export default function DashboardPage() {
  return (
    <div className="container py-6 space-y-6">
      {/* Stats Cards - همیشه نمایش (above fold) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>...</Card>
        <Card>...</Card>
        <Card>...</Card>
        <Card>...</Card>
      </div>

      {/* Chart - Dynamic Load (below fold) */}
      <Card>
        <StatisticsChart />
      </Card>
    </div>
  );
}
```

**تاثیر:** ~40-60KB کاهش

---

### 🟣 اولویت 6: DataTable - **توجه ویژه!**

**نکته بسیار مهم:**
TanStack Table فقط 10-15KB است و برای پنل ادمین که لیست‌ها اولین چیزی هستند که کاربر می‌بینه، **DataTable نباید با `ssr: false` باشد!**

**چرا؟**
- DataTable در صفحه لیست است (critical path)
- کاربر باید فوراً جدول رو ببینه
- `ssr: false` = صفحه خالی + UX افتضاح

**راه حل درست:**

```tsx
// ❌ اشتباه - DataTable با ssr: false
const DataTable = dynamic(
  () => import("@/components/tables/DataTable"),
  { ssr: false } // ❌ اشتباه!
);

// ✅ درست - Import معمولی
import { DataTable } from "@/components/tables/DataTable";

// ✅ یا Dynamic با ssr: true (اگر واقعاً سنگین است)
const DataTable = dynamic(
  () => import("@/components/tables/DataTable"),
  { 
    ssr: true, // ✅ نه false!
    loading: () => <TableSkeleton />
  }
);
```

**نحوه پیاده‌سازی:**

```tsx
// src/app/(dashboard)/blogs/page.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { DataTable } from "@/components/tables/DataTable"; // ✅ Import معمولی
import { blogsColumns } from "./columns";

export default function BlogsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["blogs"],
    queryFn: () => fetch("/api/blogs").then(r => r.json()),
  });

  if (isLoading) {
    return <TableSkeleton />;
  }

  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">لیست بلاگ‌ها</h1>
      
      <DataTable 
        columns={blogsColumns}
        data={data?.results || []}
      />
    </div>
  );
}
```

**تاثیر:** بدون تاثیر منفی (چون فقط 10-15KB است و critical path است)

---

## ❌ کجا **نباید** Dynamic Import استفاده کنیم؟

### 1. کامپوننت‌های کوچک (<10KB)

```tsx
// ❌ اشتباه - بیخودی Overhead دارد!
const Button = dynamic(() => import("@/components/elements/Button"));
const Input = dynamic(() => import("@/components/elements/Input"));
const Card = dynamic(() => import("@/components/elements/Card"));
const Badge = dynamic(() => import("@/components/elements/Badge"));

// ✅ درست - Import معمولی
import { Button } from "@/components/elements/Button";
import { Input } from "@/components/elements/Input";
import { Card } from "@/components/elements/Card";
import { Badge } from "@/components/elements/Badge";
```

**چرا؟** Overhead Dynamic Import (2-3KB) بیشتر از خود کامپوننت است!

---

### 2. Layout Components (Above the Fold)

```tsx
// ❌ اشتباه - کاربر باید فوراً ببینه!
const Header = dynamic(() => import("@/components/layout/Header"));
const Sidebar = dynamic(() => import("@/components/layout/Sidebar"));
const Footer = dynamic(() => import("@/components/layout/Footer"));

// ✅ درست - Import معمولی
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Footer } from "@/components/layout/Footer";
```

**چرا؟** این‌ها critical path هستند و باید فوری render شوند!

---

### 3. Provider Components

```tsx
// ❌ اشتباه - در root layout هستند!
const QueryProvider = dynamic(() => import("@/providers/QueryProvider"));
const ThemeProvider = dynamic(() => import("@/providers/ThemeProvider"));

// ✅ درست - Import معمولی
import { QueryProvider } from "@/providers/QueryProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
```

**چرا؟** Providers در root layout هستند و باید اول load شوند!

---

### 4. صفحات ساده لیست (بدون تب)

```tsx
// ❌ اشتباه - صفحه لیست ساده
const BlogList = dynamic(() => import("@/components/blogs/BlogList"));

// ✅ درست - Import معمولی
import { BlogList } from "@/components/blogs/BlogList";
```

**چرا؟** صفحه لیست اولین چیزی است که کاربر می‌بینه!

---

### 5. DataTable در صفحات لیست

```tsx
// ❌ اشتباه - جدول در صفحه لیست (critical path)
const DataTable = dynamic(
  () => import("@/components/tables/DataTable"),
  { ssr: false } // ❌ اشتباه!
);

// ✅ درست - Import معمولی یا با ssr: true
import { DataTable } from "@/components/tables/DataTable";

// یا
const DataTable = dynamic(
  () => import("@/components/tables/DataTable"),
  { ssr: true } // ✅ درست
);
```

**چرا؟** TanStack Table فقط 10-15KB است و critical path است!

---

## 🎯 قانون طلایی (Decision Tree)

```
آیا کامپوننت Modal/Tab/Editor/Chart/AI است؟
├─ بله → آیا >20KB است؟
│   ├─ بله → Dynamic Import با ssr: false ✅
│   └─ خیر → Import معمولی ✅
│
└─ خیر → آیا Layout/Provider/SmallComponent است؟
    ├─ بله → Import معمولی ✅
    └─ خیر → آیا DataTable است؟
        ├─ بله → Import معمولی (چون critical path) ✅
        └─ خیر → آیا >50KB است؟
            ├─ بله → Dynamic Import با ssr: true ✅
            └─ خیر → Import معمولی ✅
```

---

## 📊 نتایج Performance (مورد انتظار)

### قبل از Dynamic Import:
```
Initial Bundle:        ~650KB
Time to Interactive:   ~4.2s
First Contentful Paint: ~1.5s
Lighthouse Score:      58/100
```

### بعد از Dynamic Import:
```
Initial Bundle:        ~220KB (↓ 66%)
Time to Interactive:   ~1.9s (↓ 55%)
First Contentful Paint: ~0.9s (↓ 40%)
Lighthouse Score:      92/100 (↑ 34 points)
```

---

## 🔧 الگوهای کلی (Templates)

### الگو 1: Modal Component

```tsx
// src/app/(dashboard)/example/page.tsx
"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/elements/Button";
import { Loader } from "@/components/elements/Loader";

const ExampleModal = dynamic(
  () => import("@/components/modals/ExampleModal"),
  { 
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <Loader size="lg" />
      </div>
    )
  }
);

export default function ExamplePage() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <Button onClick={() => setIsOpen(true)}>باز کردن Modal</Button>
      
      {isOpen && (
        <ExampleModal 
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
```

---

### الگو 2: Tab-based Page

```tsx
// src/app/(dashboard)/example/create/page.tsx
"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/elements/Skeleton";

const TabSkeleton = () => (
  <div className="space-y-4 animate-pulse">
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-64 w-full" />
  </div>
);

const Tab1 = dynamic(
  () => import("@/components/example/Tab1"),
  { ssr: false, loading: () => <TabSkeleton /> }
);

const Tab2 = dynamic(
  () => import("@/components/example/Tab2"),
  { ssr: false, loading: () => <TabSkeleton /> }
);

export default function ExampleCreatePage() {
  const [activeTab, setActiveTab] = useState("tab1");

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList>
        <TabsTrigger value="tab1">تب 1</TabsTrigger>
        <TabsTrigger value="tab2">تب 2</TabsTrigger>
      </TabsList>

      <TabsContent value="tab1">
        <Tab1 />
      </TabsContent>

      <TabsContent value="tab2">
        <Tab2 />
      </TabsContent>
    </Tabs>
  );
}
```

---