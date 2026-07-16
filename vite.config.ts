import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  // Carga las variables del .env para usarlas en la config de Vite
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],

    server: {
      // Puerto configurable — default 5174
      port: parseInt(env.VITE_PORT ?? '5174'),
      host: true,

      // Proxy: en desarrollo, /api/* → backend en :8090
      // El navegador ve todo como mismo origen (:5174)
      proxy: {
        '/api': {
          target: env.VITE_BACKEND_URL ?? 'http://localhost:8090',
          changeOrigin: true,
          // Quita el prefijo /api antes de mandarlo al backend
          // /api/auth/login → /auth/login
          rewrite: (path: string) => path.replace(/^\/api/, ''),
        },
      },
    },

    build: {
      outDir: 'dist',
    },
  }
})