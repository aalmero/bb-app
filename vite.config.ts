import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    host: '0.0.0.0', // Allow external connections for Docker
    watch: {
      usePolling: true, // Enable polling for Docker volume mounts
      interval: 1000 // Poll every second for changes
    },
    hmr: {
      port: 3001 // Ensure HMR uses the same port
    }
  }
})
