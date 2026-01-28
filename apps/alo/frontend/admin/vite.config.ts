import 'dotenv/config'

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

const PORT = Number(process.env.PORT)

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // '@acme/ui': path.resolve(__dirname, '../../../../frontend/packages/@acme/ui/src'),
      // '@oxlayer/ui': path.resolve(__dirname, '../../../../frontend/packages/@oxlayer/ui/src'),
    },
  },
  server: {
    port: PORT,
  }
})
