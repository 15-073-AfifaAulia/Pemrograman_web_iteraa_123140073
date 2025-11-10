import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // ======================================
  // KONFIGURASI VITEST DITAMBAHKAN DI SINI
  // ======================================
  test: {
    environment: 'jsdom',
    globals: true, // Mengaktifkan API global seperti 'expect', 'describe', 'it'
  },
})