import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
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
        // ✅ حفظ session cookies
        cookieDomainRewrite: '',
        cookiePathRewrite: '/',
      },
    },
  },
  build: {
    // ✅ بهینه‌سازی برای production
    cssCodeSplit: false, // یک فایل CSS برای سرعت بیشتر
    rollupOptions: {
      output: {
        // ✅ Code splitting هوشمند
        manualChunks: {
          // React و React-DOM در یک chunk
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // UI components در یک chunk
          'ui-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-popover',
            '@radix-ui/react-tooltip',
          ],
          // Query و State management
          'data-vendor': ['@tanstack/react-query', 'zustand', 'axios'],
        },
      },
    },
    // ✅ Minification
    minify: 'esbuild',
    target: 'esnext',
    // ✅ Source maps فقط در development
    sourcemap: false,
  },
  // ✅ Optimization
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'axios',
      'zustand',
    ],
  },
})
