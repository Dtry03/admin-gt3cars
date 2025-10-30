<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold text-white">Solicitudes</h1>
    </div>

    <div class="bg-dark shadow-md rounded-lg overflow-hidden overflow-x-auto">
      <table class="min-w-full divide-y divide-secondary">
        <thead class="bg-dark">
          <tr>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Contacto</th>
            <th scope="col" class="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Teléfono</th>
            <!-- CORRECCIÓN: Eliminadas clases 'hidden' y 'md:table-cell' para que sea visible en móvil -->
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Estado</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Acciones</th>
          </tr>
        </thead>
        <tbody class="bg-dark divide-y divide-secondary">
          <tr v-if="isLoadingList" class="text-center">
             <td colspan="4" class="px-6 py-4 text-white">Cargando...</td>
          </tr>
          <tr v-else-if="!solicitudes || solicitudes.length === 0" class="text-center">
             <td colspan="4" class="px-6 py-4 text-white">No se encontraron solicitudes.</td>
          </tr>
          
          <tr v-else v-for="solicitud in solicitudes" :key="solicitud.id">
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm font-medium text-white">{{ solicitud.nombre || 'N/A' }}</div>
              <div class="text-sm text-gray-400">{{ solicitud.correo || 'N/A' }}</div>
            </td>
            
            <td class="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-white">
              {{ solicitud.telefono || 'N/A' }}
            </td>
            
            <!-- CORRECCIÓN: Eliminadas clases 'hidden' y 'md:table-cell' -->
            <td class="px-6 py-4 whitespace-nowrap">
              <span 
                class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full cursor-pointer hover:opacity-80 transition-opacity"
                :class="getStatusClass(solicitud.estado)"
                @click="changeStatus(solicitud)"
                title="Clic para cambiar estado"
              >
                {{ solicitud.estado || 'N/A' }}
              </span>
            </td>
            
            <td class="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
              <div class="flex items-center space-x-3">
                
                <button 
                  @click="openMessageModal(solicitud)"
                  class="text-gray-400 hover:text-white"
                  title="Ver Mensaje"
                >
                  <EyeIcon class="h-5 w-5" />
                </button>
                
                <a 
                  :href="'tel:' + solicitud.telefono"
                  class="text-blue-400 hover:text-blue-300"
                  title="Llamar"
                  v-if="solicitud.telefono"
                >
                  <PhoneIcon class="h-5 w-5" />
                </a>
                
                <a 
                  :href="'mailto:' + solicitud.correo"
                  class="text-blue-400 hover:text-blue-300"
                  title="Enviar Correo"
                  v-if="solicitud.correo"
                >
                  <EnvelopeIcon class="h-5 w-5" />
                </a>
                
                <button 
                  @click="openDeleteModal(solicitud)" 
                  class="text-red-500 hover:text-red-400"
                  title="Eliminar"
                >
                  <TrashIcon class="h-5 w-5" />
                </button>
                
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <Pagination :meta="pagination" @page-change="handlePageChange" class="mt-4" />

    <Modal
      :show="showDeleteModal"
      title="Eliminar Solicitud"
      :message="`¿Estás seguro de que deseas eliminar la solicitud de ${itemToDelete?.nombre}?`"
      @close="showDeleteModal = false"
      @confirm="confirmDelete"
      variant="danger"
      confirm-text="Sí, Eliminar"
      :show-cancel="true"
      :show-confirm="true"
    />
    
    <Modal
      :show="showMessageModal"
      :title="`Mensaje de ${selectedSolicitud?.nombre}`"
      @close="showMessageModal = false"
      :show-confirm="true"
      :show-cancel="false"
      variant="primary"
      confirm-text="Cerrar"
      @confirm="showMessageModal = false"
    >
      <p class="text-sm text-gray-300 whitespace-pre-wrap">{{ selectedSolicitud?.mensaje }}</p>
    </Modal>

  </div>
</template>


<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { solicitudService } from '@/services/solicitudService'
import type { Solicitud } from '@/types' 
import type { StrapiPagination } from '@/types/strapi'
import { PhoneIcon, EnvelopeIcon, EyeIcon, TrashIcon } from '@heroicons/vue/24/outline' 
import Pagination from '@/components/ui/Pagination.vue'
import Modal from '@/components/ui/Modal.vue'
import { useUiStore } from '@/stores/uiStore'

const uiStore = useUiStore()
const solicitudes = ref<Solicitud[]>([]) 
const pagination = ref<StrapiPagination | null>(null)
const currentPage = ref(1)
const isLoadingList = ref(false)

const showDeleteModal = ref(false)
const itemToDelete = ref<Solicitud | null>(null)

const showMessageModal = ref(false)
const selectedSolicitud = ref<Solicitud | null>(null)

const queryParams = computed(() => ({
  pagination: { page: currentPage.value, pageSize: 10 },
  sort: 'createdAt:desc' 
}))

const fetchItems = async () => {
  isLoadingList.value = true
  uiStore.clearError()
  try {
    const response = await solicitudService.find(queryParams.value)
     if (Array.isArray(response)) {
       solicitudes.value = response;
       pagination.value = null;
     } else if (response?.data) {
       solicitudes.value = response.data || [];
       pagination.value = response.meta?.pagination || null;
     } else {
       solicitudes.value = [];
       pagination.value = null;
     }
  } catch (error: any) { 
    console.error("Error al cargar solicitudes:", error)
    uiStore.setError(`Error al cargar solicitudes: ${error.message}`)
  } finally {
    isLoadingList.value = false
  }
}

onMounted(fetchItems)
watch(currentPage, fetchItems)

const handlePageChange = (page: number) => {
  currentPage.value = page
}

// Borrar
const openDeleteModal = (item: Solicitud) => {
  itemToDelete.value = item
  showDeleteModal.value = true
}

const confirmDelete = async () => {
  const docId = itemToDelete.value?.documentId;
  if (docId) {
    try {
      await solicitudService.delete(docId)
      fetchItems()
    } catch (error: any) { 
      console.error("Error al eliminar solicitud:", error)
      uiStore.setError(`Error al eliminar solicitud: ${error.message}`)
    } finally {
      showDeleteModal.value = false
      itemToDelete.value = null
    }
   } else {
     // Fallback al 'id' numérico si 'documentId' no está
     const fallbackId = itemToDelete.value?.id;
     if (!fallbackId) {
       uiStore.setError("No se pudo eliminar la solicitud porque falta el ID.");
       console.error("Falta ID o DocumentID:", itemToDelete.value);
       showDeleteModal.value = false;
       return;
     }
     console.warn(`Usando fallback 'id' (${fallbackId}) para eliminar. Considera asegurar que 'documentId' esté presente.`);
     try {
       await solicitudService.delete(fallbackId);
       fetchItems();
     } catch (error: any) { 
       console.error("Error al eliminar solicitud con fallback id:", error);
       uiStore.setError(`Error al eliminar solicitud: ${error.message}`);
     } finally {
       showDeleteModal.value = false;
       itemToDelete.value = null;
     }
   }
}

// Ver Mensaje
const openMessageModal = (item: Solicitud) => {
  selectedSolicitud.value = item;
  showMessageModal.value = true;
}

// --- NUEVA FUNCIÓN ---
// Define el ciclo de estados
const statusCycle: Solicitud['estado'][] = ['Nueva', 'En proceso', 'Resuelta'];

/**
 * Cambia el estado de una solicitud al siguiente estado en el ciclo.
 */
const changeStatus = async (solicitud: Solicitud) => {
  // Evitar clics múltiples mientras se está cargando
  if (uiStore.isLoading) return;

  const docId = solicitud.documentId;
  if (!docId) {
    uiStore.setError("No se pudo encontrar el documentId para actualizar.");
    console.error("Falta documentId en:", solicitud);
    return;
  }

  // 1. Encontrar el índice actual
  const currentIndex = statusCycle.indexOf(solicitud.estado);
  
  // 2. Determinar el siguiente índice (vuelve al inicio si es el último)
  const nextIndex = (currentIndex + 1) % statusCycle.length;
  const nextStatus = statusCycle[nextIndex];

  // 3. Crear el payload para la actualización (solo el campo que cambia)
  const payload = {
    estado: nextStatus
  };

  uiStore.setLoading(true);
  try {
    // 4. Llamar al servicio de actualización
    await solicitudService.update(docId, payload);
    
    // 5. Actualizar el estado localmente para una respuesta instantánea
    const itemInList = solicitudes.value.find(s => s.id === solicitud.id);
    if (itemInList) {
      itemInList.estado = nextStatus;
    }

  } catch (error: any) {
    console.error("Error al cambiar el estado:", error);
    uiStore.setError(`Error al cambiar el estado: ${error.message}`);
  } finally {
    uiStore.setLoading(false);
  }
}
// --- FIN NUEVA FUNCIÓN ---

// Estilo para el estado
const getStatusClass = (status?: string | null) => {
  if (status === 'Nueva') return 'bg-green-400 text-green-800'
  if (status === 'En proceso') return 'bg-red-400 text-red-800'
  if (status === 'Resuelta') return 'bg-blue-400 text-blue-800'
  return 'bg-yellow-100 text-yellow-800' // Por defecto
}
</script>

