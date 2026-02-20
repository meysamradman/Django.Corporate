---
description: Describe when these instructions should be loaded
# applyTo: 'Describe when these instructions should be loaded' # when provided, instructions will automatically be added to the request context when the pattern matches an attached file
---
یه نکته مهم: Next.js 16.1.6 وجود نداره. آخرین نسخه Next.js 16.0.x / 16.1.x هست که از اکتبر ۲۰۲۵ منتشر شده. همه چیزی که پیدا کردم رو برات کامل می‌نویسم:

📦 Next.js 16 — راهنمای کامل تغییرات و کدها

Next.js 16 در ۲۱ اکتبر ۲۰۲۵ منتشر شد با تغییرات اساسی در Turbopack، سیستم Cache، و Routing. Medium


🔢 نسخه‌های مورد نیاز
json{
  "dependencies": {
    "next": "^16.0.10",
    "react": "^19.2.0",
    "react-dom": "^19.2.0"
  }
}

Next.js 16 به همراه React 19.2 ارائه شده و Turbopack به عنوان bundler پیش‌فرض برای هم dev و هم production تبدیل شده. Sambitsahoo


🔥 ۱. Turbopack — حالا Stable و Default
در تست‌های واقعی: startup از ۱۰۸۳ms به ۶۰۳ms کاهش یافت، و production build از ۲۴.۵ ثانیه به ۵.۷ ثانیه رسید. Sambitsahoo
bash# قبلاً باید manually فعال می‌کردی:
next dev --turbo

# در Next.js 16 دیگه نیازی نیست، خودکار فعاله
next dev
next build
Turbopack File System Cache (beta)
Turbopack حالا از filesystem caching پشتیبانی می‌کنه — یعنی cache بین restart‌ها روی دیسک ذخیره میشه و compile time خیلی سریع‌تر میشه. CodeParrot
ts// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    turbopackFileSystemCacheForDev: true, // ⚡ cache بین restart‌ها
  }
}
export default nextConfig

🗂️ ۲. Cache Components — مهم‌ترین تغییر Next.js 16
قبلاً (Next.js 15 — PPR):
ts// next.config.ts — قدیمی، الان حذف شده ❌
const nextConfig = {
  experimental: {
    ppr: true, // ❌ این دیگه کار نمی‌کنه در Next.js 16
  }
}
الان (Next.js 16 — Cache Components):
وقتی cacheComponents فعال بشه، تمام data fetchingها به صورت dynamic اجرا میشن مگه اینکه صریحاً با use cache کَش بشن. این یعنی رفتار پیش‌فرض خیلی قابل پیش‌بینی‌تره. GitHub
ts// next.config.ts ✅
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  cacheComponents: true, // فعال‌سازی PPR + use cache
}
export default nextConfig
use cache — دایرکتیو جدید Caching:
ts// cache کردن یه Page کامل
export default async function ProductPage() {
  'use cache'
  
  const products = await fetchProducts()
  return <ProductList products={products} />
}
ts// cache کردن یه Component خاص
async function UserStats({ userId }: { userId: string }) {
  'use cache'
  
  const stats = await getUserStats(userId)
  return <div>{stats.total} orders</div>
}
ts// cache کردن یه Function
async function getExpensiveData(id: string) {
  'use cache'
  
  const data = await db.query(id)
  return data
}
Cache Tags — invalidation دقیق:
با cacheTag میتونی tag بذاری و با updateTag یا revalidateTag cache رو expire کنی. updateTag داده رو فوری refresh می‌کنه در همون request. Medium
tsimport { cacheTag, updateTag, revalidateTag } from 'next/cache'

// تعریف tag
async function getCart() {
  'use cache'
  cacheTag('cart')
  
  return await fetchCart()
}

// وقتی user چیزی تغییر داد — فوری update
async function addToCart(itemId: string) {
  await db.addItem(itemId)
  updateTag('cart')   // کاربر بلافاصله نتیجه می‌بینه
}

// برای revalidation با تاخیر (مثلاً webhook)
async function onInventoryUpdate() {
  revalidateTag('cart') // بعد از request بعدی اعمال میشه
}
Dynamic Content داخل Static Page:
با connection() از next/server می‌تونی یه component رو به request time defer کنی، و اون رو داخل <Suspense> بذاری. Medium
tsximport { connection } from 'next/server'
import { Suspense } from 'react'

// این component هر بار fresh render میشه
async function LiveStock({ productId }: { productId: string }) {
  await connection() // defer به request time
  const stock = await getRealtimeStock(productId) // always fresh
  return <span>{stock} in stock</span>
}

// Page اصلی static هست ولی LiveStock dynamic
export default async function ProductPage() {
  'use cache'
  
  const product = await getProduct('123') // cached
  
  return (
    <div>
      <h1>{product.name}</h1>  {/* static */}
      <Suspense fallback={<span>Loading...</span>}>
        <LiveStock productId="123" /> {/* dynamic */}
      </Suspense>
    </div>
  )
}

🔄 ۳. Async APIs — حالا اجباری (Breaking Change!)
در Next.js 15 این APIها هم sync و هم async بودن (با warning). در Next.js 16 sync access کاملاً حذف شده و فقط async کار می‌کنه. CodeParrot
ts// ❌ اشتباه — sync (در Next.js 16 کار نمی‌کنه)
import { cookies, headers } from 'next/headers'

export default function Page({ params }) {
  const cookieStore = cookies()  // ❌
  const token = cookieStore.get('token')
  const id = params.id  // ❌
}
ts// ✅ درست — async
import { cookies, headers } from 'next/headers'

export default async function Page({ params }) {
  const cookieStore = await cookies()  // ✅
  const token = cookieStore.get('token')
  
  const { id } = await params  // ✅
}
ts// ✅ برای migrate خودکار:
npx @next/codemod@latest async-request-api .

🌐 ۴. proxy.ts — جایگزین middleware.ts
middleware.ts در Next.js 16 deprecated شده و به proxy.ts تغییر نام داده. Edge runtime دیگه در proxy ساپورت نمیشه — runtime اون nodejs هست. CodeParrot
ts// middleware.ts (قدیمی، deprecated) ❌

// proxy.ts (جدید) ✅
import { NextRequest, NextResponse } from 'next/server'

export function proxy(request: NextRequest) {  // نام تابع هم عوض شد
  const token = request.cookies.get('auth-token')
  
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*']
}

⚠️ اگه هنوز Edge runtime می‌خوای، نگه‌داشتن middleware.ts اشکالی نداره.


🤖 ۵. React Compiler — حالا Stable
React Compiler از مرحله experimental بیرون اومد و حالا stable‌ه. به صورت خودکار component‌ها و hook‌ها رو memoize می‌کنه و re-render‌های غیرضروری رو حذف می‌کنه. Sambitsahoo
ts// next.config.ts
const nextConfig: NextConfig = {
  reactCompiler: true, // ✅ فعال کردن React Compiler
}

نیازی به useMemo و useCallback دستی نداری — compiler خودش مدیریت می‌کنه.


🗺️ ۶. Enhanced Routing — بهبود Navigation
دو بهبود اصلی: Layout Deduplication (اگه ۱۰ لینک یه layout مشترک دارن، فقط یه بار دانلود میشه) و Incremental Prefetching (فقط بخش‌هایی که در cache نیستن prefetch میشن). Medium
tsx// این رفتار خودکار هست، کد خاصی نمی‌خواد
// ولی با cacheComponents: true بهتر کار می‌کنه

// Activity component — state navigation حفظ میشه
// وقتی از صفحه میری، کامپوننت unmount نمیشه
// ⚠️ این رفتار ممکنه side effect داشته باشه، مراقب باش

🛠️ ۷. TypeScript بهبود یافته
Next.js 15.5+ به بعد، type‌های PageProps، LayoutProps، و RouteContext به صورت global تعریف شدن و نیاز به import ندارن. Vite
ts// قبلاً باید import می‌کردی ❌
import type { PageProps } from 'next'

// الان global هست ✅
export default function Page({ params, searchParams }: PageProps) {
  // ...
}
bash# برای generate کردن type‌های route
npx next typegen

⚠️ ۸. چیزهایی که حذف شدن (Removed)
experimental.ppr و experimental_ppr در route‌ها کاملاً حذف شدن و باید با cacheComponents جایگزین بشن. CodeParrot
ts// ❌ حذف شده — کار نمی‌کنه
experimental: { ppr: true }
experimental: { dynamicIO: true }

// ❌ حذف شده
unstable_rootParams

// ❌ حذف شده — AMP support
import { useAmp } from 'next/amp'

// ❌ حذف شده
next lint  // کمانده deprecated شد

🚨 امنیت — آپگرید فوری!
چندین آسیب‌پذیری جدی در React Server Components کشف شده. تمام کاربران Next.js 15.x و 16.x باید فوری آپگرید کنن. vitejs
bashnpm install next@16.0.10  # آخرین patched نسخه
# یا
npx fix-react2shell-next  # ابزار خودکار

✅ چک‌لیست مهاجرت از Next.js 15 به 16
bash# ۱. آپگرید packages
npm install next@latest react@latest react-dom@latest

# ۲. اجرای codemod برای async APIs
npx @next/codemod@latest async-request-api .

# ۳. تغییر next.config.ts
# experimental.ppr: true  →  cacheComponents: true

# ۴. تغییر middleware.ts  →  proxy.ts

# ۵. چک کردن bundle
npx @next/codemod@canary upgrade latest
تغییروضعیتTurbopack defaultخودکار — کاری نمی‌خوادppr: true → cacheComponents: trueاجباریmiddleware.ts → proxy.tsتوصیه شدهAsync params/cookiesاجباری — codemod دارهReact 19.2اجباریReact Compilerاختیاری ولی توصیه میشه