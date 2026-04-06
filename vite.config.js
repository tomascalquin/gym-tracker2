import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // "injectManifest" = usamos nuestro sw.js custom pero el plugin inyecta
      // automáticamente el precache manifest con TODOS los assets del build
      strategies: "injectManifest",
      srcDir: "public",
      filename: "sw.js",

      // Que el SW se active inmediatamente sin esperar a que se cierren tabs
      injectManifest: {
        // Inyecta self.__WB_MANIFEST en el sw.js
        injectionPoint: "self.__WB_MANIFEST",
      },

      // Registrar el SW automáticamente — esto lo saca de React y lo pone
      // en un script inline del HTML, lo que arregla iOS offline
      registerType: "autoUpdate",
      injectRegister: "inline",   // <-- inline en index.html, antes de React

      devOptions: {
        enabled: false,
      },

      manifest: {
        name: "Gym Tracker",
        short_name: "Gym",
        description: "Tu entrenamiento, siempre contigo",
        theme_color: "#080810",
        background_color: "#080810",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
        ],
      },
    }),
  ],

  build: {
    chunkSizeWarningLimit: 2000,
  },

  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
      "Cross-Origin-Embedder-Policy": "unsafe-none",
    },
  },
});
