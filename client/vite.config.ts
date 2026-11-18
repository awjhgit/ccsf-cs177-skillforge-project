import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const apiPort = process.env.SKILLFORGE_API_PORT ?? '3001'
const proxy = { '/api': { target: `http://127.0.0.1:${apiPort}`, changeOrigin: false } }

export default defineConfig({
  plugins: [react()],
  server: { proxy },
  preview: { proxy },
})
