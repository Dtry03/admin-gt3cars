<template>
  <div>


    <form @submit.prevent="handleSubmit" class="space-y-6 bg-dark p-8 rounded-lg shadow-md">

      <!-- Fila 1: Modelo y Año -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label for="modelo" class="block text-sm font-medium text-white">Modelo</label>
          <input type="text" v-model="form.modelo" id="modelo" required class="mt-1 block w-full rounded-md border-secondary border-4 bg-dark text-gray-400 shadow-sm focus:border-primary focus:ring-primary sm:text-sm" />
        </div>
        <div>
          <label for="ano" class="block text-sm font-medium text-white">Año</label>
          <input type="number" v-model.number="form.ano" id="ano" required class="mt-1 block w-full rounded-md border-secondary border-4 bg-dark text-gray-400 shadow-sm focus:border-primary focus:ring-primary sm:text-sm" />
        </div>
      </div>

      <!-- Fila 2: Marca (Categoría eliminada) -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label for="brand" class="block text-sm font-medium text-white">Marca</label>
          <select v-model="form.marca" id="brand" required class="mt-1 block w-full rounded-md border-secondary border-4 bg-dark text-gray-400 shadow-sm focus:border-primary focus:ring-primary sm:text-sm">
            <option disabled :value="undefined">Selecciona una marca</option>
            <!-- CORRECCIÓN: Usar 'brand.nombre' si ese es el campo en el modelo Marca -->
            <option v-for="brand in brands" :key="brand.id" :value="brand.id">
              {{ brand.nombre }} <!-- Asumiendo que Marca tiene 'nombre', no 'modelo' -->
            </option>
          </select>
        </div>
        <!-- Campo de Categoría eliminado -->
      </div>

      <!-- Fila 3: Kilometraje, Precio y Estado -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label for="kilometraje" class="block text-sm font-medium text-white">Kilometraje</label>
          <input type="number" v-model.number="form.kilometraje" id="kilometraje" required class="mt-1 block w-full rounded-md border-secondary border-4 bg-dark text-gray-400 shadow-sm focus:border-primary focus:ring-primary sm:text-sm" />
        </div>
        <div>
          <label for="precio" class="block text-sm font-medium text-white">Precio (€)</label>
          <input type="number" step="0.01" v-model.number="form.precio" id="precio" required class="mt-1 block w-full rounded-md border-secondary border-4 bg-dark text-gray-400 shadow-sm focus:border-primary focus:ring-primary sm:text-sm" />
        </div>
        <div>
          <label for="estado" class="block text-sm font-medium text-white">Estado</label>
          <select v-model="form.estado" id="estado" required class="mt-1 block w-full rounded-md border-secondary border-4 bg-dark text-gray-400 shadow-sm focus:border-primary focus:ring-primary sm:text-sm">
            <option value="disponible">Disponible</option>
            <option value="vendido">Vendido</option>
          </select>
        </div>
      </div>

      <!-- Fila 4: Descripción (Rich Text) -->
      <div>
        <RichTextEditor label="Descripción" v-model="form.descripcion" />
      </div>

      <!-- Fila 5: Subida de Imágenes -->
      <div>
        <ImageUploader label="Imágenes del Vehículo" multiple @upload-success="handleImageUpload" />

        <div v-if="isEditing && existingImages.length > 0" class="mt-4">
          <h4 class="text-sm font-medium text-white mb-2">Imágenes Actuales</h4>
          <div class="grid grid-cols-3 md:grid-cols-5 gap-4">
            <div v-for="img in existingImages" :key="img.id" class="relative group">
              <img
                :src="getImageUrl(img.formats?.thumbnail?.url)"
                alt="Imagen actual"
                class="h-32 w-full object-cover rounded-md shadow-md"
              />
              <button
                type="button"
                @click="removeExistingImage(img.id)"
                class="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-75 group-hover:opacity-100 transition-opacity"
                title="Eliminar"
              >
                <XMarkIcon class="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Acciones -->
      <div class="flex justify-end space-x-4">
        <router-link
          to="/vehicles"
          class="px-4 py-2 bg-white    text-black rounded-md text-sm font-medium hover:bg-gray-50"
        >
          Cancelar
        </router-link>
        <button
          type="submit"
          :disabled="uiStore.isLoading || (isEditing && !currentItem?.documentId)"
          class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
        >
          {{ isEditing ? 'Actualizar Vehículo' : 'Crear Vehículo' }}
        </button>
      </div>

    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { vehicleService } from '@/services/vehicleService'
import { brandService } from '@/services/brandService'
// Importamos Vehicle que incluye documentId?
import type { Vehicle } from '@/types'
// import type { StrapiImage } from '@/types/strapi' // Usando 'any' para imagen aplanada
import { useUiStore } from '@/stores/uiStore'
import RichTextEditor from '@/components/forms/RichTextEditor.vue'
import ImageUploader from '@/components/forms/ImageUploader.vue'
import { XMarkIcon } from '@heroicons/vue/24/solid'

const props = defineProps({
  id: {
    type: String,
    default: null,
  },
})

// Interfaz del formulario usa nombres en español y sin categoría
interface VehicleFormState {
  modelo: string;
  ano: number;
  kilometraje: number;
  precio: number;
  descripcion: string;
  estado: 'disponible' | 'vendido';
  marca?: number; // ID de la marca
  imagenes: number[]; // IDs de las imágenes
}

const router = useRouter()
const uiStore = useUiStore()

const isEditing = computed(() => !!props.id)

// Estado inicial usa nombres en español y sin categoría
const form = ref<VehicleFormState>({
  modelo: '',
  ano: new Date().getFullYear(),
  kilometraje: 0,
  precio: 0,
  descripcion: '',
  estado: 'disponible',
  marca: undefined,
  imagenes: [],
})

const brands = ref<any[]>([]) // Usando 'any' para marca aplanada
const existingImages = ref<any[]>([]) // Usando 'any' para imagen aplanada
// Ref para guardar el item completo, incluyendo documentId
const currentItem = ref<Vehicle | null>(null);

const loadRelations = async () => {
  try {
    // CORRECCIÓN: Usar brandService.find y manejar ambas estructuras de respuesta
    const brandsResponse = await brandService.find({ pagination: { pageSize: 1000 } });

    // Verificar si la respuesta es { data: [...] } o solo [...]
    if (Array.isArray(brandsResponse)) {
      // API aplanada, devuelve el array directamente
      brands.value = brandsResponse;
    } else if (brandsResponse?.data && Array.isArray(brandsResponse.data)) {
      // API estándar, extraer el array de 'data'
      brands.value = brandsResponse.data;
    } else {
      // Estructura inesperada
      console.warn("Respuesta inesperada al cargar marcas:", brandsResponse);
      brands.value = [];
    }
  } catch (error:any) {
    console.error("Error cargando marcas:", error)
    uiStore.setError("Error al cargar las marcas.")
  }
}


const loadVehicleData = async () => {
  if (isEditing.value && props.id) { // Added check for props.id
    uiStore.setLoading(true)
    try {
      // Usamos 'marca' e 'imagenes' en el populate (sin categoría)
      const response = await vehicleService.findOne(Number(props.id), {
        populate: ['marca', 'imagenes']
      })

      // Asumimos API aplanada
      const data = response.data

      // Guardar el item completo
      currentItem.value = data;

      // Mapeo explícito a los nombres en español y aplanados
      form.value = {
        modelo: data.modelo || '',
        ano: data.ano,
        kilometraje: data.kilometraje,
        precio: data.precio,
        descripcion: data.descripcion || '',
        estado: (data.estado === 'disponible' || data.estado === 'vendido') ? data.estado : 'disponible',
        // Acceder al ID de la marca aplanada
        marca: data.marca?.id ?? undefined,
        // Mapear IDs de imágenes aplanadas
        imagenes: data.imagenes?.map((img: any) => img.id).filter((id: any) => id != null) || [],
      }
      // Guardar array de imágenes aplanadas
      existingImages.value = data.imagenes || []

    } catch (error:any) {
      console.error("Error cargando vehículo:", error)
      uiStore.setError(`Error al cargar los datos del vehículo: ${error.message}`)
      router.push('/vehicles') // Redirect on error
    } finally {
      uiStore.setLoading(false)
    }
  }
}

onMounted(() => {
  loadRelations()
  loadVehicleData()
})

const handleImageUpload = (uploadedIds: number[]) => {
  form.value.imagenes.push(...uploadedIds)
}

const removeExistingImage = (idToRemove: number) => {
  form.value.imagenes = form.value.imagenes?.filter(id => id !== idToRemove)
  existingImages.value = existingImages.value.filter(img => img.id !== idToRemove)
}

const handleSubmit = async () => {
  // Se usa 'marca' y se elimina 'category'
  if (!form.value.modelo || !form.value.marca) {
    uiStore.setError("Modelo y Marca son obligatorios.")
    return
  }

  const payload = { ...form.value }

  try {
    if (isEditing.value) {
       // Obtener documentId de currentItem
       const docId = currentItem.value?.documentId;
       if (!docId) {
         uiStore.setError("No se pudo obtener el documentId para actualizar. Refresca la página.");
          console.error("currentItem o documentId es nulo/undefined:", currentItem.value);
         return;
       }
      await vehicleService.update(docId, payload) // Pasar docId
    } else {
      await vehicleService.create(payload)
    }
    router.push('/vehicles')
  } catch (error:any) {
    console.error("Error al guardar el vehículo:", error)
     uiStore.setError(`Error al guardar el vehículo: ${error.message}`)
    // Axios interceptor handles UI error display
  }
}

// Función 'getImageUrl' actualizada para la API aplanada
const getImageUrl = (url?: string | null): string => {
  const placeholder = 'https://placehold.co/150x150/e2e8f0/94a3b8?text=Sin+Imagen';
  if (!url) {
       // console.log("getImageUrl: URL is null or undefined, using placeholder.");
       return placeholder;
   }

   // Check if URL is already absolute
   if (url.startsWith('http://') || url.startsWith('https://')) {
       // console.log("getImageUrl: URL is already absolute:", url);
       return url;
   }

  // If relative (starts with '/'), build with VITE_API_URL
  if (url.startsWith('/')) {
     const baseUrl = import.meta.env.VITE_API_URL;
      if (!baseUrl) {
        console.error("VITE_API_URL is not defined in .env");
        return placeholder;
      }
     const fullUrl = `${baseUrl}${url}`;
     // console.log("getImageUrl: Building absolute URL:", fullUrl);
     return fullUrl;
  }

  // If URL format is unexpected
  console.warn("getImageUrl: URL has an unexpected format, using placeholder:", url);
  return placeholder;
}
</script>