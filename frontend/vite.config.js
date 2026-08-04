import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
  const apiUrl = env.VITE_API_URL
  let apiOrigin

  try {
    apiOrigin = apiUrl ? new URL(apiUrl).origin : undefined
  } catch {
    apiOrigin = undefined
  }

  return {
    plugins: [react()],
    server: {
      watch: {
        usePolling: true,
        interval: 120,
      },
      proxy: apiOrigin
        ? {
            "/api": {
              target: apiOrigin,
              changeOrigin: true,
            },
          }
        : undefined,
    },
  }
})
