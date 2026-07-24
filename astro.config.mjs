// @ts-check
import { defineConfig } from "astro/config";

import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";

import vue from "@astrojs/vue";

// https://astro.build/config
export default defineConfig({
  // Requis par @astrojs/sitemap, et utilisé pour les URLs canoniques.
  site: "https://ikonoart.com",
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
      // Depuis Astro 6 la valeur par défaut est `false` : on la remet
      // explicitement à `true` pour conserver le comportement précédent.
      redirectToDefaultLocale: true,
    },
  },
});
