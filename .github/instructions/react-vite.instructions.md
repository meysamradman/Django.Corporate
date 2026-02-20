---
description: Describe when these instructions should be loaded
# applyTo: 'Describe when these instructions should be loaded' # when provided, instructions will automatically be added to the request context when the pattern matches an attached file
---
⚙️ نسخه‌های مورد نیاز (Requirements)
Vite 7 نیاز به Node.js 20.19+ یا 22.12+ داره. Node.js 18 دیگه پشتیبانی نمیشه چون به EOL رسیده. Vite
json// package.json — versions مهم برای CRM admin
{
  "engines": { "node": ">=20.19" },
  "devDependencies": {
    "vite": "^7.3.1",
    "@vitejs/plugin-react-swc": "^3.x",  // SWC به جای Babel - خیلی سریع‌تر
    "rollup-plugin-visualizer": "^5.x"
  }
}
1. Browser Target جدید
در Vite 7 مقدار پیش‌فرض build.target از 'modules' به 'baseline-widely-available' تغییر کرده. این یعنی فقط مرورگرهایی که بیشتر از ۳۰ ماه پیش منتشر شدن target هستن. Vite
ts// vite.config.ts
export default defineConfig({
  build: {
    target: 'baseline-widely-available', // پیش‌فرض جدید Vite 7
    // یا اگه بخوای مرورگر قدیمی‌تر هم support کنی:
    // target: ['es2020', 'chrome80', 'firefox80']
  }
})
2. Sass Legacy API حذف شد
Vite 7 دیگه Sass legacy API رو پشتیبانی نمی‌کنه و فقط modern API داره. اگه از Sass استفاده می‌کنی باید آپشن css.preprocessorOptions.sass.api: 'legacy' رو حذف کنی. Syntackle
ts// ❌ اشتباه در Vite 7
css: { preprocessorOptions: { scss: { api: 'legacy' } } }

// ✅ درست - فقط modern API
css: { preprocessorOptions: { scss: { additionalData: `@use "./src/styles/variables" as *;` } } }
3. فقط ESM - دیگه CJS نیست
Vite 7 به صورت ESM-only توزیع میشه. این به خاطر پشتیبانی از require(esm) بدون flag در Node.js جدیده. Vite

🏗️ vite.config.ts بهینه برای CRM Admin Panel
tsimport { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { visualizer } from 'rollup-plugin-visualizer'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    // فقط در build، برای آنالیز bundle
    visualizer({ open: true, gzipSize: true, brotliSize: true })
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
    }
  },

  build: {
    target: 'baseline-widely-available', // Vite 7 default
    chunkSizeWarningLimit: 600, // کیلوبایت
    cssCodeSplit: true, // CSS هر chunk جداگانه
    
    rollupOptions: {
      output: {
        // تقسیم‌بندی هوشمند برای CRM
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['antd'], // یا '@mui/material'
          'chart-vendor': ['recharts'], // یا 'chart.js'
          'query-vendor': ['@tanstack/react-query'],
          'form-vendor': ['react-hook-form', 'zod'],
          'utils-vendor': ['axios', 'date-fns', 'lodash-es'],
        }
      }
    }
  },

  optimizeDeps: {
    include: [
      'react', 'react-dom',
      'lodash-es', // حتما pre-bundle بشه
      '@tanstack/react-query',
    ]
  },

  server: {
    port: 3000,
    warmup: {
      // صفحاتی که اول باز میشن pre-warm بشن
      clientFiles: ['./src/main.tsx', './src/pages/Dashboard.tsx']
    }
  }
})

📦 Lazy Loading برای روت‌های CRM
این مهم‌ترین کار برای پنل ادمینه. هر صفحه باید جداگانه load بشه:
tsx// src/router/index.tsx
import { lazy, Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'

// ✅ هر صفحه = یه chunk جداگانه
const Dashboard   = lazy(() => import('@pages/Dashboard'))
const Customers   = lazy(() => import('@pages/Customers'))
const Deals       = lazy(() => import('@pages/Deals'))
const Reports     = lazy(() => import('@pages/Reports'))
const Settings    = lazy(() => import('@pages/Settings'))

// لودر مشترک
const PageLoader = () => (
  <div className="flex h-screen items-center justify-center">
    <Spinner />
  </div>
)

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <Suspense fallback={<PageLoader />}>
        <Dashboard />
      </Suspense>
    )
  },
  {
    path: '/customers',
    element: (
      <Suspense fallback={<PageLoader />}>
        <Customers />
      </Suspense>
    )
  },
  // ...
])

⚡ بهینه‌سازی کتابخانه‌ها
از کتابخانه‌هایی که ES module دارن استفاده کن. به جای lodash از lodash-es استفاده کن تا tree-shaking درست کار کنه. CodeParrot
ts// ❌ اشتباه - کل lodash import میشه
import _ from 'lodash'

// ✅ درست - فقط همون تابعی که لازم داری
import { debounce, throttle } from 'lodash-es'

// ❌ اشتباه - کل antd یا MUI
import { Button } from 'antd'
// همینه ولی مطمئن شو tree-shaking کار می‌کنه

// ✅ بهتر برای آیکون‌ها - import مستقیم
import SearchOutlined from '@ant-design/icons/SearchOutlined'
// نه: import { SearchOutlined } from '@ant-design/icons'

🔧 Environment Variables در CRM
ts// .env
VITE_API_URL=https://api.yourcrm.com
VITE_APP_VERSION=1.0.0

// استفاده در کد
const apiUrl = import.meta.env.VITE_API_URL

⚠️ هر متغیری که با VITE_ شروع نشه، در مرورگر قابل دسترسی نیست.


📊 Rolldown - آینده Vite (اختیاری الان)
میتونی همین الان Rolldown-powered Vite رو امتحان کنی. این یه Rust-based bundler هست که بیلد رو خیلی سریع‌تر می‌کنه، مخصوصاً برای پروژه‌های بزرگ مثل CRM. Vite
json// برای تست Rolldown (اختیاری، در پروداکشن با احتیاط)
{
  "devDependencies": {
    "vite": "npm:rolldown-vite@latest"
  }
}

✅ چک‌لیست نهایی برای CRM Admin Panel
آیتموضعیتNode.js ≥ 20.19باید رعایت بشه@vitejs/plugin-react-swc به جای babel✅ سریع‌ترmanualChunks برای vendor ها✅ ضروریReact.lazy روی تمام صفحات✅ ضروریlodash-es به جای lodash✅ مهمcssCodeSplit: true✅ پیش‌فرض Viteحذف Sass legacy API✅ اجباری Vite 7visualizer برای آنالیز bundle✅ توصیه میشه