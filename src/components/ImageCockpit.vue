<script setup lang="ts">
  import { ref, computed, onMounted } from "vue";
  import { getOptimizedImage } from "../services/cockpit";

  interface ImageData {
    _id: string;
    altText?: string;
  }

  interface Props {
    image: ImageData;
    width?: number;
    height?: number;
    resize?: string;
    classes?: string;
  }

  const props = withDefaults(defineProps<Props>(), {
    width: 400,
    height: 600,
    resize: "thumbnail",
    classes: "",
  });

  const optimizedUrl = ref<string | null>(null);

  onMounted(async () => {
    if (props.image?._id) {
      optimizedUrl.value = await getOptimizedImage(
        props.image._id,
        props.width,
        props.height,
        props.resize
      );
    }
  });
</script>

<template>
  <img
    v-if="optimizedUrl"
    :class="classes"
    :src="optimizedUrl"
    :alt="image.altText ?? 'image'"
    :width="width"
    :height="height"
  />
</template>
