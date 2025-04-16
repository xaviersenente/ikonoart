// @ts-check
import { defineConfig } from "astro/config";

import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";

import vue from "@astrojs/vue";

import fs from "fs";
import path from "path";

// https://astro.build/config
export default defineConfig({
  // Avec les transitions de vue, le prefetch est activé par défaut.
  // Garder le prefetch, mais seulement pour les liens avec `data-astro-prefetch`.
  // prefetch: {
  //   prefetchAll: false
  // },
  hooks: {
    "astro:build:done": () => {
      const from = path.resolve("./public/_headers");
      const to = path.resolve("./dist/_headers");
      fs.copyFileSync(from, to);
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
  experimental: {
    svg: true,
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
