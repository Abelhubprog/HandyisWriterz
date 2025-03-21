<script setup lang="ts">
import { ref, watch } from 'vue'
import { useDebounce } from '@/composables/useDebounce'

const props = defineProps<{
  placeholder?: string
  initialQuery?: string
}>()

const emit = defineEmits<{
  (e: 'search', query: string): void
  (e: 'update:modelValue', value: string): void
}>()

const searchQuery = ref(props.initialQuery || '')
const debouncedSearch = useDebounce((query: string) => {
  emit('search', query)
}, 300)

watch(searchQuery, (newQuery) => {
  emit('update:modelValue', newQuery)
  debouncedSearch(newQuery)
})
</script>

<template>
  <div class="relative max-w-lg w-full">
    <div class="relative">
      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg
          class="h-5 w-5 text-gray-400"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fill-rule="evenodd"
            d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
            clip-rule="evenodd"
          />
        </svg>
      </div>
      <input
        v-model="searchQuery"
        type="text"
        :placeholder="placeholder || 'Search...'"
        class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
      />
    </div>
  </div>
</template>
