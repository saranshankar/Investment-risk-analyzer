import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/system': 'http://127.0.0.1:8000',
      '/api': 'http://127.0.0.1:8000',
      '/analyze': 'http://127.0.0.1:8000',
      '/verification': 'http://127.0.0.1:8000',
      '/registry': 'http://127.0.0.1:8000',
      '/ocr': 'http://127.0.0.1:8000',
      '/health': 'http://127.0.0.1:8000',
    }
  }
})
