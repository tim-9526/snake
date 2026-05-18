import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/snake/',
  test: {
    environment: 'node',
    include: ['src/**/*.test.{js,jsx}'],
  },
  server: {
    host: 'localhost',
  },
  build: {
    // Inline all assets into index.html so it works as a single file
    assetsInlineLimit: 100 * 1024 * 1024,
    rollupOptions: {
      output: {
        // Single chunk — no code splitting
        manualChunks: undefined,
        inlineDynamicImports: true,
      },
    },
  },
})
