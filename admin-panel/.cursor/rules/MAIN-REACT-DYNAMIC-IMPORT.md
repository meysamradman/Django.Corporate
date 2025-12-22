# 🚀 راهنمای جامع Dynamic Import - React 19 + Vite 7 پنل ادمین (2025)

> **مخصوص پنل ادمین با Django Backend + React 19 + Vite 7**  
> **هدف**: سرعت بالا | CSR فقط | SEO غیر مهم | Bundle Size بسیار مهم

---

## 📋 خلاصه اجرایی

**یک جمله طلایی:**
```
Modal + Tab + Editor + AI + Chart = React.lazy() با Suspense ✅
Button + Input + Card + Header + Layout = Import معمولی ✅
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
├── main.tsx                    → Entry point
├── App.tsx                     → Root component
├── routes/
│   ├── index.tsx              → Route definitions
│   ├── Dashboard.tsx          → Dashboard صفحه اصلی
│   ├── media/
│   │   └── MediaPage.tsx      → لیست رسانه‌ها
│   ├── blogs/
│   │   ├── BlogsListPage.tsx  → لیست بلاگ‌ها
│   │   ├── BlogCreatePage.tsx → ایجاد بلاگ (با تب)
│   │   └── BlogEditPage.tsx   → ویرایش بلاگ (با تب)
│   ├── portfolios/
│   │   └── ... (مشابه blogs)
│   ├── users/
│   │   ├── UsersListPage.tsx  → لیست کاربران
│   │   └── UserEditPage.tsx   → ویرایش کاربر
│   └── ai/
│       ├── AIImagePage.tsx
│       ├── AIChatPage.tsx
│       └── AIContentPage.tsx
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
    └── ui/
        ├── Button.tsx               → کامپوننت‌های کوچک
        ├── Input.tsx
        ├── Card.tsx
        ├── Loader.tsx
        └── Skeleton.tsx
```

---

## 📚 مقدمه: چرا Dynamic Import؟

### مشکل: Bundle بزرگ در پنل ادمین

```
Initial Bundle = 650KB ❌
├── React + React-DOM: 130KB
├── TanStack Table: 45KB
├── TipTap Editor: 120KB (ولی فقط در ContentTab لازمه!)
├── Chart.js: 60KB (ولی فقط در Dashboard لازمه!)
├── Media Library Modal: 50KB (ولی فقط با کلیک باز میشه!)
└── ... سایر کامپوننت‌ها

نتیجه: Time to Interactive = 4.2s 😭
```

### راه حل: Code Splitting با React.lazy

React.lazy و Suspense امکان می‌دهند کامپوننت‌ها را به‌صورت پویا import کنید، که bundle را به chunk‌های کوچک‌تر تقسیم می‌کند

```jsx
// ❌ قبل: همه چیز در Initial Bundle
import TipTapEditor from './components/forms/TipTapEditor';
import MediaLibraryModal from './components/media/MediaLibraryModal';
import BlogPreviewModal from './components/modals/BlogPreviewModal';

// ✅ بعد: Lazy Load فقط وقتی نیاز بود
const TipTapEditor = lazy(() => import('./components/forms/TipTapEditor'));
const MediaLibraryModal = lazy(() => import('./components/media/MediaLibraryModal'));
const BlogPreviewModal = lazy(() => import('./components/modals/BlogPreviewModal'));
```

**نتیجه:**
```
Initial Bundle = 220KB ✅ (↓ 66%)
├── React + React-DOM: 130KB
├── TanStack Table: 45KB
├── Core App: 45KB
│
└── Lazy Chunks (لود وقتی لازم باشه):
    ├── TipTap.chunk.js: 120KB
    ├── MediaLibrary.chunk.js: 50KB
    ├── Chart.chunk.js: 60KB
    └── ...

Time to Interactive = 1.9s ✅ (↓ 55%)
```

---

## ✅ کجا باید Dynamic Import استفاده کنیم؟

### 🔴 اولویت 1: Modal Components (بالاترین تاثیر)

**چرا؟** Skeleton تجربه کاربری بهتری می‌دهد (Skeleton Screen Pattern)!

---

### 4. Conditional Rendering برای Modal

```tsx
// ❌ اشتباه - Modal همیشه render میشه
<Suspense fallback={<ModalLoader />}>
  <Modal isOpen={isOpen} />
</Suspense>

// ✅ درست - Modal فقط با state render میشه
{isOpen && (
  <Suspense fallback={<ModalLoader />}>
    <Modal isOpen={isOpen} />
  </Suspense>
)}
```

**چرا؟** اگر همیشه render شود، Dynamic Import بیخودی است!

---

### 5. Preload برای کامپوننت‌های مهم

```tsx
import { lazy } from 'react';

// ✅ Lazy Load
const TipTapEditor = lazy(() => import('./TipTapEditor'));

// ✅ Preload Function
export const preloadTipTapEditor = () => {
  import('./TipTapEditor');
};

// ✅ استفاده در Tab
export default function BlogCreatePage() {
  return (
    <TabsList>
      <TabsTrigger 
        value="content"
        onMouseEnter={() => preloadTipTapEditor()} // Preload on hover!
      >
        محتوا
      </TabsTrigger>
    </TabsList>
  );
}
```

**چرا؟** Preload با hover = کاربر سریع‌تر کامپوننت رو می‌بینه!

---

## 🔧 الگوهای کلی (Templates)

### الگو 1: Modal Component

```tsx
// src/routes/example/ExamplePage.tsx
import { useState, lazy, Suspense } from 'react';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';

const ExampleModal = lazy(() => 
  import('@/components/modals/ExampleModal')
);

const ModalLoader = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <Loader size="lg" />
  </div>
);

export default function ExamplePage() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <Button onClick={() => setIsOpen(true)}>باز کردن Modal</Button>
      
      {isOpen && (
        <Suspense fallback={<ModalLoader />}>
          <ExampleModal 
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
          />
        </Suspense>
      )}
    </div>
  );
}
```

---

### الگو 2: Tab-based Page

```tsx
// src/routes/example/ExampleCreatePage.tsx
import { useState, lazy, Suspense } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/Skeleton';

const TabSkeleton = () => (
  <div className="space-y-4 animate-pulse">
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-64 w-full" />
  </div>
);

const Tab1 = lazy(() => import('@/components/example/Tab1'));
const Tab2 = lazy(() => import('@/components/example/Tab2'));

export default function ExampleCreatePage() {
  const [activeTab, setActiveTab] = useState('tab1');

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList>
        <TabsTrigger value="tab1">تب 1</TabsTrigger>
        <TabsTrigger value="tab2">تب 2</TabsTrigger>
      </TabsList>

      <TabsContent value="tab1">
        <Suspense fallback={<TabSkeleton />}>
          <Tab1 />
        </Suspense>
      </TabsContent>

      <TabsContent value="tab2">
        <Suspense fallback={<TabSkeleton />}>
          <Tab2 />
        </Suspense>
      </TabsContent>
    </Tabs>
  );
}
```

---

### الگو 3: Rich Text Editor

```tsx
// src/components/example/ContentTab.tsx
import { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/Skeleton';

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

const TipTapEditor = lazy(() => 
  import('@/components/forms/TipTapEditor')
);

export default function ContentTab() {
  return (
    <div>
      <Suspense fallback={<EditorSkeleton />}>
        <TipTapEditor onChange={(html) => console.log(html)} />
      </Suspense>
    </div>
  );
}
```

---

## 🚀 خلاصه نهایی

### ✅ استفاده کنید (با React.lazy):
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
Modal + Tab + Editor + AI + Chart = React.lazy() با Suspense ✅
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

### داکیومنت رسمی React:
- [React.lazy & Suspense](https://react.dev/reference/react/lazy)
- [Code Splitting](https://react.dev/learn/passing-data-deeply-with-context)

### داکیومنت Vite:
- [Code Splitting](https://vite.dev/guide/features.html#code-splitting)
- [Build Optimizations](https://vite.dev/guide/build.html)

### ابزارهای Performance:
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [rollup-plugin-visualizer](https://github.com/btd/rollup-plugin-visualizer)
- [webpack-bundle-analyzer](https://www.npmjs.com/package/webpack-bundle-analyzer)

---

## 💡 نکات نهایی

1. **اولویت با Modal شروع کنید** - بالاترین تاثیر با کمترین زمان
2. **Media Library را Global کنید** - تکرار نکنید در صفحات
3. **Skeleton UI را جدی بگیرید** - تفاوت UX را می‌سازد
4. **DataTable را Lazy نکنید** - critical path است
5. **تست قبل از Deploy** - Bundle Size را چک کنید
6. **تدریجی پیاده کنید** - نه یکباره همه چیز
7. **از Preload استفاده کنید** - برای Tab hover و Modal
8. **Vite Config را optimize کنید** - Manual Chunking مهم است

---

## 🎨 بونوس: Route-based Code Splitting

اگر از React Router استفاده می‌کنید، می‌توانید صفحات را هم lazy load کنید:

```tsx
// src/routes/index.tsx
import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Loader } from '@/components/ui/Loader';

// ✅ Lazy Load Pages
const Dashboard = lazy(() => import('./Dashboard'));
const BlogsListPage = lazy(() => import('./blogs/BlogsListPage'));
const BlogCreatePage = lazy(() => import('./blogs/BlogCreatePage'));
const BlogEditPage = lazy(() => import('./blogs/BlogEditPage'));
const MediaPage = lazy(() => import('./media/MediaPage'));
const AIImagePage = lazy(() => import('./ai/AIImagePage'));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Loader size="lg" />
  </div>
);

export default function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        
        <Route path="/blogs">
          <Route index element={<BlogsListPage />} />
          <Route path="create" element={<BlogCreatePage />} />
          <Route path=":id/edit" element={<BlogEditPage />} />
        </Route>
        
        <Route path="/media" element={<MediaPage />} />
        <Route path="/ai/image" element={<AIImagePage />} />
      </Routes>
    </Suspense>
  );
}
```

**تاثیر:** هر صفحه در chunk جداگانه = Initial Bundle خیلی کوچک‌تر!

---

## 🔥 React 19.2 ویژگی جدید: Activity (Experimental)

React 19.2 مفهوم جدید "Activity" را معرفی کرده برای مدیریت بهتر async operations:

```tsx
import { useOptimistic, useTransition } from 'react';

function BlogForm() {
  const [isPending, startTransition] = useTransition();
  const [optimisticData, setOptimisticData] = useOptimistic(data);
  
  const handleSubmit = (formData) => {
    startTransition(async () => {
      // ✅ Optimistic UI update
      setOptimisticData(formData);
      
      // ✅ Actual API call
      await fetch('/api/blogs', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
    });
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button disabled={isPending}>
        {isPending ? 'در حال ذخیره...' : 'ذخیره'}
      </button>
    </form>
  );
}
```

---

**تاریخ:** 2025-12-22  
**React:** 19.2.0  
**Vite:** 7.2.4  
**Backend:** Django REST Framework  
**هدف:** CSR فقط | سرعت بالا | SEO غیر مهم  
**وضعیت:** ✅ آماده استفاده در Production

---

**موفق باشید! 🚀**؟**
- Modal فقط با کلیک کاربر لود می‌شود
- نباید در Initial Bundle باشد
- معمولاً 15-30KB سایز دارد

**کجا؟**
```
src/routes/media/MediaPage.tsx
src/routes/blogs/BlogCreatePage.tsx
src/routes/blogs/BlogEditPage.tsx
src/routes/portfolios/PortfolioCreatePage.tsx
src/routes/users/UserEditPage.tsx
```

**نحوه پیاده‌سازی:**

```tsx
// src/routes/media/MediaPage.tsx
import { useState, lazy, Suspense } from 'react';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';

// ✅ Modal Components - Dynamic Import
const MediaLibraryModal = lazy(() => 
  import('@/components/media/modals/MediaLibraryModal')
);

const MediaUploadModal = lazy(() => 
  import('@/components/media/modals/MediaUploadModal')
);

// ✅ Fallback Component
const ModalLoader = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <div className="bg-white rounded-lg p-8">
      <Loader size="lg" />
    </div>
  </div>
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

      {/* ✅ Modal فقط وقتی render میشه که state باز باشه */}
      {isLibraryOpen && (
        <Suspense fallback={<ModalLoader />}>
          <MediaLibraryModal 
            isOpen={isLibraryOpen}
            onClose={() => setIsLibraryOpen(false)}
          />
        </Suspense>
      )}

      {isUploadOpen && (
        <Suspense fallback={<ModalLoader />}>
          <MediaUploadModal 
            isOpen={isUploadOpen}
            onClose={() => setIsUploadOpen(false)}
          />
        </Suspense>
      )}
    </div>
  );
}
```

**نکته مهم:**
```tsx
// ❌ اشتباه - Modal همیشه لود میشه
<Suspense fallback={<ModalLoader />}>
  <MediaLibraryModal isOpen={isLibraryOpen} onClose={...} />
</Suspense>

// ✅ درست - Modal فقط با state لود میشه
{isLibraryOpen && (
  <Suspense fallback={<ModalLoader />}>
    <MediaLibraryModal isOpen={isLibraryOpen} onClose={...} />
  </Suspense>
)}
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
src/routes/blogs/BlogCreatePage.tsx
src/routes/blogs/BlogEditPage.tsx
src/routes/portfolios/PortfolioCreatePage.tsx
src/routes/users/UserEditPage.tsx
```

**نحوه پیاده‌سازی:**

```tsx
// src/routes/blogs/BlogCreatePage.tsx
import { useState, lazy, Suspense } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/Skeleton';

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
const BaseInfoTab = lazy(() => 
  import('@/components/blogs/create/BaseInfoTab')
);

const ContentTab = lazy(() => 
  import('@/components/blogs/create/ContentTab')
);

const MediaTab = lazy(() => 
  import('@/components/blogs/create/MediaTab')
);

const SEOTab = lazy(() => 
  import('@/components/blogs/create/SEOTab')
);

export default function BlogCreatePage() {
  const [activeTab, setActiveTab] = useState('base-info');

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
          <Suspense fallback={<TabSkeleton />}>
            <BaseInfoTab />
          </Suspense>
        </TabsContent>

        <TabsContent value="content">
          <Suspense fallback={<TabSkeleton />}>
            <ContentTab />
          </Suspense>
        </TabsContent>

        <TabsContent value="media">
          <Suspense fallback={<TabSkeleton />}>
            <MediaTab />
          </Suspense>
        </TabsContent>

        <TabsContent value="seo">
          <Suspense fallback={<TabSkeleton />}>
            <SEOTab />
          </Suspense>
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
import { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/Skeleton';
import { Card } from '@/components/ui/Card';
import { FileText } from 'lucide-react';

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
const TipTapEditor = lazy(() => 
  import('@/components/forms/TipTapEditor')
);

export default function ContentTab() {
  return (
    <div className="space-y-6">
      <Card icon={FileText} title="محتوای بلاگ">
        <Suspense fallback={<EditorSkeleton />}>
          <TipTapEditor 
            placeholder="محتوای بلاگ خود را بنویسید..."
            onChange={(html) => console.log(html)}
          />
        </Suspense>
      </Card>
    </div>
  );
}
```

**در Editor Component:**

```tsx
// src/components/forms/TipTapEditor.tsx
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

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
    content: initialContent || '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg focus:outline-none min-h-[400px] p-4',
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
          className={editor?.isActive('bold') ? 'bg-gray-200' : ''}
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
src/routes/ai/AIImagePage.tsx
src/routes/ai/AIChatPage.tsx
src/routes/ai/AIContentPage.tsx
```

**نحوه پیاده‌سازی:**

```tsx
// src/routes/ai/AIImagePage.tsx
import { lazy, Suspense } from 'react';
import { Loader } from '@/components/ui/Loader';

// ✅ AI Component - Dynamic Import
const AIImageGenerator = lazy(() => 
  import('@/components/ai/image/AIImageGenerator')
);

export default function AIImagePage() {
  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">تولید تصویر با AI</h1>
      
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[600px]">
          <Loader size="lg" text="در حال بارگذاری AI..." />
        </div>
      }>
        <AIImageGenerator />
      </Suspense>
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
src/routes/Dashboard.tsx (Dashboard اصلی)
```

**نحوه پیاده‌سازی:**

```tsx
// src/routes/Dashboard.tsx
import { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/Skeleton';
import { Card } from '@/components/ui/Card';

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
const StatisticsChart = lazy(() => 
  import('@/components/dashboard/StatisticsChart')
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
        <Suspense fallback={<ChartSkeleton />}>
          <StatisticsChart />
        </Suspense>
      </Card>
    </div>
  );
}
```

**تاثیر:** ~40-60KB کاهش

---

### 🟣 اولویت 6: DataTable - **توجه ویژه!**

**نکته بسیار مهم:**
TanStack Table فقط 10-15KB است و برای پنل ادمین که لیست‌ها اولین چیزی هستند که کاربر می‌بینه، **DataTable نباید lazy load شود!**

**چرا؟**
- DataTable در صفحه لیست است (critical path)
- کاربر باید فوراً جدول رو ببینه
- lazy() = صفحه خالی + UX افتضاح

**راه حل درست:**

```tsx
// ❌ اشتباه - DataTable با lazy()
const DataTable = lazy(() => import('@/components/tables/DataTable'));

// ✅ درست - Import معمولی
import { DataTable } from '@/components/tables/DataTable';
```

**نحوه پیاده‌سازی:**

```tsx
// src/routes/blogs/BlogsListPage.tsx
import { useQuery } from '@tanstack/react-query';
import { DataTable } from '@/components/tables/DataTable'; // ✅ Import معمولی
import { blogsColumns } from './columns';

export default function BlogsListPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['blogs'],
    queryFn: () => fetch('/api/blogs').then(r => r.json()),
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
const Button = lazy(() => import('@/components/ui/Button'));
const Input = lazy(() => import('@/components/ui/Input'));
const Card = lazy(() => import('@/components/ui/Card'));
const Badge = lazy(() => import('@/components/ui/Badge'));

// ✅ درست - Import معمولی
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
```

**چرا؟** Overhead Dynamic Import (2-3KB) بیشتر از خود کامپوننت است!

---

### 2. Layout Components (Above the Fold)

```tsx
// ❌ اشتباه - کاربر باید فوراً ببینه!
const Header = lazy(() => import('@/components/layout/Header'));
const Sidebar = lazy(() => import('@/components/layout/Sidebar'));
const Footer = lazy(() => import('@/components/layout/Footer'));

// ✅ درست - Import معمولی
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { Footer } from '@/components/layout/Footer';
```

**چرا؟** این‌ها critical path هستند و باید فوری render شوند!

---

### 3. Provider Components

```tsx
// ❌ اشتباه - در root layout هستند!
const QueryProvider = lazy(() => import('@/providers/QueryProvider'));
const ThemeProvider = lazy(() => import('@/providers/ThemeProvider'));

// ✅ درست - Import معمولی
import { QueryProvider } from '@/providers/QueryProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
```

**چرا؟** Providers در root layout هستند و باید اول load شوند!

---

### 4. صفحات ساده لیست (بدون تب)

```tsx
// ❌ اشتباه - صفحه لیست ساده
const BlogList = lazy(() => import('@/components/blogs/BlogList'));

// ✅ درست - Import معمولی
import { BlogList } from '@/components/blogs/BlogList';
```

**چرا؟** صفحه لیست اولین چیزی است که کاربر می‌بینه!

---

## 🎯 قانون طلایی (Decision Tree)

```
آیا کامپوننت Modal/Tab/Editor/Chart/AI است؟
├─ بله → آیا >20KB است؟
│   ├─ بله → React.lazy() با Suspense ✅
│   └─ خیر → Import معمولی ✅
│
└─ خیر → آیا Layout/Provider/SmallComponent است؟
    ├─ بله → Import معمولی ✅
    └─ خیر → آیا DataTable است؟
        ├─ بله → Import معمولی (چون critical path) ✅
        └─ خیر → آیا >50KB است؟
            ├─ بله → React.lazy() ✅
            └─ خیر → Import معمولی ✅
```

---

## 📦 تنظیمات Vite برای Code Splitting بهتر

### vite.config.ts

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    // ✅ Bundle Analyzer (فقط در build)
    visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true,
      filename: 'dist/stats.html',
    }),
  ],
  
  build: {
    // ✅ Manual Chunking - جدا کردن vendor از app code
    rollupOptions: {
      output: {
        manualChunks: {
          // React و React-DOM در یک chunk
          'react-vendor': ['react', 'react-dom', 'react-dom/client'],
          
          // Router در یک chunk جداگانه
          'router': ['react-router-dom'],
          
          // UI Libraries
          'ui-vendor': ['lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-tabs'],
          
          // Data fetching & State
          'query-vendor': ['@tanstack/react-query', 'zustand'],
          
          // Table
          'table-vendor': ['@tanstack/react-table'],
          
          // Rich Text Editor (اگر lazy نکردید)
          // 'editor-vendor': ['@tiptap/react', '@tiptap/starter-kit'],
          
          // Chart (اگر lazy نکردید)
          // 'chart-vendor': ['chart.js', 'react-chartjs-2'],
        },
      },
    },
    
    // ✅ افزایش حد هشدار chunk size
    chunkSizeWarningLimit: 1000,
    
    // ✅ فعال کردن minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // حذف console.log در production
        drop_debugger: true,
      },
    },
    
    // ✅ فعال کردن source maps (فقط برای development)
    sourcemap: false,
  },
});
```

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
# dist/index.html                          0.50 kB │ gzip:  0.32 kB
# dist/assets/react-vendor-abc123.js     143.42 kB │ gzip: 46.11 kB
# dist/assets/index-xyz789.js             85.26 kB │ gzip: 28.50 kB
# dist/assets/ContentTab-def456.js        42.15 kB │ gzip: 12.33 kB  ← کاهش یافته!

# 3. اجرای production preview
npm run preview

# 4. تست با Lighthouse
# Chrome DevTools > Lighthouse > Run
```

---

### 3. Bundle Analyzer

```bash
# 1. نصب visualizer (قبلاً در vite.config.ts اضافه کردیم)
npm install --save-dev rollup-plugin-visualizer

# 2. Build و بررسی
npm run build

# 3. فایل stats.html در dist/ ایجاد میشه
# باز کردن dist/stats.html در browser

# 4. مقایسه قبل و بعد
# - قبل: Modal در Initial Bundle
# - بعد: Modal در Chunk جداگانه
```

**نمونه خروجی Visualizer:**

```
┌─────────────────────────────────────────┐
│ react-vendor.js (143KB)                 │
│ ├─ react (80KB)                         │
│ └─ react-dom (63KB)                     │
├─────────────────────────────────────────┤
│ index.js (85KB)                         │
│ ├─ App.tsx (10KB)                       │
│ ├─ Dashboard.tsx (8KB)                  │
│ └─ ... other pages                      │
├─────────────────────────────────────────┤
│ ContentTab.chunk.js (42KB) ← Lazy!     │
│ ├─ TipTapEditor (35KB)                  │
│ └─ ContentTab (7KB)                     │
├─────────────────────────────────────────┤
│ MediaLibrary.chunk.js (28KB) ← Lazy!   │
└─────────────────────────────────────────┘
```

---

### 4. Lighthouse Performance Metrics

**اهداف برای پنل ادمین:**
- Performance Score: 90+ ✅
- First Contentful Paint (FCP): <1s ✅
- Time to Interactive (TTI): <2s ✅
- Total Blocking Time (TBT): <200ms ✅

---

## 🚀 React 19 ویژگی‌های جدید

### 1. use Hook برای Data Fetching

React 19 API جدید use را معرفی کرده که به شما امکان می‌دهد promise‌ها را در render بخوانید

```tsx
import { use, Suspense } from 'react';

// ✅ Promise خارج از component
const dataPromise = fetch('/api/blogs').then(r => r.json());

function BlogList() {
  // ✅ استفاده از use() برای خواندن promise
  const data = use(dataPromise);
  
  return (
    <div>
      {data.results.map(blog => (
        <div key={blog.id}>{blog.title}</div>
      ))}
    </div>
  );
}

// ✅ با Suspense
export default function BlogsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BlogList />
    </Suspense>
  );
}
```

---

### 2. Suspense Batching در React 19.2

React 19.2 Suspense boundaries را برای مدت کوتاهی batch می‌کند تا محتوای بیشتری با هم نمایش داده شود

```tsx
// قبل: هر Suspense boundary جداگانه resolve میشد
<Suspense fallback={<Spinner />}>
  <ComponentA /> {/* 100ms */}
</Suspense>
<Suspense fallback={<Spinner />}>
  <ComponentB /> {/* 120ms */}
</Suspense>
// نتیجه: دو بار Spinner (100ms + 120ms)

// بعد: React 19.2 به‌صورت هوشمند batch می‌کند
<Suspense fallback={<Spinner />}>
  <ComponentA /> {/* 100ms */}
</Suspense>
<Suspense fallback={<Spinner />}>
  <ComponentB /> {/* 120ms */}
</Suspense>
// نتیجه: یک بار Spinner (120ms) - هر دو با هم نمایش داده می‌شوند
```

---

### 3. Error Boundaries با Suspense

```tsx
import { Component, Suspense, lazy } from 'react';

// ✅ Error Boundary
class ErrorBoundary extends Component {
  state = { hasError: false };
  
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  
  render() {
    if (this.state.hasError) {
      return <div>خطا در بارگذاری کامپوننت</div>;
    }
    return this.props.children;
  }
}

const TipTapEditor = lazy(() => import('./TipTapEditor'));

// ✅ استفاده
export default function ContentTab() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<EditorSkeleton />}>
        <TipTapEditor />
      </Suspense>
    </ErrorBoundary>
  );
}
```

---

## 🎨 مورد ویژه: مدیا مرکزی (Global Media Library Modal)

### مشخصات Media Library شما:

```
✅ Popup/Modal است
✅ در همه صفحات استفاده می‌شود (blogs, portfolios, users, etc.)
✅ سنگین است (~40-80KB) - شامل: Image Preview, Upload, Filters, Pagination
✅ فقط با کلیک کاربر باز می‌شود
```

### ✅ راه حل درست: Global State + Dynamic Import

#### مرحله 1: ایجاد Global State (Zustand)

```tsx
// src/stores/useMediaStore.ts
import { create } from 'zustand';

interface MediaItem {
  id: string;
  url: string;
  title: string;
  type: 'image' | 'video' | 'document';
}

interface MediaStoreState {
  // State
  isOpen: boolean;
  selectedMedia: MediaItem | null;
  mode: 'select' | 'upload' | 'view';
  
  // Callback برای برگشت media انتخاب شده
  onSelectCallback: ((media: MediaItem) => void) | null;
  
  // Actions
  openMediaLibrary: (onSelect?: (media: MediaItem) => void) => void;
  closeMediaLibrary: () => void;
  selectMedia: (media: MediaItem) => void;
  setMode: (mode: 'select' | 'upload' | 'view') => void;
}

export const useMediaStore = create<MediaStoreState>((set, get) => ({
  // Initial State
  isOpen: false,
  selectedMedia: null,
  mode: 'select',
  onSelectCallback: null,
  
  // باز کردن Modal
  openMediaLibrary: (onSelect) => {
    set({ 
      isOpen: true, 
      mode: 'select',
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
import { lazy, Suspense } from 'react';
import { useMediaStore } from '@/stores/useMediaStore';
import { Loader } from '@/components/ui/Loader';

// ✅ Dynamic Import
const MediaLibraryModal = lazy(() => 
  import('@/components/media/MediaLibraryModal')
);

export default function MediaLibraryProvider() {
  const isOpen = useMediaStore((state) => state.isOpen);
  
  // ✅ فقط وقتی Modal باز است render میشه
  if (!isOpen) return null;
  
  return (
    <Suspense fallback={
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-lg p-8">
          <Loader size="lg" text="در حال بارگذاری کتابخانه رسانه..." />
        </div>
      </div>
    }>
      <MediaLibraryModal />
    </Suspense>
  );
}
```

---

#### مرحله 3: اضافه کردن Provider به Root

```tsx
// src/App.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import MediaLibraryProvider from '@/components/providers/MediaLibraryProvider';
import AppRoutes from '@/routes';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
        
        {/* ✅ Global Media Library Modal */}
        <MediaLibraryProvider />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
```

---

#### مرحله 4: استفاده در صفحات مختلف

```tsx
// src/routes/blogs/BlogCreatePage.tsx
import { useState } from 'react';
import { useMediaStore } from '@/stores/useMediaStore';
import { Button } from '@/components/ui/Button';
import { ImageIcon } from 'lucide-react';

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

## ✅ Checklist پیاده‌سازی

### فاز 1 (این هفته): Modal Components
- [ ] `src/routes/media/MediaPage.tsx`
  - [ ] MediaLibraryModal
  - [ ] MediaDetailsModal
  - [ ] MediaUploadModal
- [ ] `src/routes/blogs/BlogCreatePage.tsx`
  - [ ] BlogPreviewModal
- [ ] `src/routes/portfolios/PortfolioCreatePage.tsx`
  - [ ] PortfolioPreviewModal

**زمان:** 2-3 ساعت  
**تاثیر:** ~70KB کاهش

---

### فاز 2 (هفته آینده): Tab-based Pages
- [ ] `src/routes/blogs/BlogCreatePage.tsx`
  - [ ] BaseInfoTab
  - [ ] ContentTab
  - [ ] MediaTab
  - [ ] SEOTab
- [ ] `src/routes/portfolios/PortfolioCreatePage.tsx`
  - [ ] BaseInfoTab
  - [ ] ContentTab
  - [ ] MediaTab
  - [ ] SEOTab
- [ ] `src/routes/users/UserEditPage.tsx`
  - [ ] ProfileTab
  - [ ] SecurityTab
  - [ ] PermissionsTab

**زمان:** 4-5 ساعت  
**تاثیر:** ~300KB کاهش

---

### فاز 3 (ماه آینده): Editor & AI
- [ ] TipTap Editor در ContentTab
- [ ] `src/routes/ai/AIImagePage.tsx`
  - [ ] AIImageGenerator
- [ ] `src/routes/ai/AIChatPage.tsx`
  - [ ] AIChatbot
- [ ] `src/routes/ai/AIContentPage.tsx`
  - [ ] AIContentGenerator

**زمان:** 3-4 ساعت  
**تاثیر:** ~200KB کاهش

---

### فاز 4 (در صورت نیاز): Charts
- [ ] `src/routes/Dashboard.tsx`
  - [ ] StatisticsChart
  - [ ] RevenueChart

**زمان:** 1-2 ساعت  
**تاثیر:** ~60KB کاهش

---

## 📝 نکات مهم React 19 + Vite 7

### 1. همیشه Default Export برای Lazy Components

```tsx
// ❌ پیچیده - Named Export
const Modal = lazy(() => 
  import('./Modal').then(mod => ({ default: mod.Modal }))
);

// ✅ ساده‌تر - Default Export
// در فایل Modal.tsx:
export default function Modal() { ... }

// در فایل استفاده‌کننده:
const Modal = lazy(() => import('./Modal'));
```

---

### 2. همیشه Suspense تعریف کنید

```tsx
// ❌ اشتباه - بدون Suspense
const Modal = lazy(() => import('./Modal'));
<Modal /> // Error!

// ✅ درست - با Suspense
const Modal = lazy(() => import('./Modal'));
<Suspense fallback={<Loader />}>
  <Modal />
</Suspense>
```

---

### 3. استفاده از Skeleton به جای Loader (بهتر)

```tsx
// ⚠️ قابل قبول - Loader ساده
<Suspense fallback={<Loader />}>
  <ContentTab />
</Suspense>

// ✅ بهتر - Skeleton شبیه UI واقعی
<Suspense fallback={<TabSkeleton />}>
  <ContentTab />
</Suspense>
```

**چرا