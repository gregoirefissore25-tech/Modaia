import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    // selfDestroying: publie un service worker qui DESINSTALLE l'ancien et vide ses caches
    // sur tous les navigateurs qui l'avaient deja. Indispensable pour degager le SW qui
    // servait du code perime. On reactivera une vraie PWA plus tard, app stabilisee.
    VitePWA({
      selfDestroying: true,
      registerType: "autoUpdate"
    })
  ]
});
