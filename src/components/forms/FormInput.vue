<template>
  <div class="form-field">
    <label :for="id" class="block text-sm font-medium text-gray-700 mb-2">
      {{ label }}
      <span v-if="required" class="text-red-600">*</span>
    </label>
    <input
      :type="type"
      :id="id"
      :name="name"
      :required="required"
      :placeholder="placeholder"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      :class="['form-input', classes]"
    />
  </div>
</template>

<script setup>
  defineProps({
    type: {
      type: String,
      default: "text",
      validator: (value) =>
        ["text", "email", "tel", "password", "number"].includes(value),
    },
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
    placeholder: {
      type: String,
      default: "",
    },
    modelValue: {
      type: [String, Number],
      default: "",
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

  .form-input {
    @apply w-full px-3 py-2 border border-gray-300 rounded-md 
         focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent
         transition-colors duration-200;
  }
</style> -->
