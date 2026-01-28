import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: Number(process.env.PORT) || 5173,
  },
  resolve: {
    alias: {
      '@template/ui/web-styles': '/home/user/apps/2026/oxlayer/frontend/packages/@template/ui/src/styles/web-globals.css',
    },
  },
})
