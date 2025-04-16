<script setup lang="ts">
  import { ref, computed, onMounted } from "vue";
  import { getRelativeLocaleUrl } from "astro:i18n";
  import { getArtistById } from "../services/collections";
  import type { Artwork, Artist } from "../types/types";
  import ImageCockpit from "../components/ImageCockpit.vue";

  interface Props {
    artwork: Artwork;
    currentLocale: string;
  }

  const props = defineProps<Props>();

  const cardLink = computed(() =>
    getRelativeLocaleUrl(props.currentLocale, `/artworks/${props.artwork.slug}`)
  );

  const artist = ref<Artist | null>(null);

  onMounted(async () => {
    if (props.artwork.artist?._id) {
      artist.value = await getArtistById(
        props.artwork.artist._id,
        props.currentLocale
      );
    }
  });
</script>

<template>
  <article class="flex rounded-md" :data-key="artwork._id">
    <a class="grid grid-rows-[2fr_auto]" :href="cardLink">
      <div class="grid place-content-center">
        <ImageCockpit
          :image="artwork.image"
          :width="700"
          :height="700"
          resize="bestFit"
          classes="aspect-square object-contain"
        />
      </div>
      <div class="border-t border-t-gray-300 pt-4 mt-4">
        <p class="font-medium">
          {{ artist ? artist.name : "Artiste inconnu" }}
        </p>
        <h2 class="pb-2">
          <span class="italic">{{ artwork.title }}</span
          >{{ artwork.year ? ` – ${artwork.year}` : "" }}
        </h2>
        <p class="text-gray-500">{{ artwork.size }}</p>
        <p class="text-gray-500">{{ artwork.medium }}</p>
      </div>
    </a>
  </article>
</template>
