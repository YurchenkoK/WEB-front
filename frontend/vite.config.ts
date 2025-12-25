import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import mkcert from 'vite-plugin-mkcert'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendHost = env.VITE_BACKEND_HOST || '127.0.0.1';
  const backendPort = env.VITE_BACKEND_PORT || '8005';
  const minioHost = env.VITE_MINIO_HOST || 'host.docker.internal';
  const minioPort = env.VITE_MINIO_PORT || '9000';

  return {
    base: "/vasoactive_drug_speed_estimatior_frontend/",
    server: { 
      port: 3005,
      host: '0.0.0.0', // Слушаем на всех интерфейсах для доступа по IP
      strictPort: true,
      https: {}, // Включаем HTTPS через mkcert (пустой объект = автоматическая генерация сертификатов)
      cors: {
        origin: ['https://yurchenkok.github.io', 'http://localhost:3005', 'http://192.168.1.240:3005', 'https://192.168.1.240:3005'],
        credentials: true,
      },
      // ВАЖНО: Прокси работает ТОЛЬКО в режиме разработки (npm run dev)
      // В production (GH Pages) нужно указать VITE_API_BASE_URL в .env.production
      proxy: {
        "/api": {
          target: `http://${backendHost}:${backendPort}`,
          changeOrigin: true,
          secure: false,
          ws: true,
        },
        "/media": {
          target: `http://${backendHost}:${backendPort}`,
          changeOrigin: true,
          secure: false,
        },
        "/images": {
          target: `http://${minioHost}:${minioPort}`,
          changeOrigin: true,
          secure: false,
        },
      },
      watch: {
        usePolling: true,
      }, 
    },
    plugins: [
    react(),
    mkcert(),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: {
        enabled: false, // Отключаем Service Worker в dev режиме
      },
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "favicon-16x16.png", "favicon-32x32.png"],
      manifest: {
        name: "Калькулятор скорости инфузии вазоактивных препаратов",
        short_name: "VasoactiveDrugs",
        description: "Сервис для расчёта скорости инфузии вазоактивных препаратов",
        start_url: "/vasoactive_drug_speed_estimatior_frontend/",
        scope: "/vasoactive_drug_speed_estimatior_frontend/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#0033a0",
        icons: [
          { 
            src: "/vasoactive_drug_speed_estimatior_frontend/pwa-192x192.png", 
            sizes: "192x192", 
            type: "image/png",
            purpose: "any maskable"
          },
          { 
            src: "/vasoactive_drug_speed_estimatior_frontend/pwa-512x512.png", 
            sizes: "512x512", 
            type: "image/png",
            purpose: "any maskable"
          },
          {
            src: "/vasoactive_drug_speed_estimatior_frontend/apple-touch-icon.png",
            sizes: "180x180",
            type: "image/png"
          }
        ],
      },
    }),
  ],
  };
});
