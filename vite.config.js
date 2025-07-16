import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // این بخش برای حل مشکل صفحه سفید اضافه شده است
  define: {
    'process.env': {}
  }
})
