import type { NextConfig } from "next";

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

const nextConfig: NextConfig = {
  // ✅ CSR برای پنل ادمین - SSG/SSR خاموش
  reactStrictMode: true,
  trailingSlash: false,
  
  // ✅ بهینه‌سازی برای production
  // Note: swcMinify در Next.js 16 به صورت پیش‌فرض فعال است
  compress: isProduction, // فشرده‌سازی فقط در production
  poweredByHeader: false, // حذف header امنیتی
  
  // ✅ Output برای deploy بهتر (standalone برای Docker/VPS)
  output: 'standalone',
  
  // ✅ Source maps فقط در development
  productionBrowserSourceMaps: false, // امنیت بیشتر در production

  // ✅ Experimental: بهینه‌سازی import پکیج‌ها
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-accordion",
      "@radix-ui/react-alert-dialog",
      "@radix-ui/react-aspect-ratio",
      "@radix-ui/react-avatar",
      "@radix-ui/react-checkbox",
      "@radix-ui/react-collapsible",
      "@radix-ui/react-context-menu",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-hover-card",
      "@radix-ui/react-label",
      "@radix-ui/react-menubar",
      "@radix-ui/react-navigation-menu",
      "@radix-ui/react-popover",
      "@radix-ui/react-progress",
      "@radix-ui/react-radio-group",
      "@radix-ui/react-scroll-area",
      "@radix-ui/react-select",
      "@radix-ui/react-separator",
      "@radix-ui/react-slider",
      "@radix-ui/react-slot",
      "@radix-ui/react-switch",
      "@radix-ui/react-tabs",
      "@radix-ui/react-toggle",
      "@radix-ui/react-toggle-group",
      "@radix-ui/react-tooltip",
      "@tanstack/react-query",
      "@tanstack/react-table",
      "@tiptap/react",
      "@tiptap/starter-kit",
      "date-fns-jalali",
      "react-hook-form",
      "zustand",
      "sonner",
      "recharts",
      "embla-carousel-react",
      "cmdk",
    ],
  },

  // ✅ تصاویر: unoptimized برای CSR (پنل ادمین)
  // remotePatterns برای localhost (development) و production domain
  images: {
    unoptimized: true, // برای CSR و پنل ادمین
    formats: ["image/webp", "image/avif"], // فرمت‌های مدرن
    remotePatterns: [
      // Development
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/media/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "8000",
        pathname: "/media/**",
      },
      // Production - از environment variable استفاده می‌شود
      // می‌توانید domain خود را اضافه کنید:
      // {
      //   protocol: "https",
      //   hostname: "your-domain.com",
      //   pathname: "/media/**",
      // },
    ],
  },

  // ✅ TypeScript: خطاها را در build نشان می‌دهد
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // Note: ESLint در Next.js 16 به صورت پیش‌فرض در build اجرا می‌شود

  // ✅ Webpack: بهینه‌سازی bundle splitting برای production
  webpack: (config, { dev, isServer }) => {
    // SVGR loader برای import مستقیم SVG
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });

    // ✅ بهینه‌سازی فقط برای production و client-side
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: "all",
          cacheGroups: {
            default: false,
            vendors: false,
            // Vendor chunks (کتابخانه‌های خارجی)
            vendor: {
              name: "vendor",
              test: /[\\/]node_modules[\\/]/,
              chunks: "all",
              priority: 20,
              reuseExistingChunk: true,
            },
            // Common chunks (کد مشترک بین صفحات)
            common: {
              name: "common",
              minChunks: 2,
              chunks: "all",
              priority: 10,
              reuseExistingChunk: true,
              enforce: true,
            },
            // Library chunks (کتابخانه‌های پر استفاده)
            lib: {
              test: /[\\/]node_modules[\\/](@tanstack|@radix-ui|lucide-react)[\\/]/,
              name: "lib",
              chunks: "all",
              priority: 30,
              reuseExistingChunk: true,
            },
            // TipTap chunks (اگر استفاده می‌شود)
            tiptap: {
              test: /[\\/]node_modules[\\/]@tiptap[\\/]/,
              name: "tiptap",
              chunks: "all",
              priority: 25,
              reuseExistingChunk: true,
            },
          },
        },
        // ✅ Deterministic module IDs برای cache بهتر
        moduleIds: "deterministic",
        // ✅ Runtime chunk جداگانه برای cache بهتر
        runtimeChunk: {
          name: "runtime",
        },
      };
    }

    return config;
  },
};

export default withBundleAnalyzer(nextConfig);
