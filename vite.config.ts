import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'
import { componentTagger } from 'lovable-tagger'

export default defineConfig(({ mode }) => ({
  // Use subdirectory for production (GitHub Pages), / for development
  base: mode === 'production' ? '/structured-todo-it/' : '/',
  server: {
    host: '::',
    port: 8080,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return undefined
          }

          if (id.includes('recharts')) {
            return 'charts'
          }

          if (id.includes('@supabase')) {
            return 'supabase'
          }

          if (id.includes('@tanstack/react-query')) {
            return 'query'
          }

          if (id.includes('react-router-dom')) {
            return 'router'
          }

          if (id.includes('@radix-ui')) {
            return 'radix'
          }

          if (id.includes('react-day-picker') || id.includes('date-fns')) {
            return 'calendar'
          }

          if (id.includes('@dnd-kit')) {
            return 'dnd'
          }

          return 'vendor'
        },
      },
    },
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
}))
