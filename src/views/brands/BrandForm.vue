<template>
  <div>
  

    <form @submit.prevent="handleSubmit" class="space-y-6 bg-dark p-8 rounded-lg shadow-md max-w-2xl mx-auto">

      <!-- Nombre -->
      <div>
        <label for="nombre" class="block text-sm font-medium text-white">Nombre</label>
        <input type="text" v-model="form.nombre" id="nombre" required class="mt-1 block w-full rounded-md bg-dark text-gray-400 border-4 border-secondary shadow-sm focus:border-primary focus:ring-primary sm:text-sm" />
      </div>

      <!-- Logo -->
      <div>
        <ImageUploader label="Logo" :multiple="false" @upload-success="handleImageUpload" />

        <div v-if="isEditing && existingLogo" class="mt-4">
          <h4 class="text-sm font-medium text-white mb-2">Logo Actual</h4>
          <div class="relative group w-32">
            <img
              :src="getImageUrl(existingLogo.formats?.thumbnail?.url)"
              alt="Logo actual"
              class="h-32 w-32 object-cover rounded-md shadow-md"
            />
            <button
              type="button"
              @click="removeExistingImage"
              class="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-75 group-hover:opacity-100 transition-opacity"
              title="Eliminar"
            >
              <XMarkIcon class="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <!-- Botones -->
      <div class="flex justify-end space-x-4">
        <router-link
          to="/brands"
          class="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancelar
        </router-link>
        <button
          type="submit"
          :disabled="uiStore.isLoading || (isEditing && !currentItem?.documentId)"
          class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
        >
          {{ isEditing ? 'Actualizar' : 'Crear' }}
        </button>
      </div>

    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { brandService } from '@/services/brandService'
import type { Brand } from '@/types' // Import Brand type which includes documentId?
// import type { StrapiImage } from '@/types/strapi' // Using 'any' for flattened logo
import { useUiStore } from '@/stores/uiStore'
import ImageUploader from '@/components/forms/ImageUploader.vue'
import { XMarkIcon } from '@heroicons/vue/24/solid'

const props = defineProps({
  id: {
    type: String,
    default: null,
  },
})

interface BrandFormState {
  nombre: string;
  logo: number | null; // ID of the logo image
}

const router = useRouter()
const uiStore = useUiStore()

const isEditing = computed(() => !!props.id)

const form = ref<BrandFormState>({
  nombre: '',
  logo: null,
})

const existingLogo = ref<any | null>(null) // Using 'any' for flattened logo object
// CORRECCIÓN: Ref to store the full current item, including documentId
const currentItem = ref<Brand | null>(null);

const loadItemData = async () => {
  if (isEditing.value && props.id) { // Added check for props.id
    uiStore.setLoading(true)
    try {
      // findOne uses filter logic from crudService and populates logo
      const response = await brandService.findOne(Number(props.id), { populate: 'logo' })

      // Assuming the API is flattened (no .attributes)
      const data = response.data

       // CORRECCIÓN: Store the full item
      currentItem.value = data;

      form.value = {
        nombre: data.nombre || '', // Added fallback
        // Assuming 'logo' is a flattened object (or null), not { data: ... }
        logo: data.logo?.id || null,
      }

      // Assign the flattened logo object
      existingLogo.value = data.logo

    } catch (error:any) {
      console.error("Error cargando marca:", error)
       uiStore.setError(`Error al cargar la marca: ${error.message}`)
      router.push('/brands') // Redirect to list on error
    } finally {
      uiStore.setLoading(false)
    }
  }
}

onMounted(loadItemData)

const handleImageUpload = (uploadedIds: number[]) => {
  if (uploadedIds.length > 0) {
    form.value.logo = uploadedIds[0]
     // Optionally clear existingLogo preview if a new one is uploaded
     // existingLogo.value = null;
  }
}

const removeExistingImage = () => {
  form.value.logo = null
  existingLogo.value = null
}

const handleSubmit = async () => {
  if (!form.value.nombre) {
    uiStore.setError("El nombre es obligatorio.")
    return
  }

  const payload = { ...form.value }

  try {
    if (isEditing.value) {
       // CORRECCIÓN: Get documentId from currentItem
       const docId = currentItem.value?.documentId;
       if (!docId) {
         uiStore.setError("No se pudo obtener el documentId para actualizar. Refresca la página.");
          console.error("currentItem o documentId es nulo/undefined:", currentItem.value);
         return;
       }
      await brandService.update(docId, payload) // Pass documentId
    } else {
      await brandService.create(payload)
    }
    router.push('/brands')
  } catch (error:any) {
    console.error("Error al guardar:", error)
     uiStore.setError(`Error al guardar la marca: ${error.message}`)
    // Axios interceptor should handle UI error display for network issues
  }
}

// CORRECCIÓN: Updated 'getImageUrl' function for flattened API
const getImageUrl = (url?: string | null): string => {
  const placeholder = 'https://placehold.co/150x150/e2e8f0/94a3b8?text=Sin+Logo';
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