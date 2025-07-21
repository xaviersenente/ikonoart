<template>
  <div class="form-field">
    <label :for="id" class="block text-sm font-medium text-gray-700 mb-2">
      {{ label }}
      <span v-if="required" class="text-red-600">*</span>
    </label>
    <select
      :id="id"
      :name="name"
      :required="required"
      :value="modelValue"
      @change="$emit('update:modelValue', $event.target.value)"
      :class="['form-select', classes]"
    >
      <option value="">{{ placeholder }}</option>
      <option
        v-for="option in options"
        :key="option.value"
        :value="option.value"
      >
        {{ option.label }}
      </option>
    </select>
  </div>
</template>

<script setup>
  defineProps({
    id: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    label: {
      type: String,
      required: true,
    },
    required: {
      type: Boolean,
      default: false,
    },
    options: {
      type: Array,
      required: true,
      validator: (options) =>
        options.every(
          (opt) =>
            typeof opt === "object" &&
            opt.value !== undefined &&
            opt.label !== undefined
        ),
    },
    modelValue: {
      type: [String, Number],
      default: "",
    },
    placeholder: {
      type: String,
      default: "Sélectionner une option",
    },
    classes: {
      type: String,
      default: "",
    },
  });

  defineEmits(["update:modelValue"]);
</script>

<!-- <style scoped>
.form-field {
  @apply mb-4;
}

.form-select {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md 
         focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent
         transition-colors duration-200 bg-white;
}
</style> -->
