import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";
import { AppStoreProvider } from "./AppStoreProvider";
import { registerSW } from "virtual:pwa-register";
import { CartProvider } from "./CartContext";

// Detect if running in Tauri (desktop app)
const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;
const basename = isTauri ? '/' : '/vasoactive_drug_speed_estimatior_frontend';

const container = document.getElementById("root")!;
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <AppStoreProvider>
      <CartProvider>
        <BrowserRouter basename={basename}>
          <App />
        </BrowserRouter>
      </CartProvider>
    </AppStoreProvider>
  </React.StrictMode>
);

if ("serviceWorker" in navigator && !isTauri) {
  // Don't register service worker in Tauri (desktop app)
  registerSW();
}
