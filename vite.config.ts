import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    strictPort: false,  // Allow Vite to use next available port if 5173 is in use
    host: '0.0.0.0',   // Listen on all interfaces
    middlewareMode: false,
  }
})
