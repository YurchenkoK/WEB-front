import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";
import { AppStoreProvider } from "./AppStoreProvider";
import { registerSW } from "virtual:pwa-register";
import { CartProvider } from "./CartContext";

// Определяем basename: "/" для Tauri, путь репозитория для веб-версии
const basename = import.meta.env.BASE_URL || "/";

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

if ("serviceWorker" in navigator) {
  registerSW();
}
