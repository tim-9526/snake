import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // GitHub Pages: https://tim-9526.github.io/snake/
  base: '/snake/',
  test: {
    environment: 'node',
    include: ['src/**/*.test.{js,jsx}'],
  },
  server: {
    host: '0.0.0.0',
  },
  build: {
    // Inline all assets into index.html for single-file deployment
    assetsInlineLimit: 100 * 1024 * 1024,
    rollupOptions: {
      output: {
        manualChunks: undefined,
        inlineDynamicImports: true,
      },
    },
  },
})
