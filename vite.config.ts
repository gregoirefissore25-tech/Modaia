import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Modaia",
        short_name: "Modaia",
        description: "Ton style, en un swipe.",
        theme_color: "#141312",
        background_color: "#FAF8F4",
        display: "standalone",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" }
        ]
      }
    })
  ],
  server: {
    proxy: { "/api": "http://localhost:8888" }
  }
});
