<template>
  <div>
    <div class="flex justify-between items-center mb-6">
       <!-- CORRECCIÓN: Título añadido -->
 
      <router-link
        to="/articles/new"
        class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
      >
        <PlusIcon class="h-5 w-5 mr-2" />
        Añadir Artículo
      </router-link>
    </div>

    <!-- Lista -->
    <!-- CORRECCIÓN: Añadido overflow-x-auto -->
    <div class="bg-dark shadow-md rounded-lg overflow-hidden overflow-x-auto">
      <table class="min-w-full divide-y divide-secondary">
        <thead class="bg-dark">
          <tr>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Título</th>
            <!-- CORRECCIÓN: Ocultar en xs, mostrar desde sm -->
            <th scope="col" class="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Categoría</th>
            <!-- CORRECCIÓN: Ocultar en xs/sm, mostrar desde md -->
            <th scope="col" class="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Autor</th>
            <!-- CORRECCIÓN: Ocultar en xs/sm, mostrar desde md -->
            <th scope="col" class="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Fecha Pub.</th>
            <th scope="col" class="relative px-6 py-3"><span class="sr-only">Acciones</span></th>
          </tr>
        </thead>
        <tbody class="bg-dark divide-y divide-gray-200">
          <tr v-if="isLoadingList" class="text-center">
             <!-- CORRECCIÓN: Colspan ajustado a 2 (Título + Acciones) en móvil -->
             <td colspan="5" class="px-6 py-4 text-white">Cargando...</td>
          </tr>
          <tr v-else-if="!articles || articles.length === 0" class="text-center">
             <!-- CORRECCIÓN: Colspan ajustado -->
             <td colspan="5" class="px-6 py-4 text-white">No se encontraron artículos.</td>
          </tr>
          <tr v-else v-for="article in articles" :key="article.id">
            <td class="px-6 py-4 whitespace-nowrap">
               <div class="flex items-center">
                <div class="flex-shrink-0 h-10 w-10">
                  <img
                    class="h-10 w-10 rounded-full object-cover"
                    :src="getImageUrl(article.imagen_portada?.formats?.thumbnail?.url)"
                    alt="Imagen artículo"
                    @error="($event.target as HTMLImageElement).src = getImageUrl(null)"
                   />
                </div>
                <div class="ml-4">
                  <div class="text-sm font-medium text-white">{{ article.titulo || 'N/A' }}</div>
                </div>
              </div>
            </td>
            <!-- CORRECCIÓN: Ocultar en xs, mostrar desde sm -->
            <td class="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-white">{{ article.categoria?.nombre || 'N/A' }}</td>
            <!-- CORRECCIÓN: Ocultar en xs/sm, mostrar desde md -->
            <td class="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-white">{{ article.autor || 'N/A' }}</td>
            <!-- CORRECCIÓN: Ocultar en xs/sm, mostrar desde md -->
            <td class="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-white">{{ formatDate(article.fecha_publicacion) }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
              <router-link :to="`/articles/edit/${article.id}`" class="text-blue-400 hover:text-blue-800">Editar</router-link>
              <button @click="openDeleteModal(article)" class="text-red-600 hover:text-red-800">Eliminar</button>
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
      title="Eliminar Artículo"
      message="¿Estás seguro de que deseas eliminar este artículo? Esta acción no se puede deshacer."
      @close="showModal = false"
      @confirm="confirmDelete"
      variant="danger"
      confirm-text="Sí, Eliminar"
    />

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { articleService } from '@/services/articleService'
import type { Article } from '@/types' // Importa Article que incluye documentId?
import type { StrapiPagination } from '@/types/strapi'
import { PlusIcon } from '@heroicons/vue/24/solid'
import Pagination from '@/components/ui/Pagination.vue'
import Modal from '@/components/ui/Modal.vue'
import { useUiStore } from '@/stores/uiStore'

const uiStore = useUiStore()
const articles = ref<Article[]>([])
const pagination = ref<StrapiPagination | null>(null)
const currentPage = ref(1)
const isLoadingList = ref(false)

const showModal = ref(false)
const itemToDelete = ref<Article | null>(null) // Guarda el objeto completo

const queryParams = computed(() => ({
  populate: ['imagen_portada', 'categoria'], // 'autor' es string, no necesita populate
  pagination: {
    page: currentPage.value,
    pageSize: 10,
  },
  sort: 'fecha_publicacion:desc'
}))

const fetchItems = async () => {
  isLoadingList.value = true
  uiStore.clearError()
  try {
    const response = await articleService.find(queryParams.value)
    // Asume que find devuelve { data: [...], meta: ... }
    // CORRECCIÓN: Manejar caso donde response o response.data sea null/undefined
     if (Array.isArray(response)) {
       articles.value = response;
       pagination.value = null;
     } else if (response?.data) {
       articles.value = response.data || [];
       pagination.value = response.meta?.pagination || null;
     } else {
       articles.value = [];
       pagination.value = null;
     }
  } catch (error:any) {
    console.error("Error al cargar artículos:", error)
    uiStore.setError(`Error al cargar artículos: ${error.message}`)
  } finally {
    isLoadingList.value = false
  }
}

onMounted(fetchItems)
watch(currentPage, fetchItems)

const handlePageChange = (page: number) => {
  currentPage.value = page
}

// CORRECCIÓN: Recibir el objeto completo
const openDeleteModal = (item: Article) => {
  itemToDelete.value = item
  showModal.value = true
}

const confirmDelete = async () => {
  // CORRECCIÓN: Obtener documentId del objeto guardado
  const docId = itemToDelete.value?.documentId;
  if (docId) {
    try {
      await articleService.delete(docId) // Usar documentId
      fetchItems() // Recargar lista
    } catch (error:any) {
      console.error("Error al eliminar artículo:", error)
      uiStore.setError(`Error al eliminar artículo: ${error.message}`)
    } finally {
      showModal.value = false
      itemToDelete.value = null
    }
  } else {
     console.error("No se encontró documentId para eliminar:", itemToDelete.value);
      uiStore.setError("No se pudo eliminar el artículo porque falta el documentId.");
      showModal.value = false;
      itemToDelete.value = null;
  }
}

// CORRECCIÓN: Función getImageUrl robusta para API aplanada
const getImageUrl = (url?: string | null): string => {
  const placeholder = 'https://placehold.co/150x150/e2e8f0/94a3b8?text=Sin+Imagen';
  if (!url) return placeholder;

  if (url.startsWith('http://') || url.startsWith('https://')) return url;

  if (url.startsWith('/')) {
     const baseUrl = import.meta.env.VITE_API_URL;
     // CORRECCIÓN: Verificar baseUrl antes de usarlo
     return baseUrl ? `${baseUrl}${url}` : placeholder;
  }
  console.warn("getImageUrl: Formato de URL inesperado:", url);
  return placeholder;
}

const formatDate = (dateString?: string | null) => {
  if (!dateString) return 'N/A'
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; // Devuelve original si es inválida
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch (e){
    return dateString // Devuelve original si hay error en formato
  }
}
</script>