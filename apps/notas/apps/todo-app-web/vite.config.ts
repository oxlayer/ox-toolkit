import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import type { Plugin } from 'vite'

// Custom plugin to fix sqlite3-opfs-async-proxy.js
// The file has `export {}` at the end which causes a syntax error when loaded
// in a worker context. We transform it to remove the problematic export.
function sqliteWasmPlugin(): Plugin {
  return {
    name: 'sqlite-wasm-fix',
    enforce: 'pre',
    transform(code, id) {
      if (id.includes('sqlite3-opfs-async-proxy.js')) {
        console.log('[sqlite-wasm-fix] Transforming sqlite3-opfs-async-proxy.js')
        // Remove the `export {}` statement that causes the syntax error
        const fixedContent = code.replace(/\n?export\s*{};?\s*$/, '\n')
        return {
          code: fixedContent,
          map: null,
        }
      }
      return null
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), sqliteWasmPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    // Force single React instance - fix "Cannot read properties of null (reading 'useContext')"
    dedupe: ['react', 'react-dom'],
  },
  server: {
    port: 3000,
    // COEP/COOP headers for SQLite WASM with SharedArrayBuffer
    // Using require-corp (not credentialless) to allow cookies from Keycloak
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  optimizeDeps: {
    exclude: ['@sqlite.org/sqlite-wasm'],
  },
  assetsInclude: ['**/*.wasm'],
})
