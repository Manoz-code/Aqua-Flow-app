
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      registerType: "autoUpdate",

      /*
       * Enable the PWA plugin during development so
       * /manifest.webmanifest is served correctly
       * instead of falling back to index.html.
       */
      devOptions: {
        enabled: true,
      },

      includeAssets: [
        "bhim-icon.svg",
        "favicon.svg",
      ],

      manifest: {
        name: "AquaFlow",
        short_name: "AquaFlow",
        description:
          "AquaFlow Offline Water Delivery Management",

        theme_color: "#0ea5e9",
        background_color: "#ffffff",

        display: "standalone",

        start_url: "/",
        scope: "/",
        lang: "en",

        icons: [
          {
            src: "/bhim-icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ],
});

