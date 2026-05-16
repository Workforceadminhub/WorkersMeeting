import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "logo.jpg", "logo192.png", "logo512.png"],
      manifest: {
        name: "Workers Meeting",
        short_name: "Workers Meeting",
        description: "Workers Meeting attendance for Harvesters Gbagada",
        start_url: "/",
        display: "standalone",
        theme_color: "#1a1a2e",
        background_color: "#faf7f2",
        icons: [
          {
            src: "/logo192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/logo512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/logo512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        navigateFallback: "/index.html",
        globPatterns: ["**/*.{js,css,html,ico,png,jpg,svg,webmanifest}"],
        runtimeCaching: [
          {
            // Only cache the non-sensitive app_settings endpoint (meeting title)
            urlPattern: /^https:\/\/[a-z0-9-]+\.supabase\.co\/rest\/v1\/app_settings/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-settings",
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 5,
                maxAgeSeconds: 5 * 60,
              },
            },
          },
          // All other Supabase calls (worker data, attendance) are NOT cached
        ],
      },
    }),
  ],
  envPrefix: ["VITE_", "REACT_APP_"],
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: "build",
    sourcemap: false,
  },
});
