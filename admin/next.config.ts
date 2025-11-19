import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // فقط برای CSR: SSG/SSR خاموش، pages معمولی کار می‌کنه
  reactStrictMode: true,
  trailingSlash: false,

  // Experimental تنظیمات اضافی حذف شد، فقط optimizePackageImports نگه داشته شد
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

  // تصاویر بدون فشرده سازی و فقط load مستقیم
  images: {
    unoptimized: true,
    formats: ["image/webp", "image/avif"], // می‌تونی حذف هم بکنی، اختیاری
    remotePatterns: [
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
    ],
  },

  compress: false, // خاموش کردن فشرده سازی
  poweredByHeader: false,

  typescript: {
    ignoreBuildErrors: false,
  },

  webpack: (config, { dev, isServer }) => {
    // SVGR loader برای import مستقیم SVG
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });

    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: "all",
          cacheGroups: {
            default: false,
            vendors: false,
            vendor: {
              name: "vendor",
              test: /[\\/]node_modules[\\/]/,
              chunks: "all",
              priority: 20,
            },
            common: {
              name: "common",
              minChunks: 2,
              chunks: "all",
              priority: 10,
              reuseExistingChunk: true,
              enforce: true,
            },
            lib: {
              test: /[\\/]node_modules[\\/](@tanstack|@radix-ui|lucide-react)[\\/]/,
              name: "lib",
              chunks: "all",
              priority: 30,
            },
          },
        },
        moduleIds: "deterministic",
        runtimeChunk: {
          name: "runtime",
        },
      };

      config.optimization.minimizer = [...config.optimization.minimizer];
    }

    return config;
  },
};

export default nextConfig;
