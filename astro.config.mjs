// @ts-check
import { defineConfig, envField } from "astro/config";

import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";

import vue from "@astrojs/vue";

// https://astro.build/config
export default defineConfig({
  // Requis par @astrojs/sitemap, et utilisé pour les URLs canoniques.
  site: "https://ikonoart.com",
  // Astro 7 est passé par défaut à `'jsx'`, qui supprime les espaces entre
  // éléments inline au lieu de les collapser. Cela mangeait par exemple
  // l'espace de `<strong>Medium :</strong>\n{valeur}`. On conserve les
  // règles HTML précédentes.
  compressHTML: true,
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
  image: {
    // Autorise l'optimisation au build des images servies par Cockpit.
    // Utilisé uniquement par ImageCockpitNative.astro, sur les visuels
    // au-dessus de la ligne de flottaison : accueil, portraits d'artistes,
    // couvertures d'expositions. Le catalogue des œuvres continue de passer
    // par les URLs Cockpit, pour ne pas alourdir le build de ~1 Go.
    remotePatterns: [{ protocol: "https", hostname: "cockpit.ikono.art" }],
  },
  env: {
    schema: {
      // Requis : le build échoue si le token est absent, plutôt que de se
      // rabattre silencieusement sur une valeur codée en dur.
      COCKPIT_API_TOKEN: envField.string({
        context: "server",
        access: "secret",
      }),
    },
  },
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
