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
    // Inline small assets; let dynamic imports split naturally
    assetsInlineLimit: 100 * 1024 * 1024,
    rollupOptions: {
      output: {
        manualChunks: undefined,
        // REMOVED inlineDynamicImports: true — allows code splitting for lazy imports
      },
    },
  },
})
