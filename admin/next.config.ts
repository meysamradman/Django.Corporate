import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Enable middleware and dynamic features for admin panel
  // output: 'export', // REMOVED - prevents middleware from working
  trailingSlash: false, // Better for SPA-style admin panel

  // Performance optimizations for admin panel
  experimental: {
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
    // Disable SSR features not needed for admin panel
    ppr: false,
    dynamicIO: false,
  },

  // Fast refresh for development
  reactStrictMode: true,

  images: {
    // Disable image optimization for better performance in admin
    unoptimized: true,
    // High quality image settings
    formats: ['image/webp', 'image/avif'], // Modern formats
    domains: ['localhost', '127.0.0.1'],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/media/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '8000',
        pathname: '/media/**',
      },
    ],
  },

  // Additional optimizations for client-side rendering
  compress: true,
  poweredByHeader: false,

  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },

  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: false,
  },

  // Webpack configuration for better performance
  webpack: (config, { dev, isServer }) => {
    // Optimize bundle size
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      };
    }

    return config;
  },
};

export default nextConfig;
