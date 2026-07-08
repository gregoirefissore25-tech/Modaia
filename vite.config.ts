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
      registerType: "autoUpdate",
      manifest: {
        name: "Modaia",
        short_name: "Modaia",
        description: "Ton style, en un swipe. Découvre des vêtements qui te ressemblent.",
        lang: "fr",
        start_url: "/",
        scope: "/",
        display: "standalone",
        background_color: "#FAF8F4",
        theme_color: "#141312",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" }
        ]
      }
    })
  ]
});
