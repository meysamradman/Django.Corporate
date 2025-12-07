# راهنمای کامل Dynamic Import در Next.js 15/16

## 📚 فهرست مطالب

1. [معرفی Dynamic Import](#معرفی)
2. [چه زمانی استفاده کنیم](#زمان-استفاده)
3. [چه زمانی استفاده نکنیم](#زمان-عدم-استفاده)
4. [سینتکس‌های مختلف](#سینتکس)
5. [مثال‌های کاربردی](#مثال‌ها)
6. [بهترین شیوه‌ها (Best Practices)](#بهترین-شیوه‌ها)
7. [اشتباهات رایج](#اشتباهات-رایج)

---

## 🎯 معرفی {#معرفی}

### Dynamic Import چیست؟

Dynamic Import (یا Lazy Loading) تکنیکی است که به شما اجازه می‌دهد کامپوننت‌ها و ماژول‌های JavaScript را به صورت **on-demand** بارگذاری کنید، نه اینکه همه آن‌ها را در bundle اولیه قرار دهید.

### مزایا:

- ✅ **کاهش Initial Bundle Size**: کد کمتر در لود اولیه
- ✅ **بهبود Time to Interactive (TTI)**: صفحه سریع‌تر تعاملی می‌شود
- ✅ **بهبود SEO**: Core Web Vitals بهتر
- ✅ **UX بهتر**: صفحه سریع‌تر لود می‌شود
- ✅ **کاهش مصرف Data**: فقط کدی که نیاز است دانلود می‌شود

### معایب:

- ❌ **تاخیر کوچک**: یک request اضافی برای لود کامپوننت
- ❌ **پیچیدگی بیشتر**: نیاز به مدیریت loading states
- ❌ **احتمال Layout Shift**: اگر loading state مناسب نباشد

---

## ⏰ چه زمانی استفاده کنیم {#زمان-استفاده}

### ✅ **1. Modal‌ها و Dialog‌ها**

Modal‌ها فقط زمانی نیاز هستند که کاربر روی دکمه کلیک کند.

```typescript
"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

// Dynamic import modal
const LoginModal = dynamic(() => import("@/components/LoginModal"), {
  ssr: false,
  loading: () => <Spinner />
});

export default function Page() {
  const [showModal, setShowModal] = useState(false);
  
  return (
    <div>
      <button onClick={() => setShowModal(true)}>ورود</button>
      {showModal && <LoginModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
```

**چرا؟**
- Modal در لود اولیه نیاز نیست
- فقط با کلیک کاربر فعال می‌شود
- معمولاً dependencies سنگین دارد (animations, transitions)

---

### ✅ **2. کامپوننت‌های Below the Fold**

کامپوننت‌هایی که در قسمت پایین صفحه هستند و کاربر باید scroll کند.

```typescript
"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const HeavyChart = dynamic(() => import("@/components/HeavyChart"), {
  ssr: false,
  loading: () => <div>در حال بارگذاری نمودار...</div>
});

export default function AnalyticsPage() {
  const [showChart, setShowChart] = useState(false);

  useEffect(() => {
    // فقط وقتی scroll شد load کن
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShowChart(true);
        }
      },
      { threshold: 0.1 }
    );

    const chartSection = document.getElementById("chart-section");
    if (chartSection) observer.observe(chartSection);

    return () => observer.disconnect();
  }, []);

  return (
    <div>
      <h1>تحلیل‌ها</h1>
      {/* محتوای بالای صفحه */}
      
      <div id="chart-section" className="mt-8">
        {showChart && <HeavyChart />}
      </div>
    </div>
  );
}
```

---

### ✅ **3. کتابخانه‌های سنگین Third-party**

کتابخانه‌هایی مثل Chart.js، Editor.js، PDF viewers که حجم بالایی دارند.

```typescript
"use client";

import { useState } from "react";

export default function SearchPage() {
  const [results, setResults] = useState([]);

  const handleSearch = async (query: string) => {
    // Dynamic import کتابخانه فقط زمان جستجو
    const Fuse = (await import("fuse.js")).default;
    const fuse = new Fuse(data, { keys: ["title", "description"] });
    
    const searchResults = fuse.search(query);
    setResults(searchResults);
  };

  return (
    <div>
      <input 
        type="search" 
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="جستجو..."
      />
      {/* نتایج */}
    </div>
  );
}
```

**مثال‌های رایج:**
- `Chart.js` - نمودارها و گراف‌ها
- `pdf.js` - نمایش PDF
- `fuse.js` - موتور جستجو
- `Editor.js` / `TipTap` - WYSIWYG editors
- `Three.js` - 3D graphics
- `Leaflet` / `Mapbox` - نقشه‌ها

---

### ✅ **4. Feature Flags و Conditional Components**

کامپوننت‌هایی که بر اساس شرایط نمایش داده می‌شوند.

```typescript
"use client";

import dynamic from "next/dynamic";

const AdminPanel = dynamic(() => import("@/components/AdminPanel"));
const UserDashboard = dynamic(() => import("@/components/UserDashboard"));
const GuestView = dynamic(() => import("@/components/GuestView"));

export default function Dashboard({ user }) {
  if (user.role === "admin") {
    return <AdminPanel />;
  }
  
  if (user.role === "user") {
    return <UserDashboard />;
  }
  
  return <GuestView />;
}
```

---

### ✅ **5. Tab Components و Accordion**

محتوایی که داخل Tab‌ها یا Accordion مخفی است.

```typescript
"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

const ProfileTab = dynamic(() => import("@/components/tabs/ProfileTab"));
const SettingsTab = dynamic(() => import("@/components/tabs/SettingsTab"));
const BillingTab = dynamic(() => import("@/components/tabs/BillingTab"));

export default function UserSettings() {
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <div>
      <div className="tabs">
        <button onClick={() => setActiveTab("profile")}>پروفایل</button>
        <button onClick={() => setActiveTab("settings")}>تنظیمات</button>
        <button onClick={() => setActiveTab("billing")}>پرداخت</button>
      </div>

      {activeTab === "profile" && <ProfileTab />}
      {activeTab === "settings" && <SettingsTab />}
      {activeTab === "billing" && <BillingTab />}
    </div>
  );
}
```

---

### ✅ **6. کامپوننت‌های Client-only**

کامپوننت‌هایی که به `window` یا browser APIs نیاز دارند.

```typescript
"use client";

import dynamic from "next/dynamic";

// این کامپوننت به window.localStorage نیاز دارد
const EditorComponent = dynamic(() => import("@/components/Editor"), {
  ssr: false, // ✅ غیرفعال کردن SSR
  loading: () => <div>در حال بارگذاری ویرایشگر...</div>
});

export default function BlogEditor() {
  return (
    <div>
      <h1>ویرایشگر مقاله</h1>
      <EditorComponent />
    </div>
  );
}
```

---

## ❌ چه زمانی استفاده نکنیم {#زمان-عدم-استفاده}

### ❌ **1. کامپوننت‌های Above the Fold**

کامپوننت‌هایی که در بالای صفحه هستند و باید فوراً دیده شوند.

```typescript
// ❌ اشتباه - Header نباید dynamic باشد
const DynamicHeader = dynamic(() => import("@/components/Header"));

export default function Layout({ children }) {
  return (
    <div>
      <DynamicHeader /> {/* کاربر تاخیر می‌بیند */}
      {children}
    </div>
  );
}
```

```typescript
// ✅ صحیح - Static import
import Header from "@/components/Header";

export default function Layout({ children }) {
  return (
    <div>
      <Header />
      {children}
    </div>
  );
}
```

---

### ❌ **2. کامپوننت‌های کوچک و سبک**

کامپوننت‌هایی که کد کمی دارند (زیر 5KB).

```typescript
// ❌ اشتباه - overhead بیشتر از فایده است
const Button = dynamic(() => import("@/components/Button"));

// ✅ صحیح - Static import
import Button from "@/components/Button";
```

**قاعده کلی:** اگر کامپوننت کمتر از 20-30 خط کد دارد، dynamic import نکنید.

---

### ❌ **3. کامپوننت‌های SSR Critical**

کامپوننت‌هایی که برای SEO و SSR مهم هستند.

```typescript
// ❌ اشتباه - محصولات برای SEO مهم هستند
const ProductList = dynamic(() => import("@/components/ProductList"), {
  ssr: false // این مشکل SEO ایجاد می‌کند
});

// ✅ صحیح - SSR فعال
const ProductList = dynamic(() => import("@/components/ProductList"), {
  ssr: true, // یا حذف این خط (پیش‌فرض true است)
  loading: () => <ProductSkeleton />
});
```

---

### ❌ **4. استفاده بیش از حد (Over-splitting)**

Dynamic import کردن تمام کامپوننت‌ها.

```typescript
// ❌ اشتباه - خیلی زیاد split شده
const Heading = dynamic(() => import("@/components/Heading"));
const Paragraph = dynamic(() => import("@/components/Paragraph"));
const Button = dynamic(() => import("@/components/Button"));
const Icon = dynamic(() => import("@/components/Icon"));

// نتیجه: 50+ HTTP request = کند
```

**مشکل:** بیش از حد dynamic import = بیش از حد HTTP requests = عملکرد بدتر

**قاعده:** فقط کامپوننت‌های بزرگ (>30KB) را dynamic import کنید.

---

### ❌ **5. Largest Contentful Paint (LCP)**

عنصری که بزرگترین محتوای visible صفحه است.

```typescript
// ❌ اشتباه - تصویر اصلی نباید dynamic باشد
const HeroImage = dynamic(() => import("@/components/HeroImage"), {
  ssr: false
});

export default function HomePage() {
  return (
    <div>
      <HeroImage /> {/* این LCP است، نباید تاخیر داشته باشد */}
      {/* بقیه محتوا */}
    </div>
  );
}
```

---

## 🔧 سینتکس‌های مختلف {#سینتکس}

### **1. Default Export**

```typescript
import dynamic from "next/dynamic";

const MyComponent = dynamic(() => import("@/components/MyComponent"));

// با loading
const MyComponent = dynamic(() => import("@/components/MyComponent"), {
  loading: () => <Spinner />
});

// با ssr: false
const MyComponent = dynamic(() => import("@/components/MyComponent"), {
  ssr: false,
  loading: () => <Spinner />
});
```

---

### **2. Named Export**

```typescript
import dynamic from "next/dynamic";

// روش 1: ساده‌تر (توصیه می‌شود)
const LoginForm = dynamic(
  () => import("@/components/auth/LoginForm").then(mod => mod.LoginForm)
);

// روش 2: با { default: ... }
const LoginForm = dynamic(
  () => import("@/components/auth/LoginForm").then(mod => ({ default: mod.LoginForm }))
);
```

**هر دو روش کار می‌کنند!** روش اول ساده‌تر و خواناتر است.

---

### **3. Multiple Named Exports**

```typescript
import dynamic from "next/dynamic";

// هر کدام جداگانه
const Button = dynamic(() => 
  import("@/components/ui").then(mod => mod.Button)
);

const Input = dynamic(() => 
  import("@/components/ui").then(mod => mod.Input)
);
```

---

### **4. Dynamic Import Libraries**

```typescript
"use client";

export default function SearchPage() {
  const handleSearch = async (query: string) => {
    // کتابخانه را فقط زمان جستجو import کن
    const Fuse = (await import("fuse.js")).default;
    const _ = (await import("lodash")).default;
    
    // استفاده از کتابخانه
    const fuse = new Fuse(data, { keys: ["name"] });
    const results = fuse.search(query);
  };

  return <input onChange={(e) => handleSearch(e.target.value)} />;
}
```

---

## 💡 مثال‌های کاربردی {#مثال‌ها}

### **مثال 1: Login Form با Dynamic Import**

```typescript
"use client";

import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";

const LoginForm = dynamic(
  () => import("@/components/auth/LoginForm").then(mod => mod.LoginForm),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-12">
        <Spinner className="size-8 text-primary" />
      </div>
    ),
  }
);

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <h1>ورود به پنل</h1>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  );
}
```

---

### **مثال 2: Modal با Intersection Observer**

```typescript
"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";

const VideoModal = dynamic(() => import("@/components/VideoModal"), {
  ssr: false,
  loading: () => <div>در حال بارگذاری ویدیو...</div>
});

export default function ProductPage() {
  const [showModal, setShowModal] = useState(false);
  const [loadModal, setLoadModal] = useState(false);

  // Preload modal وقتی user نزدیک دکمه است
  useEffect(() => {
    const button = document.getElementById("video-button");
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setLoadModal(true); // Preload
        }
      },
      { threshold: 0.5 }
    );

    if (button) observer.observe(button);
    return () => observer.disconnect();
  }, []);

  return (
    <div>
      <h1>محصول</h1>
      
      <button 
        id="video-button"
        onClick={() => setShowModal(true)}
      >
        مشاهده ویدیو
      </button>

      {loadModal && showModal && (
        <VideoModal onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}
```

---

### **مثال 3: Chart با Conditional Loading**

```typescript
"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

const HeavyChart = dynamic(() => import("@/components/HeavyChart"), {
  ssr: false,
  loading: () => (
    <div className="h-96 flex items-center justify-center">
      <div className="animate-pulse">در حال بارگذاری نمودار...</div>
    </div>
  )
});

export default function AnalyticsPage({ data }) {
  const [showChart, setShowChart] = useState(false);

  return (
    <div>
      <h1>آمار و تحلیل‌ها</h1>
      
      {!showChart ? (
        <button onClick={() => setShowChart(true)}>
          نمایش نمودار تفصیلی
        </button>
      ) : (
        <HeavyChart data={data} />
      )}
    </div>
  );
}
```

---

## 🎯 بهترین شیوه‌ها {#بهترین-شیوه‌ها}

### **1. همیشه Loading State تعریف کنید**

```typescript
// ❌ بد - بدون loading
const Modal = dynamic(() => import("./Modal"));

// ✅ خوب - با loading
const Modal = dynamic(() => import("./Modal"), {
  loading: () => <Spinner />
});

// ✅ عالی - با skeleton
const Modal = dynamic(() => import("./Modal"), {
  loading: () => <ModalSkeleton />
});
```

---

### **2. از Skeleton به جای Spinner استفاده کنید**

Skeleton تجربه کاربری بهتری ایجاد می‌کند.

```typescript
const ProductCard = dynamic(() => import("@/components/ProductCard"), {
  loading: () => (
    <div className="animate-pulse">
      <div className="h-48 bg-gray-200 rounded"></div>
      <div className="h-4 bg-gray-200 rounded mt-2"></div>
      <div className="h-4 bg-gray-200 rounded mt-2 w-2/3"></div>
    </div>
  )
});
```

---

### **3. Preload کردن زمان Hover**

```typescript
"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

const HeavyModal = dynamic(() => import("@/components/HeavyModal"));

export default function Page() {
  const [showModal, setShowModal] = useState(false);
  const [preload, setPreload] = useState(false);

  return (
    <div>
      <button
        onMouseEnter={() => setPreload(true)} // Preload on hover
        onClick={() => setShowModal(true)}
      >
        باز کردن Modal
      </button>

      {(showModal || preload) && showModal && <HeavyModal />}
    </div>
  );
}
```

---

### **4. استفاده از Bundle Analyzer**

```bash
npm install @next/bundle-analyzer

# در next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  // config
});

# اجرا
ANALYZE=true npm run build
```

---

### **5. مانیتور کردن Performance**

```typescript
// استفاده از Performance API
const startTime = performance.now();

const HeavyComponent = dynamic(() => import("@/components/Heavy"), {
  loading: () => {
    console.log("Loading started");
    return <Spinner />;
  }
});

// بعد از load
useEffect(() => {
  const endTime = performance.now();
  console.log(`Component loaded in ${endTime - startTime}ms`);
}, []);
```

---

## 🚫 اشتباهات رایج {#اشتباهات-رایج}

### **1. Dynamic Import در Component Body**

```typescript
// ❌ اشتباه
export default function Page() {
  const Modal = dynamic(() => import("./Modal")); // هر render دوباره ساخته می‌شود
  return <Modal />;
}

// ✅ صحیح - در بالای فایل
const Modal = dynamic(() => import("./Modal"));

export default function Page() {
  return <Modal />;
}
```

---

### **2. استفاده از Template String در Path**

```typescript
// ❌ اشتباه
const path = "./components/Modal";
const Modal = dynamic(() => import(path)); // کار نمی‌کند!

// ✅ صحیح
const Modal = dynamic(() => import("./components/Modal"));
```

---

### **3. بیش از حد Dynamic Import**

```typescript
// ❌ اشتباه - همه چیز dynamic
const Button = dynamic(() => import("./Button"));
const Icon = dynamic(() => import("./Icon"));
const Text = dynamic(() => import("./Text"));
// ... 50 کامپوننت دیگر

// ✅ صحیح - فقط کامپوننت‌های بزرگ
import { Button, Icon, Text } from "./ui";
const HeavyChart = dynamic(() => import("./HeavyChart"));
```

---

### **4. فراموش کردن ssr: false برای Browser APIs**

```typescript
// ❌ اشتباه - خطای SSR
const Editor = dynamic(() => import("./Editor"));

// ✅ صحیح
const Editor = dynamic(() => import("./Editor"), {
  ssr: false // Editor به window نیاز دارد
});
```

---

## 📊 چک‌لیست تصمیم‌گیری

برای تصمیم‌گیری که آیا باید dynamic import کنید یا نه:

```
✅ استفاده کن اگر:
  □ کامپوننت > 30KB است
  □ فقط با user interaction نیاز است (modal, dropdown)
  □ Below the fold است
  □ کتابخانه Third-party سنگین دارد
  □ به browser APIs نیاز دارد
  □ Conditional rendering دارد (feature flags)

❌ استفاده نکن اگر:
  □ Above the fold است
  □ کامپوننت < 5KB است
  □ برای SEO critical است
  □ LCP element است
  □ در Navigation یا Header است
  □ همیشه نیاز است
```

---

## 🎬 نتیجه‌گیری

Dynamic Import ابزار قدرتمندی است، اما باید **هوشمندانه** استفاده شود:

1. **فقط برای کامپوننت‌های بزرگ** (>30KB)
2. **فقط برای محتوای optional** (modals, tabs, below fold)
3. **همیشه با Loading State**
4. **مانیتور کردن با Bundle Analyzer**
5. **تست Performance با Lighthouse**

با استفاده درست از Dynamic Import، می‌توانید:
- ⚡ Initial load را تا 70% کاهش دهید
- 🚀 TTI را تا 5 برابر بهبود دهید  
- 📈 Core Web Vitals را بهبود دهید
- 💚 SEO score بالاتر بگیرید

---

**منابع:**
- [Next.js Official Docs - Lazy Loading](https://nextjs.org/docs/app/guides/lazy-loading)
- [Next.js Performance Optimization](https://nextjs.org/learn/seo/dynamic-imports)
- [Web.dev - Code Splitting](https://web.dev/code-splitting/)

**نسخه:** Next.js 15/16  
**تاریخ به‌روزرسانی:** دسامبر 2024