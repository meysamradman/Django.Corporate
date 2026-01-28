import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    tsconfigPaths()
  ],
  server: {
    port: 5173,
    host: true,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        ws: true,
        cookieDomainRewrite: '',
        cookiePathRewrite: '/',
      },
    },
  },
  build: {
    cssCodeSplit: true, // Changed to true for better CSS caching
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React Core
          if (id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/react-router-dom/')) {
            return 'react-vendor';
          }

          // Radix UI - Split into smaller chunks
          if (id.includes('node_modules/@radix-ui/')) {
            return 'radix-ui';
          }

          // TanStack (React Query + Table)
          if (id.includes('node_modules/@tanstack/')) {
            return 'tanstack';
          }

          // Tiptap Editor
          if (id.includes('node_modules/@tiptap/') || id.includes('node_modules/prosemirror')) {
            return 'tiptap';
          }

          // Form Libraries
          if (id.includes('node_modules/react-hook-form') ||
            id.includes('node_modules/@hookform/') ||
            id.includes('node_modules/zod')) {
            return 'form-libs';
          }

          // Charts
          if (id.includes('node_modules/recharts')) {
            return 'charts';
          }

          // Maps
          if (id.includes('node_modules/leaflet') ||
            id.includes('node_modules/react-leaflet')) {
            return 'maps';
          }

          // State Management & HTTP
          if (id.includes('node_modules/zustand') ||
            id.includes('node_modules/axios')) {
            return 'data-vendor';
          }

          // Other large node_modules
          if (id.includes('node_modules/')) {
            return 'vendor';
          }
        },
        // Better chunk naming
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    minify: 'esbuild',
    target: 'esnext',
    sourcemap: false,
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Optimize asset inlining
    assetsInlineLimit: 4096,
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      '@tanstack/react-table',
      'axios',
      'zustand',
      'react-hook-form',
      '@hookform/resolvers',
      'zod',
    ],
  },
})
