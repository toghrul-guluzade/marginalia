import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // "/" for a standalone deploy; change to "/research/" for a blog subdirectory.
  base: '/',
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        // Split the heavy pdfjs library and React runtime into their own chunks
        // so the app shell loads fast and caches independently.
        manualChunks(id) {
          if (id.includes('pdfjs-dist')) return 'pdfjs'
          if (
            id.includes('node_modules/react') ||
            id.includes('node_modules/react-dom') ||
            id.includes('node_modules/react-router')
          ) {
            return 'vendor'
          }
        },
      },
    },
  },
})
