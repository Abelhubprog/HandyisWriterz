<script setup lang="ts">
interface Category {
  id: number
  name: string
  description: string
  image_url: string
  story_count: number
}

defineProps<{
  category: Category
}>()

defineEmits<{
  (e: 'click'): void
}>()
</script>

<template>
  <div
    class="group relative bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer"
    @click="$emit('click')"
  >
    <div class="aspect-w-16 aspect-h-9 overflow-hidden">
      <img
        :src="category.image_url || '/default-category.jpg'"
        :alt="category.name"
        class="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-300"
      />
    </div>
    <div class="p-6">
      <h3 class="text-xl font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors duration-300">
        {{ category.name }}
      </h3>
      <p class="mt-2 text-sm text-gray-600 line-clamp-2">
        {{ category.description }}
      </p>
      <div class="mt-4 flex items-center justify-between">
        <span class="text-sm font-medium text-gray-500">
          {{ category.story_count }} {{ category.story_count === 1 ? 'story' : 'stories' }}
        </span>
        <span class="inline-flex items-center text-sm font-medium text-indigo-600 group-hover:text-indigo-500">
          Explore
          <svg
            class="ml-2 w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
