<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <!-- CORRECCIÓN: Título añadido -->
      <h1 class="text-3xl font-bold text-white">Categorías</h1>
      <router-link
        to="/categories/new"
        class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
      >
        <PlusIcon class="h-5 w-5 mr-2" />
        Añadir Categoría
      </router-link>
    </div>

    <!-- CORRECCIÓN: Añadido overflow-x-auto -->
    <div class="bg-dark shadow-md rounded-lg overflow-hidden overflow-x-auto">
      <table class="min-w-full divide-y divide-secondary">
        <thead class="bg-dark">
          <tr>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Nombre</th>
            <!-- CORRECCIÓN: Ocultar descripción en pantallas pequeñas (xs), mostrar desde sm -->
            <th scope="col" class="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Descripción</th>
            <th scope="col" class="relative px-6 py-3"><span class="sr-only">Acciones</span></th>
          </tr>
        </thead>
        <tbody class="bg-dark divide-y divide-secondary">
          <tr v-if="isLoadingList" class="text-center">
             <!-- CORRECCIÓN: Colspan ajustado -->
             <td colspan="3" class="px-6 py-4 text-white">Cargando...</td>
          </tr>
          <tr v-else-if="!categories || categories.length === 0" class="text-center">
             <!-- CORRECCIÓN: Colspan ajustado -->
             <td colspan="3" class="px-6 py-4 text-white">No se encontraron categorías.</td>
          </tr>
          <tr v-else v-for="category in categories" :key="category.id">
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm font-medium text-white">{{ category.nombre || 'N/A' }}</div>
            </td>

          
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
              <router-link :to="`/categories/edit/${category.id}`" class="text-blue-400 hover:text-blue-800">Editar</router-link>
              <button @click="openDeleteModal(category)" class="text-red-600 hover:text-red-800">Eliminar</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <Pagination :meta="pagination" @page-change="handlePageChange" class="mt-4" />

    <Modal
      :show="showModal"
      title="Eliminar Categoría"
      message="¿Estás seguro de que deseas eliminar esta categoría? Esta acción no se puede deshacer."
      @close="showModal = false"
      @confirm="confirmDelete"
      variant="danger"
      confirm-text="Sí, Eliminar"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { categoryService } from '@/services/categoryService'
import type { Category } from '@/types' // Importa Category que incluye documentId?
import type { StrapiPagination } from '@/types/strapi'
import { PlusIcon } from '@heroicons/vue/24/solid'
import Pagination from '@/components/ui/Pagination.vue'
import Modal from '@/components/ui/Modal.vue'
import { useUiStore } from '@/stores/uiStore'

const uiStore = useUiStore()
const categories = ref<Category[]>([])
const pagination = ref<StrapiPagination | null>(null)
const currentPage = ref(1)
const isLoadingList = ref(false)

const showModal = ref(false)
const itemToDelete = ref<Category | null>(null)

const queryParams = computed(() => ({
  // Populate no es necesario si solo mostramos nombre/descripción
  pagination: { page: currentPage.value, pageSize: 10 },
  sort: 'nombre:asc'
}))

const fetchItems = async () => {
  isLoadingList.value = true
  uiStore.clearError()
  try {
    const response = await categoryService.find(queryParams.value)
     // Asume que find devuelve { data: [...], meta: ... } o [...] directamente
     if (Array.isArray(response)) {
       categories.value = response;
       pagination.value = null; // No hay paginación si la respuesta es array plano
     } else if (response?.data) {
       categories.value = response.data || [];
       pagination.value = response.meta?.pagination || null;
     } else {
       categories.value = [];
       pagination.value = null;
     }
  } catch (error:any) {
    console.error("Error al cargar categorías:", error)
    uiStore.setError(`Error al cargar categorías: ${error.message}`)
  } finally {
    isLoadingList.value = false
  }
}

onMounted(fetchItems)
watch(currentPage, fetchItems)

const handlePageChange = (page: number) => {
  currentPage.value = page
}

const openDeleteModal = (item: Category) => {
  itemToDelete.value = item
  showModal.value = true
}

const confirmDelete = async () => {
  const docId = itemToDelete.value?.documentId;
  if (docId) {
    try {
      await categoryService.delete(docId) // Usar documentId
      fetchItems() // Recargar lista
    } catch (error:any) {
      console.error("Error al eliminar categoría:", error)
      uiStore.setError(`Error al eliminar categoría: ${error.message}`)
    } finally {
      showModal.value = false
      itemToDelete.value = null
    }
   } else {
     console.error("No se encontró documentId para eliminar:", itemToDelete.value);
     uiStore.setError("No se pudo eliminar la categoría porque falta el documentId.");
     showModal.value = false;
     itemToDelete.value = null;
   }
}
</script>