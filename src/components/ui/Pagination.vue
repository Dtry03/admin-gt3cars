<template>
  <nav
    v-if="meta && meta.pageCount > 1"
    class="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6"
  >
    <div class="flex flex-1 justify-between sm:hidden">
      <button
        @click="changePage(meta.page - 1)"
        :disabled="meta.page === 1"
        class="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
      >
        Anterior
      </button>
      <button
        @click="changePage(meta.page + 1)"
        :disabled="meta.page === meta.pageCount"
        class="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
      >
        Siguiente
      </button>
    </div>
    <div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
      <div>
        <p class="text-sm text-gray-700">
          Mostrando
          <span class="font-medium">{{ (meta.page - 1) * meta.pageSize + 1 }}</span>
          a
          <span class="font-medium">{{ Math.min(meta.page * meta.pageSize, meta.total) }}</span>
          de
          <span class="font-medium">{{ meta.total }}</span>
          resultados
        </p>
      </div>
      <div>
        <nav
          class="isolate inline-flex -space-x-px rounded-md shadow-sm"
          aria-label="Pagination"
        >
          <button
            @click="changePage(meta.page - 1)"
            :disabled="meta.page === 1"
            class="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
          >
            <span class="sr-only">Anterior</span>
            <ChevronLeftIcon class="h-5 w-5" aria-hidden="true" />
          </button>
          
          <template v-for="page in pages" :key="page">
             <button
              @click="changePage(page)"
              :class="[
                'relative inline-flex items-center px-4 py-2 text-sm font-semibold',
                page === meta.page ? 'z-10 bg-primary text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary' : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
              ]"
            >
              {{ page }}
            </button>
          </template>

          <button
            @click="changePage(meta.page + 1)"
            :disabled="meta.page === meta.pageCount"
            class="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
          >
            <span class="sr-only">Siguiente</span>
            <ChevronRightIcon class="h-5 w-5" aria-hidden="true" />
          </button>
        </nav>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { StrapiPagination } from '@/types/strapi'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/20/solid'

const props = defineProps<{
  meta: StrapiPagination | null
}>()

const emit = defineEmits(['page-change'])

const changePage = (page: number) => {
  if (page < 1 || (props.meta && page > props.meta.pageCount) || page === props.meta?.page) {
    return
  }
  emit('page-change', page)
}

// Lógica simple de paginación (se puede hacer más compleja con '...')
const pages = computed(() => {
  if (!props.meta) return []
  const { page, pageCount } = props.meta
  const pagesToShow = 5
  let start = Math.max(1, page - Math.floor(pagesToShow / 2))
  let end = Math.min(pageCount, start + pagesToShow - 1)

  if (end - start + 1 < pagesToShow) {
    start = Math.max(1, end - pagesToShow + 1)
  }

  const pageNumbers: number[] = []
  for (let i = start; i <= end; i++) {
    pageNumbers.push(i)
  }
  return pageNumbers
})
</script>