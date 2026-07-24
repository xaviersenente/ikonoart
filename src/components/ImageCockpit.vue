<script setup lang="ts">
  import { computed, ref } from "vue";
  import { getOptimizedImage } from "../services/cockpitImages";

  interface ImageData {
    _id: string;
    altText?: string;
    title?: string;
  }

  interface Props {
    image: ImageData;
    hoverImage?: ImageData | null;
    width?: number;
    height?: number;
    resize?: "thumbnail" | "bestFit" | "resize" | "fitToWidth" | "fitToHeight";
    quality?: number;
    format?: "webp" | "jpeg" | "png";
    classes?: string;
    classesContainer?: string;
    legend?: boolean;
    priority?: boolean;
    lazy?: boolean;
    sizes?: string;
  }

  const props = withDefaults(defineProps<Props>(), {
    width: 400,
    height: 600,
    resize: "bestFit",
    quality: 70,
    format: "webp",
    classes: "",
    classesContainer: "",
    legend: false,
    priority: false,
    lazy: true,
    sizes: "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
    hoverImage: null,
  });

  // État réactif
  const isHovered = ref(false);
  const hasError = computed(() => !props.image?._id);

  // Optimisation contextuelle harmonisée avec Astro
  const contextualQuality = computed(() =>
    props.width > 1200 ? Math.max(props.quality, 80) : props.quality
  );

  const shouldGenerateSrcset = computed(() => props.width > 600);

  // Loading strategy harmonisée
  const loadingStrategy = computed(() =>
    props.priority ? "eager" : props.lazy ? "lazy" : "eager"
  );

  // Les URLs sont construites localement : plus d'appel réseau au montage,
  // donc plus d'état de chargement ni de squelette intermédiaire.
  const optimizedUrl = computed(() =>
    props.image?._id
      ? getOptimizedImage(props.image._id, {
          width: props.width,
          height: props.height,
          resize: props.resize,
          quality: contextualQuality.value,
          format: props.format,
        })
      : null
  );

  const optimizedHoverUrl = computed(() =>
    props.hoverImage?._id
      ? getOptimizedImage(props.hoverImage._id, {
          width: props.width,
          height: props.height,
          resize: props.resize,
          quality: contextualQuality.value,
          format: props.format,
        })
      : null
  );

  // Gestion des interactions hover
  const handleMouseEnter = () => {
    if (optimizedHoverUrl.value) {
      isHovered.value = true;
    }
  };

  const handleMouseLeave = () => {
    isHovered.value = false;
  };
</script>

<template>
  <figure
    :class="`${classesContainer} relative group`"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <!-- État d'erreur -->
    <div
      v-if="hasError"
      :class="`${classes} bg-gray-200 flex items-center justify-center text-gray-500`"
      :style="`width: ${width}px; height: ${height}px; aspect-ratio: ${width}/${height}`"
    >
      <span class="text-sm">Image indisponible</span>
    </div>

    <!-- Images chargées -->
    <template v-else-if="optimizedUrl">
      <!-- Image principale -->
      <img
        :class="`${classes} transition-opacity duration-300 ${optimizedHoverUrl ? 'group-hover:opacity-0' : ''}`"
        :src="optimizedUrl"
        :alt="image.altText ?? 'image'"
        :width="width"
        :height="height"
        :loading="loadingStrategy"
        :decoding="priority ? 'sync' : 'async'"
        :sizes="shouldGenerateSrcset ? sizes : undefined"
      />

      <!-- Image hover -->
      <img
        v-if="optimizedHoverUrl"
        :class="`${classes} absolute top-0 left-0 transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`"
        :src="optimizedHoverUrl"
        :alt="hoverImage?.altText ?? 'image au survol'"
        :width="width"
        :height="height"
        loading="lazy"
        decoding="async"
      />
    </template>

    <!-- Légende harmonisée -->
    <figcaption
      v-if="legend && image.title && !hasError"
      class="text-sm text-gray-600 mt-2"
    >
      {{ image.title }}
    </figcaption>
  </figure>
</template>
