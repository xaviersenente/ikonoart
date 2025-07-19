<script setup lang="ts">
  import { ref, computed, onMounted } from "vue";
  import { getOptimizedImage } from "../services/cockpit";

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
  const optimizedUrl = ref<string | null>(null);
  const optimizedHoverUrl = ref<string | null>(null);
  const isHovered = ref(false);
  const isLoading = ref(true);
  const hasError = ref(false);

  // Optimisation contextuelle harmonisée avec Astro
  const contextualQuality = computed(() =>
    props.width > 1200 ? Math.max(props.quality, 80) : props.quality
  );

  const shouldGenerateSrcset = computed(() => props.width > 600);

  // Loading strategy harmonisée
  const loadingStrategy = computed(() =>
    props.priority ? "eager" : props.lazy ? "lazy" : "eager"
  );

  // Chargement des images optimisées
  onMounted(async () => {
    if (!props.image?._id) {
      hasError.value = true;
      isLoading.value = false;
      return;
    }

    try {
      // Image principale
      optimizedUrl.value = await getOptimizedImage(props.image._id, {
        width: props.width,
        height: props.height,
        resize: props.resize,
        quality: contextualQuality.value,
        format: props.format,
      });

      // Image hover si nécessaire
      if (props.hoverImage?._id) {
        optimizedHoverUrl.value = await getOptimizedImage(
          props.hoverImage._id,
          {
            width: props.width,
            height: props.height,
            resize: props.resize,
            quality: contextualQuality.value,
            format: props.format,
          }
        );
      }
    } catch (error) {
      console.error("Erreur lors du chargement des images:", error);
      hasError.value = true;
    } finally {
      isLoading.value = false;
    }
  });

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
    <!-- État de chargement -->
    <div
      v-if="isLoading"
      :class="`${classes} image-skeleton`"
      :style="`width: ${width}px; height: ${height}px; aspect-ratio: ${width}/${height}`"
    />

    <!-- État d'erreur -->
    <div
      v-else-if="hasError"
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
      v-if="legend && image.title && !isLoading && !hasError"
      class="text-sm text-gray-600 mt-2"
    >
      {{ image.title }}
    </figcaption>
  </figure>
</template>
