import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Split large, stable third-party libraries into their own chunks so
        // they are cached independently of frequently-changing app code and
        // download in parallel with the entry bundle. Order matters: more
        // specific matches (react-router, react-dom) are checked before the
        // generic react match.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('recharts') || id.includes('/d3-') || id.includes('victory-vendor')) return 'charts';
          if (id.includes('framer-motion')) return 'motion';
          if (id.includes('react-router')) return 'router';
          if (id.includes('@tanstack')) return 'query';
          if (id.includes('@supabase')) return 'supabase';
          if (id.includes('react-hook-form') || id.includes('@hookform') || id.includes('zod')) return 'forms';
          if (id.includes('lucide-react')) return 'icons';
          if (
            id.includes('/react-dom/') ||
            id.includes('/react/') ||
            id.includes('/scheduler/') ||
            id.includes('/react-is/')
          ) return 'react';
          return undefined;
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    css: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/main.tsx',
        'src/vite-env.d.ts',
        'src/test/**',
        'src/styles/**',
        'src/types/**',
      ],
    },
  },
});
