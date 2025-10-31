<template>
  <div>
    <div class="flex justify-between items-center mb-6">

      <router-link
        to="/brands/new"
        class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
      >
        <PlusIcon class="h-5 w-5 mr-2" />
        Añadir Marca
      </router-link>
    </div>

    <!-- Lista -->
    <div class="bg-dark shadow-md rounded-lg overflow-hidden overflow-x-auto">
      <table class="min-w-full divide-y divide-secondary">
        <thead class="bg-dark">
          <tr>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Nombre</th>
            <th scope="col" class="relative px-6 py-3"><span class="sr-only">Acciones</span></th>
          </tr>
        </thead>
        <tbody class="bg-dark divide-y divide-secondary">
          <tr v-if="isLoadingList" class="text-center">
            <td colspan="2" class="px-6 py-4 text-white">Cargando...</td>
          </tr>
          <tr v-else-if="!brands || brands.length === 0" class="text-center">
            <td colspan="2" class="px-6 py-4 text-white">No se encontraron marcas.</td>
          </tr>
          <tr v-else v-for="brand in brands" :key="brand.id">
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center">
                <!-- Mostrar logo -->
                <div class="hidden sm:flex flex-shrink-0 h-10 w-10 rounded-full overflow-hidden bg-gray-100">
  <img
    class="h-full w-full object-cover"
    :src="getImageUrlFromLogo(brand.logo)"
    alt="Logo marca"
    @error="($event.target as HTMLImageElement).src = getImageUrlFromLogo(null)"
  />
</div>
                <div class="sm:ml-4">
                  <div class="text-sm font-medium text-white">{{ brand.nombre || 'N/A' }}</div>
                </div>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
              <router-link :to="`/brands/edit/${brand.id}`" class="text-blue-400 hover:text-blue-800">Editar</router-link>
              <button @click="openDeleteModal(brand)" class="text-red-600 hover:text-red-800">Eliminar</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Paginación -->
    <Pagination :meta="pagination" @page-change="handlePageChange" class="mt-4" />

    <!-- Modal -->
    <Modal
      :show="showModal"
      title="Eliminar Marca"
      message="¿Estás seguro de que deseas eliminar esta marca? Esta acción no se puede deshacer."
      @close="showModal = false"
      @confirm="confirmDelete"
      variant="danger"
      confirm-text="Sí, Eliminar"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { brandService } from '@/services/brandService'
import type { Brand } from '@/types'
import type { StrapiPagination } from '@/types/strapi'
import { PlusIcon } from '@heroicons/vue/24/solid'
import Pagination from '@/components/ui/Pagination.vue'
import Modal from '@/components/ui/Modal.vue'
import { useUiStore } from '@/stores/uiStore'

const uiStore = useUiStore()
const brands = ref<Brand[]>([])
const pagination = ref<StrapiPagination | null>(null)
const currentPage = ref(1)
const isLoadingList = ref(false)

const showModal = ref(false)
const itemToDelete = ref<Brand | null>(null)

const queryParams = computed(() => ({
  populate: ['logo'],
  pagination: {
    page: currentPage.value,
    pageSize: 10,
  },
  sort: 'nombre:asc'
}))

const fetchItems = async () => {
  isLoadingList.value = true
  uiStore.clearError()
  try {
    const response = await brandService.find(queryParams.value)

    if (Array.isArray(response)) {
      brands.value = response
      pagination.value = null
    } else if (response?.data) {
      brands.value = response.data || []
      pagination.value = response.meta?.pagination || null
    } else {
      brands.value = []
      pagination.value = null
    }
  } catch (error: any) {
    console.error("Error al cargar marcas:", error)
    uiStore.setError(`Error al cargar marcas: ${error.message}`)
  } finally {
    isLoadingList.value = false
  }
}

onMounted(fetchItems)
watch(currentPage, fetchItems)

const handlePageChange = (page: number) => {
  currentPage.value = page
}

const openDeleteModal = (item: Brand) => {
  itemToDelete.value = item
  showModal.value = true
}

const confirmDelete = async () => {
  const docId = itemToDelete.value?.documentId
  if (docId) {
    try {
      await brandService.delete(docId)
      fetchItems()
    } catch (error: any) {
      console.error("Error al eliminar marca:", error)
      uiStore.setError(`Error al eliminar marca: ${error.message}`)
    } finally {
      showModal.value = false
      itemToDelete.value = null
    }
  } else {
    console.error("No se encontró documentId para eliminar:", itemToDelete.value)
    uiStore.setError("No se pudo eliminar la marca porque falta el documentId.")
    showModal.value = false
    itemToDelete.value = null
  }
}

// ✅ FUNCIÓN ROBUSTA - Soporta arrays (Multiple Media)
const getImageUrlFromLogo = (logo: any): string => {
  const placeholder = 'https://placehold.co/150x150/e2e8f0/94a3b8?text=Sin+Logo'
  if (!logo) return placeholder

  // Si es Multiple Media → tomar el primero
  const image = Array.isArray(logo) ? logo[0] : logo
  if (!image) return placeholder

  const possibleUrl =
    image.url ||
    image?.data?.url ||
    image?.formats?.thumbnail?.url ||
    image?.formats?.small?.url ||
    image?.formats?.medium?.url ||
    image?.formats?.large?.url

  if (!possibleUrl) return placeholder

  const baseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
  let finalUrl = possibleUrl.startsWith('http')
    ? possibleUrl
    : `${baseUrl}${possibleUrl.startsWith('/') ? '' : '/'}${possibleUrl}`

  const ts = image.updatedAt ? new Date(image.updatedAt).getTime() : Date.now()
  return `${finalUrl}${finalUrl.includes('?') ? '&' : '?'}_=${ts}`
}
</script>
