import type { NextConfig } from 'next'

const rawOrigin = process.env.API_INTERNAL_ORIGIN?.trim()
if (!rawOrigin) {
  throw new Error('🚨 API_INTERNAL_ORIGIN is required in .env.local')
}

let backendHostname: string
let backendProtocol: 'http' | 'https'
let backendOrigin: string

try {
  const parsed = new URL(rawOrigin)
  backendHostname = parsed.hostname
  backendProtocol = parsed.protocol === 'https:' ? 'https' : 'http'
  backendOrigin   = rawOrigin.replace(/\/$/, '')
} catch {
  throw new Error('🚨 API_INTERNAL_ORIGIN باید URL معتبر باشه — مثل http://localhost:8000')
}

const nextConfig: NextConfig = {

  poweredByHeader: false,
  reactStrictMode: true,
  cacheComponents: true,
  reactCompiler: false,
  turbopack: {},

  experimental: {
    turbopackFileSystemCacheForDev: true,
    optimizePackageImports: ['lucide-react', 'date-fns'],

    // ✅ درست — داخل experimental
    serverActions: {
      allowedOrigins: [
        process.env.NEXT_PUBLIC_SITE_URL?.replace(/^https?:\/\//, '') || 'localhost:3000',
      ],
    },
  },

  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port:     '8000',
        pathname: '/media/**',
      },
      {
        protocol: backendProtocol,
        hostname: backendHostname,
        pathname: '/media/**',
      },
    ],
    minimumCacheTTL: 60 * 60 * 24,
    qualities:       [75, 90],
    formats:         ['image/avif', 'image/webp'],
  },

  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${backendOrigin}/api/:path*/`,
      },
      {
        source: '/media/:path*',
        destination: `${backendOrigin}/media/:path*`,
      },
    ]
  },

  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options',        value: 'DENY' },
          { key: 'X-XSS-Protection',       value: '1; mode=block' },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ]
  },
}

export default nextConfig