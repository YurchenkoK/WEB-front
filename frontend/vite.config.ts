import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import mkcert from 'vite-plugin-mkcert'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendHost = env.VITE_BACKEND_HOST || '127.0.0.1';
  const backendPort = env.VITE_BACKEND_PORT || '8005';
  
  // Detect if building for Tauri (desktop app) or using CLI --base flag
  const isTauriBuild = process.env.TAURI_ENV_PLATFORM !== undefined || process.env.TAURI_PLATFORM !== undefined;
  const basePath = isTauriBuild ? '/' : '/vasoactive_drug_speed_estimatior_frontend/';

  return {
    base: basePath,
    server: { 
      port: 3006,
      host: '0.0.0.0', // Слушаем на всех интерфейсах для доступа по IP
      strictPort: true,
      // ВАЖНО: Прокси работает ТОЛЬКО в режиме разработки (npm run dev)
      // В production (GH Pages) нужно указать VITE_API_BASE_URL в .env.production
      proxy: {
        "/api": {
          target: `http://${backendHost}:${backendPort}`,
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
        enabled: true,
      },
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "favicon-16x16.png", "favicon-32x32.png"],
      manifest: {
        name: "Калькулятор скорости инфузии вазоактивных препаратов",
        short_name: "VasoactiveDrugs",
        description: "Сервис для расчёта скорости инфузии вазоактивных препаратов",
        start_url: basePath,
        scope: basePath,
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#0033a0",
        icons: [
          { 
            src: `${basePath}pwa-192x192.png`, 
            sizes: "192x192", 
            type: "image/png",
            purpose: "any maskable"
          },
          { 
            src: `${basePath}pwa-512x512.png`, 
            sizes: "512x512", 
            type: "image/png",
            purpose: "any maskable"
          },
          {
            src: `${basePath}apple-touch-icon.png`,
            sizes: "180x180",
            type: "image/png"
          }
        ],
      },
    }),
  ],
  };
});
