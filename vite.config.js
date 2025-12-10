import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Enable code splitting and chunk optimization
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunks for better caching
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'three-vendor': ['three'],
          'reactflow-vendor': ['reactflow'],
          'ui-vendor': ['lucide-react', 'zustand'],
        },
      },
    },
    // Increase chunk size warning limit (23 MB GLB model)
    chunkSizeWarningLimit: 1000,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
    exclude: ['@google/model-viewer'], // Lazy load if needed
  },
  // Enable compression
  server: {
    compress: true,
    // Force reload on file changes
    hmr: {
      overlay: true,
    },
    // Clear cache on server start
    force: true,
  },
})
