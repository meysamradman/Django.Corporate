---
description: Describe when these instructions should be loaded
# applyTo: 'Describe when these instructions should be loaded' # when provided, instructions will automatically be added to the request context when the pattern matches an attached file
---
۱. بهترین معماری Next.js 16 (از داک رسمی)
داک رسمی Next.js 16 سه استراتژی را معرفی می‌کنه: Next.js
استراتژی ۱ — فایل‌های پروژه بیرون از app (برای پروژه‌های بزرگ):
src/
├── components/
├── types/
├── core/
└── app/
    ├── layout.tsx
    └── (main)/
        ├── layout.tsx
        └── blog/page.tsx
استراتژی ۲ — Split by feature/route (توصیه برای پروژه‌ات):
src/
├── app/
│   ├── layout.tsx              ← Root layout (بیرون از main - برای i18n)
│   ├── (main)/
│   │   ├── layout.tsx
│   │   ├── blog/
│   │   │   ├── page.tsx
│   │   │   ├── _components/  ← کامپوننت خاص همین route
│   │   │   └── _hooks/       ← hook های همین اپ
│   │   └── portfolio/
│   │       └── page.tsx
├── components/                 ← shared components
├── types/                      ← interfaces
├── core/                       ← fetch config و غیره
└── public/
    └── fonts/
فولدر با _ prefix مثل _components یا _lib از routing خارج می‌شه — route نمی‌شه ولی colocate هست. Route Groups با (main) هم از URL حذف می‌شن. Next.js
نکته برای i18n: دو root layout جداگانه با route groups:
app/
├── (fa)/layout.tsx   ← لایوت فارسی با dir="rtl"
└── (en)/layout.tsx   ← لایوت انگلیسی

۲. SSR / CSR / use client — دقیقاً کجا؟
در Next.js 16 با cacheComponents: true، همه چیز به صورت پیش‌فرض داینامیک اجرا می‌شه مگه صریحاً cache کنی. Medium
قانون از داک رسمی:
Server Component (پیش‌فرض — بدون use client):

صفحه بلاگ، لیست نمونه‌کار، هر جا که داده از بک‌اند می‌گیری
هدر، فوتر، لایوت‌ها

use client فقط اینجاها:

فرم‌ها (state، event)
منوی موبایل (toggle)
اسلایدر و انیمیشن
هر چیزی که از useState، useEffect، onClick استفاده می‌کنه

Pattern درست برای SEO:
tsx// app/(main)/blog/page.tsx — Server Component — SSR/SSG
export default async function BlogPage() {
  const posts = await getPosts() // fetch server-side
  return (
    <>
      <BlogList posts={posts} />     {/* Server */}
      <SearchBar />                  {/* Client — 'use client' داخل خودش */}
    </>
  )
}
برای cache کردن در Next.js 16:
tsx'use cache'   // ← directive جدید Next.js 16
export async function getBlogPosts() {
  // این cache می‌شه
}
```

---

۴. تغییرات مهم Next.js 16 که باید رعایت کنی
۱. Async params — Breaking Change:
از Next.js 16، دسترسی synchronous به params و searchParams کاملاً حذف شده — فقط async کار می‌کنه. Medium
tsx// ❌ دیگه کار نمی‌کنه
export default function Page({ params }) {
  const { slug } = params
}

// ✅ درست
export default async function Page(props: PageProps<'/blog/[slug]'>) {
  const { slug } = await props.params
}
۲. middleware.ts تغییر نام داد به proxy.ts:
فایل middleware به proxy تغییر نام داده و export هم باید proxy باشه نه middleware. همچنین skipMiddlewareUrlNormalize به skipProxyUrlNormalize تغییر کرده. Medium
۳. Turbopack پیش‌فرض شده:
از Next.js 16، Turbopack به صورت پیش‌فرض در next dev و next build فعاله. اگه webpack config داری، build خطا می‌ده. باید با --webpack flag opt-out کنی. Medium
۴. cacheComponents جایگزین experimental.dynamicIO:
experimental.dynamicIO حذف شده و cacheComponents: true جایگزینش شده. experimental.ppr هم حذف شده. Medium
۵. React Compiler stable شد:
React Compiler که به صورت خودکار مموایز می‌کنه stable شد — دیگه experimental نیست. به صورت پیش‌فرض فعال نیست. Medium
۶. next lint حذف شد:
دستور next lint حذف شده — مستقیم از ESLint CLI استفاده کن. Medium
۷. Node.js حداقل 20.9.0 لازمه:
حداقل Node.js 20.9.0 و TypeScript 5.1.0 لازم داری. Medium

۵. next.config.ts برای پروژه‌ات
بر اساس داک رسمی Next.js 16:
tsimport type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // جایگزین experimental.dynamicIO
  cacheComponents: true,

  // React Compiler — auto memoization (stable در 16)
  reactCompiler: true,

  // Turbopack config — دیگه داخل experimental نیست
  turbopack: {
    // اگه alias لازم داری
  },

  // Turbopack filesystem cache (beta) — build سریع‌تر
  experimental: {
    turbopackFileSystemCacheForDev: true,
    optimizePackageImports: ['lucide-react', 'date-fns'],
  },

  // برای مدیا سرور خارجی (سوال ۶)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: process.env.MEDIA_HOSTNAME!,
        pathname: '/uploads/**',
      },
    ],
    // تغییرات breaking در Next.js 16
    minimumCacheTTL: 14400, // پیش‌فرض جدید = 4 ساعت
    qualities: [75],         // پیش‌فرض جدید
    formats: ['image/avif', 'image/webp'],
  },

  // امنیت
  poweredByHeader: false,
  reactStrictMode: true,
}

export default nextConfig

۶. مدیا مرکزی برای بک‌اند
images.domains در Next.js 16 deprecated شده — به جاش باید از images.remotePatterns استفاده کنی. Medium
ساختار پیشنهادی در core/media/:
ts// src/core/media/index.ts
const MEDIA_BASE = process.env.NEXT_PUBLIC_MEDIA_URL as string

export function mediaUrl(path: string): string {
  if (!path) return '/placeholder.jpg'
  if (path.startsWith('http')) return path
  return `${MEDIA_BASE}${path}`
}
tsx// src/components/media/MediaImage.tsx
import Image from 'next/image'
import { mediaUrl } from '@/core/media'

interface Props {
  src: string
  alt: string
  width: number
  height: number
  sizes?: string
  priority?: boolean
}

export function MediaImage({ src, alt, width, height, sizes, priority }: Props) {
  return (
    <Image
      src={mediaUrl(src)}
      alt={alt}
      width={width}
      height={height}
      sizes={sizes ?? '(max-width: 768px) 100vw, 50vw'}
      quality={75}
      {...(priority && { priority: true })}
    />
  )
}
استفاده در هر اپ بدون تکرار:
tsx// app/(main)/blog/[slug]/page.tsx
import { MediaImage } from '@/components/media/MediaImage'

export default async function BlogPost({ params }) {
  const { slug } = await params
  const post = await getPost(slug)
  return <MediaImage src={post.image} alt={post.title} width={800} height={400} priority />
}

خلاصه اصلاحات فوری:

middleware.ts → proxy.ts و function را هم به proxy تغییر بده
همه params را async کن
experimental.dynamicIO → cacheComponents: true
images.domains → images.remotePatterns
Turbopack config را از experimental.turbopack به top-level turbopack بیار



import type { NextConfig } from "next";

// ─── اعتبارسنجی URL بک‌اند (کد فعلی‌ات خوبه، نگه داشتم) ───────────────────
const backendOrigin = process.env.API_INTERNAL_ORIGIN?.trim();

if (!backendOrigin) {
  throw new Error(
    "🚨 CONFIGURATION ERROR: API_INTERNAL_ORIGIN is required in environment."
  );
}

let normalizedBackendOrigin: string;
let backendHostname: string;
let backendProtocol: "http" | "https";

try {
  const parsed = new URL(backendOrigin);
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("API_INTERNAL_ORIGIN must use http or https protocol.");
  }
  parsed.pathname = "";
  parsed.search = "";
  parsed.hash = "";
  normalizedBackendOrigin = parsed.toString().replace(/\/$/, "");
  backendHostname = parsed.hostname;
  backendProtocol = parsed.protocol === "https:" ? "https" : "http";
} catch {
  throw new Error(
    "🚨 CONFIGURATION ERROR: API_INTERNAL_ORIGIN must be a valid absolute URL."
  );
}

// ─── Next.js 16 Config ─────────────────────────────────────────────────────
const nextConfig: NextConfig = {

  // ── امنیت ──────────────────────────────────────────────────────────────
  poweredByHeader: false,       // header "X-Powered-By: Next.js" حذف می‌شه
  reactStrictMode: true,

  // ── Cache Components (جایگزین experimental.dynamicIO در Next.js 16) ───
  // داده‌ها به صورت پیش‌فرض داینامیک هستن مگر صریحاً 'use cache' بزنی
  // مستند: https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheComponents
  cacheComponents: true,

  // ── پروفایل‌های cache برای اپ‌های مختلف ──────────────────────────────
  // مستند: https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheLife
  cacheLife: {
    // برای بلاگ — محتوا کم تغییر می‌کنه
    blog: {
      stale: 60 * 60,          // 1 ساعت — کاربر این مدت محتوای قدیمی می‌بینه
      revalidate: 60 * 15,     // هر 15 دقیقه در بک‌گراند refresh می‌شه
      expire: 60 * 60 * 24,    // بعد از 24 ساعت حتماً حذف می‌شه
    },
    // برای نمونه‌کار — خیلی کم تغییر می‌کنه
    portfolio: {
      stale: 60 * 60 * 24,     // 24 ساعت
      revalidate: 60 * 60 * 6, // هر 6 ساعت
      expire: 60 * 60 * 24 * 7,// یک هفته
    },
    // برای داده‌های تقریباً ثابت مثل صفحه‌ی "درباره ما"
    static: {
      stale: 60 * 60 * 24 * 7,
      revalidate: 60 * 60 * 24,
      expire: 60 * 60 * 24 * 30,
    },
  },

  // ── React Compiler — در Next.js 16 stable شد ──────────────────────────
  // به صورت خودکار memoize می‌کنه — نیاز به useMemo/useCallback کمتر
  // مستند: https://nextjs.org/docs/app/api-reference/config/next-config-js/reactCompiler
  reactCompiler: true,

  // ── Turbopack (در Next.js 16 پیش‌فرضه — config از experimental خارج شد)
  // مستند: https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack
  turbopack: {
    // اگه alias نیاز داشتی اینجا بذار
    // resolveAlias: { 'fs': { browser: './src/core/empty.ts' } }
  },

  experimental: {
    // ── Turbopack filesystem cache (beta) — dev سریع‌تر ─────────────────
    // بین restart‌های dev server، cache روی disk نگه داشته می‌شه
    turbopackFileSystemCacheForDev: true,

    // ── tree-shaking بهتر برای پکیج‌های سنگین ──────────────────────────
    // barrel file ها رو مستقیم resolve می‌کنه، bundle کوچک‌تر می‌شه
    // پکیج‌هایی که استفاده می‌کنی اینجا اضافه کن
    optimizePackageImports: [
      "lucide-react",
      "date-fns",
      // "@radix-ui/react-icons", اگه استفاده می‌کنی
    ],
  },

  // ── تصاویر ────────────────────────────────────────────────────────────
  // مستند: https://nextjs.org/docs/app/api-reference/config/next-config-js/images
  images: {
    // images.domains در Next.js 16 deprecated شد — از remotePatterns استفاده کن
    remotePatterns: [
      // لوکال برای development
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/media/**",
      },
      // بک‌اند production — از ENV می‌خونه
      {
        protocol: backendProtocol,
        hostname: backendHostname,
        pathname: "/media/**",
      },
    ],

    // Breaking change در Next.js 16:
    // پیش‌فرض از 60 ثانیه به 4 ساعت تغییر کرده — برای مدیا سرور خودت بذار
    minimumCacheTTL: 60 * 60 * 24, // 24 ساعت — چون مدیا مرکزی داری

    // Breaking change در Next.js 16: پیش‌فرض فقط [75] شده
    qualities: [75, 90],   // اگه در کامپوننت quality دیگه‌ای دادی باید اینجا باشه

    // فرمت‌های بهینه
    formats: ["image/avif", "image/webp"],

    // Breaking change: 16 از imageSizes حذف شد
    // اگه نیاز به 16px داری:
    // imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // ── Proxy برای API و media بک‌اند ──────────────────────────────────────
  // توجه: در Next.js 16 فایل middleware.ts به proxy.ts تغییر نام داد
  // ولی rewrites در next.config همچنان کار می‌کنه و تغییری نداشته
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${normalizedBackendOrigin}/api/:path*/`,
      },
      {
        source: "/media/:path*",
        destination: `${normalizedBackendOrigin}/media/:path*`,
      },
    ];
  },

  // ── Security Headers ───────────────────────────────────────────────────
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
        ],
      },
      // CSP برای کل سایت پیشنهادی
      {
        source: "/(.*)",
        headers: [
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;