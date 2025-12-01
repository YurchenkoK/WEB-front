import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import mkcert from 'vite-plugin-mkcert'

export default defineConfig(({ command }) => {
  // Определяем, собираем ли мы для Tauri
  // TAURI_ENV_PLATFORM устанавливается при `npm run tauri build` или `cargo tauri build`
  // Также проверяем TAURI_PLATFORM для совместимости
  const isTauriBuild = process.env.TAURI_ENV_PLATFORM || process.env.TAURI_PLATFORM || process.env.TAURI_DEBUG !== undefined;
  const basePath = isTauriBuild ? "/" : "/vasoactive_drug_speed_estimatior_frontend/";

  return {
    // Базовый путь: "/" для Tauri, путь репозитория для GitHub Pages
    base: basePath,
    server: { 
      port: 3000,
      host: true,  // Позволяет подключаться по IP адресу (не только localhost)
      strictPort: true,
      // Прокси для локальной разработки - перенаправляет /api запросы на Django бэкенд
      // Это позволяет обойти CORS проблемы при разработке
      // На GitHub Pages это не работает (статический хостинг), там используются mock данные
      proxy: {
        "/api": {
          target: "http://127.0.0.1:8000",  // Адрес локального Django сервера
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
      // mkcert() - автоматически создает и устанавливает локальные SSL сертификаты для HTTPS
      // Это необходимо для PWA, так как Service Worker требует HTTPS для работы
      // Сертификаты создаются автоматически при первом запуске npm run dev
      // После установки сервер будет доступен по https://localhost:3000 и https://<IP>:3000
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
})
