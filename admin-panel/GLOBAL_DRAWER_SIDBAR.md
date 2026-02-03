مستندات معماری Global Drawer (مدیریت سایدبارها)
این سند جزئیات کامل معماری جدید Global Drawer Manager را که برای بهینه‌سازی عملکرد و مدیریت مرکزی سایدبارها (مثل ایجاد تگ، دسته‌بندی و...) پیاده‌سازی شده است، شرح می‌دهد.

۱. صورت مسئله و هدف
در روش قبلی، برای باز کردن یک سایدبار (مثلاً "ایجاد تگ")، لازم بود:

کاربر به صفحه لیست (Tags List) برود و سپس سایدبار باز شود (UX بد).
یا کامپوننت سایدبار در تمام صفحات (
AdminLayout
) رندر شود که باعث افزایش حجم اولیه برنامه و کندی می‌شد (Bloat).
هدف: ایجاد یک سیستم مرکزی که سایدبارها را بدون نیاز به رفرش یا تغییر صفحه باز کند و کد آن‌ها را فقط زمانی که نیاز است دانلود کند (Lazy Loading).

۲. معماری جدید: Global Drawer
ما یک سیستم متمرکز ساختیم که در فایل 
AdminLayout.tsx
 قرار دارد اما محتوای آن به صورت پویا و Lazy لود می‌شود.

اجزای اصلی:
Store مرکزی (
globalDrawerStore.ts
): وضعیت باز/بسته بودن و داده‌های دراور را مدیریت می‌کند.
** کامپوننت مدیر (
GlobalDrawer.tsx
)**: مسئول نمایش دراور فعلی و لود کردن کد آن با Suspense است.
** رجیستری تایپ‌ها (
drawer.ts
)**: لیست تمام دراورهای مجاز و Props آن‌ها.
۳. فایل‌های ایجاد شده و تغییرات
الف) فایل‌های جدید
فایل	مسیر	توضیحات
GlobalDrawer.tsx	
src/components/layout/GlobalDrawer.tsx
کامپوننت اصلی که در 
AdminLayout
 قرار می‌گیرد. سایدبارها را Lazy Load می‌کند.
globalDrawerStore.ts	
src/stores/globalDrawerStore.ts
استور Zustand برای مدیریت اینکه کدام دراور باز است.
drawer.ts	
src/types/shared/drawer.ts
تعریف IDها و تایپ‌های Props برای هر دراور (برای Type Safety).
ب) فایل‌های تغییر یافته
فایل	تغییر
src/layouts/AdminLayout.tsx
حذف ایمپورت‌های تکی سایدبارها و اضافه کردن <GlobalDrawer />.
SidebarMenu.tsx
تغییر 
onClick
 آیتم‌ها برای استفاده از useGlobalDrawerStore.
TagPage.tsx / CategoryPage.tsx	حذف کدهای تکراری رندر سایدبار و استفاده از Store برای دکمه‌های "افزودن" و "ویرایش".
BlogTagSide.tsx
 / 
BlogCategorySide.tsx
اصلاح برای حذف ریدایرکت‌های اجباری و هماهنگی با سیستم گلوبال.
۴. کدهای کلیدی
۱. تعریف دراورها (Types)
// src/types/shared/drawer.ts
export const DRAWER_IDS = {
  BLOG_TAG_FORM: 'BLOG_TAG_FORM',
  BLOG_CATEGORY_FORM: 'BLOG_CATEGORY_FORM',
} as const;
۲. استور مرکزی (Store)
// src/stores/globalDrawerStore.ts
export const useGlobalDrawerStore = create<GlobalDrawerStore>((set) => ({
  activeDrawer: null,
  drawerProps: {},
  open: (id, props) => set({ activeDrawer: id, drawerProps: props || {} }),
  close: () => set({ activeDrawer: null, drawerProps: {} }),
}));
۳. کامپوننت مدیر (Manager)
این بخش مهم‌ترین قسمت برای بهینه‌سازی است. از React.lazy استفاده می‌کند:

// src/components/layout/GlobalDrawer.tsx
const BlogTagSide = lazy(() => import('@/components/blogs/tags/BlogTagSide').then(m => ({ default: m.BlogTagSide })));
const BlogCategorySide = lazy(() => import('@/components/blogs/categories/BlogCategorySide').then(m => ({ default: m.BlogCategorySide })));
const DRAWERS = {
  [DRAWER_IDS.BLOG_TAG_FORM]: BlogTagSide,
  [DRAWER_IDS.BLOG_CATEGORY_FORM]: BlogCategorySide,
};
// ... render logic with Suspense
۵. راهنما: چگونه یک سایدبار جدید اضافه کنیم؟
برای اضافه کردن یک سایدبار جدید (مثلاً "ایجاد بلاگ")، فقط این ۳ مرحله ساده را انجام دهید:

تعریف ID: در فایل 
src/types/shared/drawer.ts
 یک ID جدید (مثلاً BLOG_FORM) اضافه کنید.
ثبت در Manager: در فایل 
GlobalDrawer.tsx
:
کامپوننت را با lazy ایمپورت کنید.
آن را به آبجکت DRAWERS اضافه کنید.
استفاده: در هر جای برنامه (منو، دکمه و...) صدا بزنید:
const open = useGlobalDrawerStore(s => s.open);
open(DRAWER_IDS.BLOG_FORM);
نکته مهم: هیچ نیازی به تغییر 
AdminLayout
 یا ساخت Store جدید نیست!

