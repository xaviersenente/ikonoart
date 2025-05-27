// @ts-check
import { defineConfig } from "astro/config";

import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";

import vue from "@astrojs/vue";

// https://astro.build/config
export default defineConfig({
  // Avec les transitions de vue, le prefetch est activé par défaut.
  // Garder le prefetch, mais seulement pour les liens avec `data-astro-prefetch`.
  // prefetch: {
  //   prefetchAll: false
  // },
  vite: {
    plugins: [tailwindcss()],
  },
  devToolbar: {
    enabled: false,
  },
  integrations: [sitemap(), vue()],
  i18n: {
    locales: ["en", "ja"],
    defaultLocale: "en",
    routing: {
      prefixDefaultLocale: true,
    },
  },
});
