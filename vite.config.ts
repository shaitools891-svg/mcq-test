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
    outDir: 'docs',
    rollupOptions: {
      output: {
        // Single bundle for simpler deployment
        manualChunks: undefined
      }
    }
  }
})
