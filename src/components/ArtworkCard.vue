<script setup lang="ts">
  import { ref, computed, onMounted } from "vue";
  import { getRelativeLocaleUrl } from "astro:i18n";
  import { getArtistById } from "../services/collections";
  import type { Artwork, Artist } from "../types/types";
  import ImageCockpit from "../components/ImageCockpit.vue";

  interface Props {
    artwork: Artwork;
    currentLocale: string;
    classes?: string;
    priority?: boolean;
  }

  const props = withDefaults(defineProps<Props>(), {
    classes: "",
    priority: false,
  });

  const cardLink = computed(() =>
    getRelativeLocaleUrl(props.currentLocale, `/artworks/${props.artwork.slug}`)
  );

  const artist = ref<Artist | null>(null);

  onMounted(async () => {
    if (props.artwork.artist?._id) {
      try {
        artist.value = await getArtistById(
          props.artwork.artist._id,
          props.currentLocale
        );
      } catch (error) {
        console.warn(
          `Erreur lors de la récupération de l'artiste ${props.artwork.artist._id}:`,
          error
        );
      }
    }
  });
</script>

<template>
  <article :class="`${classes} flex rounded-md`" :data-key="artwork._id">
    <a class="grid grid-rows-[2fr_auto]" :href="cardLink">
      <div class="grid place-content-center">
        <ImageCockpit
          :image="artwork.image"
          :hover-image="artwork.image_hover || null"
          :width="700"
          :height="700"
          resize="bestFit"
          :quality="65"
          :priority="priority"
          :lazy="!priority"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          classes="aspect-square object-contain"
        />
      </div>
      <div class="border-t border-t-gray-300 pt-4 mt-4">
        <p class="font-medium">
          {{ artist ? artist.name : "Artiste inconnu" }}
        </p>
        <h3 class="pb-2">
          <span class="italic text-gray-800">{{ artwork.title }}</span>
          <span v-if="artwork.year" class="text-gray-600 font-normal">
            – {{ artwork.year }}
          </span>
        </h3>
        <p v-if="artwork.size" class="text-gray-500">
          {{ artwork.size }}
        </p>
        <p v-if="artwork.medium" class="text-gray-500">
          {{ artwork.medium }}
        </p>
      </div>
    </a>
  </article>
</template>
