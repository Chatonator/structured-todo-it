import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'
import { componentTagger } from 'lovable-tagger'

export default defineConfig(({ mode }) => ({
  // Détecte l'environnement Lovable vs GitHub Pages
  base: process.env.NODE_ENV === 'development' || 
        (typeof window !== 'undefined' && window.location.hostname.includes('lovable.dev')) ||
        (typeof window !== 'undefined' && window.location.hostname.includes('sandbox.lovable.dev')) 
        ? '/' : '/structured-todo-it/',
  server: {
    host: '::',
    port: 8080,
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

