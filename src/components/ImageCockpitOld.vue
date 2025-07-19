<script setup lang="ts">
  import { ref, computed, onMounted } from "vue";
  import { getOptimizedImage } from "../services/cockpit";

  interface ImageData {
    _id: string;
    altText?: string;
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
  }

  const props = withDefaults(defineProps<Props>(), {
    width: 400,
    height: 600,
    resize: "bestFit",
    quality: 70,
    format: "webp",
    classes: "",
    hoverImage: null,
  });

  const optimizedUrl = ref<string | null>(null);
  const optimizedHoverUrl = ref<string | null>(null);
  const isHovered = ref(false);

  onMounted(async () => {
    if (props.image?._id) {
      optimizedUrl.value = await getOptimizedImage(props.image._id, {
        width: props.width,
        height: props.height,
        resize: props.resize,
        quality: props.quality,
        format: props.format,
      });
    }
    if (props.hoverImage?._id) {
      optimizedHoverUrl.value = await getOptimizedImage(props.hoverImage._id, {
        width: props.width,
        height: props.height,
        resize: props.resize,
        quality: props.quality,
        format: props.format,
      });
    }
  });

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
  <div
    v-if="optimizedUrl"
    class="relative"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <img
      v-if="optimizedUrl"
      :class="classes"
      :src="optimizedUrl"
      :alt="image.altText ?? 'image'"
      :width="width"
      :height="height"
    />
    <img
      v-if="optimizedHoverUrl"
      :class="[classes, { 'opacity-100': isHovered, 'opacity-0': !isHovered }]"
      :src="optimizedHoverUrl"
      :alt="hoverImage?.altText ?? 'image au survol'"
      :width="width"
      :height="height"
      class="absolute top-0 left-0 transition-opacity duration-300"
    />
  </div>
</template>
