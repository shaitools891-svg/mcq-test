import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react()
  ],
  base: './',
  server: {
    host: true,
    port: 5173
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-ui': ['react', 'react-dom', 'react-router-dom', 'lucide-react', 'sonner']
        }
      }
    }
  }
})
