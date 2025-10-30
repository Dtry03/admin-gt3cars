<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <!-- CORRECCIÓN: Título añadido -->
      <h1 class="text-3xl font-bold text-white">Vehículos</h1>
      <router-link
        to="/vehicles/new"
        class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
      >
        <PlusIcon class="h-5 w-5 mr-2" />
        Añadir Vehículo
      </router-link>
    </div>

    <!-- Lista de Vehículos -->
    <!-- CORRECCIÓN: Añadido overflow-x-auto para scroll horizontal si es necesario en pantallas muy pequeñas -->
    <div class="bg-black shadow-md rounded-lg overflow-hidden overflow-x-auto">
      <table class="min-w-full divide-y divide-secondary">
        <thead class="bg-dark">
          <tr>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Modelo</th>
            <!-- CORRECCIÓN: Ocultar en xs, mostrar desde sm -->
            <th scope="col" class="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Marca</th>
            <!-- CORRECCIÓN: Ocultar en xs/sm, mostrar desde md -->
            <th scope="col" class="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Año</th>
            <!-- CORRECCIÓN: Ocultar en xs/sm, mostrar desde md -->
            <th scope="col" class="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Estado</th>
            <th scope="col" class="relative px-6 py-3"><span class="sr-only">Acciones</span></th>
          </tr>
        </thead>
        <tbody class="bg-dark divide-y divide-secondary">
          <tr v-if="isLoadingList" class="text-center">
             <!-- CORRECCIÓN: Colspan ajustado a 2 (Modelo + Acciones) en móvil -->
             <td colspan="5" class="px-6 py-4 text-white">Cargando...</td>
          </tr>
          <tr v-else-if="!vehicles || vehicles.length === 0" class="text-center">
             <!-- CORRECCIÓN: Colspan ajustado -->
             <td colspan="5" class="px-6 py-4 text-white">No se encontraron vehículos.</td>
          </tr>
          <tr v-else v-for="vehicle in vehicles" :key="vehicle.id">
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center">
                <div class="flex-shrink-0 h-10 w-10">
                  <img
                    class="h-10 w-10 rounded-full object-cover"
                    :src="getFirstImageUrl(vehicle.imagenes)"
                    alt="Imagen vehículo"
                    @error="($event.target as HTMLImageElement).src = getImageUrl(null)" />
                </div>
                <div class="ml-4">
                  <!-- CORRECCIÓN: Color de texto blanco -->
                  <div class="text-sm font-medium text-white">{{ vehicle.modelo || 'N/A' }}</div>
                  <div class="text-sm text-white">{{ vehicle.precio?.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' }) || 'N/A' }}</div>
                </div>
              </div>
            </td>
            <!-- CORRECCIÓN: Ocultar en xs, mostrar desde sm -->
            <td class="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-white">{{ vehicle.marca?.nombre || 'N/A' }}</td>
            <!-- CORRECCIÓN: Ocultar en xs/sm, mostrar desde md -->
            <td class="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-white">{{ vehicle.ano || 'N/A'}}</td>
            <!-- CORRECCIÓN: Ocultar en xs/sm, mostrar desde md -->
            <td class="hidden md:table-cell px-6 py-4 whitespace-nowrap">
              <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                :class="getStatusClass(vehicle.estado)">
                {{ vehicle.estado }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
              <router-link :to="`/vehicles/edit/${vehicle.id}`" class="text-blue-400 hover:text-blue-800">Editar</router-link>
              <button @click="openDeleteModal(vehicle)" class="text-red-600 hover:text-red-800">Eliminar</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Paginación -->
    <Pagination :meta="pagination" @page-change="handlePageChange" class="mt-4" />

    <!-- Modal de Confirmación -->
    <Modal
      :show="showModal"
      title="Eliminar Vehículo"
      message="¿Estás seguro de que deseas eliminar este vehículo? Esta acción no se puede deshacer."
      @close="showModal = false"
      @confirm="confirmDelete"
      variant="danger"
      confirm-text="Sí, Eliminar"
    />

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { vehicleService } from '@/services/vehicleService'
import type { Vehicle } from '@/types' // Importa el tipo Vehicle que incluye documentId
import type { StrapiPagination} from '@/types/strapi'
import { PlusIcon } from '@heroicons/vue/24/solid'
import Pagination from '@/components/ui/Pagination.vue'
import Modal from '@/components/ui/Modal.vue'
import { useUiStore } from '@/stores/uiStore'

const uiStore = useUiStore()
const vehicles = ref<Vehicle[]>([])
const pagination = ref<StrapiPagination | null>(null)
const currentPage = ref(1)
const isLoadingList = ref(false)

const showModal = ref(false)
const itemToDelete = ref<Vehicle | null>(null) // Guarda el objeto completo

// Parámetros de consulta
const queryParams = computed(() => ({
  populate: ['marca', 'imagenes'], // Usar nombres en español
  pagination: {
    page: currentPage.value,
    pageSize: 10,
  },
  sort: 'createdAt:desc'
}))

const fetchVehicles = async () => {
  isLoadingList.value = true
  uiStore.clearError()
  try {
    // Asume que find devuelve { data: [...], meta: ... }
    const response = await vehicleService.find(queryParams.value)
     // Manejar ambas estructuras de respuesta
     if (Array.isArray(response)) {
       vehicles.value = response;
       pagination.value = null;
     } else if (response?.data) {
       vehicles.value = response.data || [];
       pagination.value = response.meta?.pagination || null;
     } else {
       vehicles.value = [];
       pagination.value = null;
     }
  } catch (error:any) {
    console.error("Error al cargar vehículos:", error)
    uiStore.setError(`Error al cargar vehículos: ${error.message}`)
  } finally {
    isLoadingList.value = false
  }
}

onMounted(fetchVehicles)

watch(currentPage, fetchVehicles)

const handlePageChange = (page: number) => {
  currentPage.value = page
}

const openDeleteModal = (item: Vehicle) => { // Recibe el objeto completo
  itemToDelete.value = item
  showModal.value = true
}

const confirmDelete = async () => {
  const docId = itemToDelete.value?.documentId; // Obtener documentId
  if (docId) {
    try {
      await vehicleService.delete(docId) // Usar documentId
      fetchVehicles() // Recargar la lista
    } catch (error:any) {
      console.error("Error al eliminar vehículo:", error)
       uiStore.setError(`Error al eliminar vehículo: ${error.message}`)
    } finally {
      showModal.value = false
      itemToDelete.value = null
    }
  } else {
     console.error("No se encontró documentId para eliminar:", itemToDelete.value);
      uiStore.setError("No se pudo eliminar el vehículo porque falta el documentId.");
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
     return baseUrl ? `${baseUrl}${url}` : placeholder;
  }
  console.warn("getImageUrl: Formato de URL inesperado:", url);
  return placeholder;
}

// CORRECCIÓN: Función para obtener la URL de la primera imagen del array aplanado
const getFirstImageUrl = (imagenes?: any[] | null): string => {
   // Usa optional chaining y fallback a array vacío
  const firstImage = (imagenes || [])[0];
  // Accede a formats.thumbnail.url directamente (aplanado)
  const thumbnailUrl = firstImage?.formats?.thumbnail?.url;
  return getImageUrl(thumbnailUrl); // Reutiliza getImageUrl para construir/validar
}


const getStatusClass = (status?: string | null) => {
  if (status === 'disponible') return 'bg-green-100 text-green-800' // Cambiado
  if (status === 'vendido') return 'bg-red-100 text-red-800' // Cambiado
  return 'bg-gray-100 text-gray-800'
}
</script>