import { defineConfig } from 'vite'
import path from 'path'
import fs from 'fs'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],

  server: {
    // Expose on all network interfaces so LAN machines can reach the dev server
    host: true,
    https: (() => {
      const keyPath = path.resolve(__dirname, './backend/certs/key.pem');
      const certPath = path.resolve(__dirname, './backend/certs/cert.pem');
      if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
        return {
          key: fs.readFileSync(keyPath),
          cert: fs.readFileSync(certPath),
        };
      }
      return undefined;
    })(),
    proxy: {
      '/api': {
        target: 'https://localhost:3000',
        changeOrigin: true,
        // Allow self-signed TLS cert from the backend
        secure: false,
      },
      '/ws': {
        target: 'wss://localhost:3000',
        ws: true,
        changeOrigin: true,
        secure: false,
      },
      '/graphql': {
        target: 'https://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
