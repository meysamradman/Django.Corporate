import type { NextConfig } from "next";

const backendOrigin = process.env.API_INTERNAL_ORIGIN?.trim();

if (!backendOrigin) {
  throw new Error("🚨 CONFIGURATION ERROR: API_INTERNAL_ORIGIN is required in environment.");
}

let normalizedBackendOrigin: string;
try {
  const parsed = new URL(backendOrigin);
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('API_INTERNAL_ORIGIN must use http or https protocol.');
  }
  parsed.pathname = '';
  parsed.search = '';
  parsed.hash = '';
  normalizedBackendOrigin = parsed.toString().replace(/\/$/, '');
} catch {
  throw new Error("🚨 CONFIGURATION ERROR: API_INTERNAL_ORIGIN must be a valid absolute URL.");
}

const nextConfig: NextConfig = {
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
};

export default nextConfig;
