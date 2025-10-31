<template>
  <div>
    <!-- Título -->
    <h1 class="text-3xl font-bold text-white mb-6">
      {{ isEditing ? 'Editar Marca' : 'Nueva Marca' }}
    </h1>

    <form
      @submit.prevent="handleSubmit"
      class="space-y-6 bg-dark p-8 rounded-lg shadow-md max-w-2xl mx-auto"
    >
      <!-- Nombre -->
      <div>
        <label for="nombre" class="block text-sm font-medium text-white">
          Nombre
        </label>
        <input
          type="text"
          v-model="form.nombre"
          id="nombre"
          required
          class="mt-1 block w-full rounded-md bg-dark text-gray-400 border-4 border-secondary shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
        />
      </div>

      <!-- Logo -->
      <div>
        <ImageUploader label="Logo" :multiple="false" @upload-success="handleImageUpload" />

        <div v-if="existingLogo" class="mt-4">
          <h4 class="text-sm font-medium text-white mb-2">Logo Actual</h4>
          <div class="relative group w-32">
            <img
              :src="getImageUrlFromLogo(existingLogo)"
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
import type { Brand, FlatImage } from '@/types'
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
  nombre: string
  logo: number[] // 👈 ahora es un array de IDs
}

const router = useRouter()
const uiStore = useUiStore()
const isEditing = computed(() => !!props.id)

const form = ref<BrandFormState>({
  nombre: '',
  logo: [],
})

const existingLogo = ref<FlatImage | null>(null)
const currentItem = ref<Brand | null>(null)

const loadItemData = async () => {
  if (isEditing.value && props.id) {
    uiStore.setLoading(true)
    try {
      const response = await brandService.findOne(Number(props.id), { populate: 'logo' })
      const data = response.data
      currentItem.value = data

      form.value = {
        nombre: data.nombre || '',
        logo: Array.isArray(data.logo) ? data.logo.map((img: FlatImage) => img.id) : [],
      }

      existingLogo.value = Array.isArray(data.logo) ? data.logo[0] || null : null
    } catch (error: any) {
      console.error('Error cargando marca:', error)
      uiStore.setError(`Error al cargar la marca: ${error.message}`)
      router.back()
    } finally {
      uiStore.setLoading(false)
    }
  }
}

onMounted(loadItemData)

const handleImageUpload = (uploadedImage: FlatImage | null) => {
  if (uploadedImage && uploadedImage.id) {
    form.value.logo = [uploadedImage.id] // 👈 siempre un array
    existingLogo.value = uploadedImage
  } else {
    form.value.logo = []
    existingLogo.value = null
  }
}

const removeExistingImage = () => {
  form.value.logo = []
  existingLogo.value = null
}

const handleSubmit = async () => {
  if (!form.value.nombre) {
    uiStore.setError('El nombre es obligatorio.')
    return
  }

  const payload = { ...form.value }

  try {
    if (isEditing.value) {
      const docId = currentItem.value?.documentId
      if (!docId) {
        uiStore.setError('No se pudo obtener el documentId para actualizar. Refresca la página.')
        console.error('currentItem o documentId es nulo/undefined:', currentItem.value)
        return
      }

    
    } else {
      await brandService.create(payload)
    }
    router.back()
  } catch (error: any) {
    console.error('Error al guardar:', error)
    uiStore.setError(`Error al guardar la marca: ${error.message}`)
  }
}

// --- FUNCIÓN ROBUSTA PARA URL DE IMAGEN ---
const getImageUrlFromLogo = (logo: any): string => {
  const placeholder = 'https://placehold.co/150x150/e2e8f0/94a3b8?text=Sin+Logo'
  if (!logo) return placeholder

  const possibleUrl =
    logo.url ||
    logo?.data?.url ||
    logo?.formats?.thumbnail?.url ||
    logo?.formats?.small?.url ||
    logo?.formats?.medium?.url ||
    logo?.formats?.large?.url

  if (!possibleUrl) return placeholder

  const baseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
  let finalUrl = possibleUrl.startsWith('http')
    ? possibleUrl
    : `${baseUrl}${possibleUrl.startsWith('/') ? '' : '/'}${possibleUrl}`

  const ts = logo.updatedAt ? new Date(logo.updatedAt).getTime() : Date.now()
  return `${finalUrl}${finalUrl.includes('?') ? '&' : '?'}_=${ts}`
}
</script>
