import type { NextConfig } from "next";

const backendOrigin = process.env.API_INTERNAL_ORIGIN?.trim();

if (!backendOrigin) {
  throw new Error("🚨 CONFIGURATION ERROR: API_INTERNAL_ORIGIN is required in environment.");
}

let normalizedBackendOrigin: string;
let backendHostname: string;

try {
  const parsed = new URL(backendOrigin);
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('API_INTERNAL_ORIGIN must use http or https protocol.');
  }
  parsed.pathname = '';
  parsed.search = '';
  parsed.hash = '';
  normalizedBackendOrigin = parsed.toString().replace(/\/$/, '');
  backendHostname = parsed.hostname;
} catch {
  throw new Error("🚨 CONFIGURATION ERROR: API_INTERNAL_ORIGIN must be a valid absolute URL.");
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/media/**',
      },
      {
        protocol: 'https',
        hostname: backendHostname,
        pathname: '/media/**',
      },
    ],
  },

  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${normalizedBackendOrigin}/api/:path*/`,
      },
      {
        source: '/media/:path*',
        destination: `${normalizedBackendOrigin}/media/:path*`,
      },
    ];
  },

  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
        ],
      },
    ];
  },
};

export default nextConfig;