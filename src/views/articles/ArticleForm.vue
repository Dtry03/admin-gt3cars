<template>
  <div>
    <!-- CORRECCIÓN: Título añadido -->
    <h1 class="text-3xl font-bold text-white mb-6">{{ isEditing ? 'Editar Artículo' : 'Nuevo Artículo' }}</h1>

    <form @submit.prevent="handleSubmit" class="space-y-6 bg-dark p-8 rounded-lg shadow-md max-w-2xl mx-auto">

      <!-- Título -->
      <div>
        <label for="titulo" class="block text-sm font-medium text-white">Título</label>
        <input
          type="text"
          v-model="form.titulo"
          id="titulo"
          required
          class="mt-1 block w-full bg-dark text-gray-400 rounded-md border-4 border-secondary shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
        />
      </div>

      <!-- Categoría y Fecha -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label for="category" class="block text-sm font-medium text-white">Categoría</label>
          <select
            v-model="form.categoria"
            id="category"
            required
            class="mt-1 block w-full bg-dark text-gray-400 rounded-md border-4 border-secondary shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
          >
            <option disabled :value="undefined">Selecciona una categoría</option>
            <option v-for="category in categories" :key="category.id" :value="category.id">
              <!-- Asumiendo que 'categoria' también es aplanada y tiene 'nombre' -->
              {{ category.nombre }}
            </option>
          </select>
        </div>
        <div>
          <label for="fecha_publicacion" class="block text-sm font-medium text-white">Fecha de Publicación</label>
          <input
            type="date"
            v-model="form.fecha_publicacion"
            id="fecha_publicacion"
            required
            class="mt-1 block w-full bg-dark text-gray-400 rounded-md border-4 border-secondary shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
          />
        </div>
      </div>

      <!-- Autor como campo de texto -->
      <div>
        <label for="autor" class="block text-sm font-medium text-white">Autor</label>
        <input
          type="text"
          v-model="form.autor"
          id="autor"
          required
          placeholder="Nombre del autor"
          class="mt-1 block w-full bg-dark text-gray-400 rounded-md border-4 border-secondary shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
        />
      </div>

      <!-- Contenido -->
      <div>
        <RichTextEditor label="Contenido" v-model="form.contenido" />
      </div>

      <!-- Imagen -->
      <div>
        <ImageUploader label="Imagen portada" :multiple="false" @upload-success="handleImageUpload" />
        <!-- CORRECCIÓN: Mostrar 'existingImage' siempre que exista (no solo en 'isEditing') -->
        <div v-if="existingImage" class="mt-4">
          <h4 class="text-sm font-medium text-white mb-2">Imagen Actual</h4>
          <div class="relative group w-32">
            <img
             :src="getImageUrlFromLogo(existingImage)"
              alt="Imagen actual"
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
          to="/articles"
          class="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancelar
        </router-link>
        <button
          type="submit"
          :disabled="uiStore.isLoading || (isEditing && !currentItem?.documentId)"
          class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
        >
          {{ isEditing ? 'Actualizar Artículo' : 'Crear Artículo' }}
        </button>
      </div>

    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { articleService } from '@/services/articleService'
import { categoryService } from '@/services/categoryService'
// CORRECCIÓN: Importar los tipos aplanados
import type { Article, Category, FlatImage } from '@/types' 
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

interface ArticleFormState {
  titulo: string
  contenido: string
  fecha_publicacion: string
  imagen_portada: number | null // ID de la imagen
  categoria?: number // ID de la categoría
  autor: string // ahora texto
}

const router = useRouter()
const uiStore = useUiStore()

const isEditing = computed(() => !!props.id)

const form = ref<ArticleFormState>({
  titulo: '',
  contenido: '',
  fecha_publicacion: new Date().toISOString().split('T')[0],
  imagen_portada: null,
  categoria: undefined,
  autor: '',
})

const categories = ref<Category[]>([]) // Usar tipo aplanado
const existingImage = ref<FlatImage | null>(null) // Usar tipo aplanado
const currentItem = ref<Article | null>(null) // Usar tipo aplanado

const loadRelations = async () => {
  try {
    const categoriesResponse = await categoryService.find({ pagination: { pageSize: 1000 } })
     if (Array.isArray(categoriesResponse)) {
       categories.value = categoriesResponse;
     } else if (categoriesResponse?.data) {
        categories.value = categoriesResponse.data
     }
  } catch (error: any) {
    console.error("Error cargando categorías:", error)
     uiStore.setError("Error al cargar las categorías.")
  }
}

// Helper para formatear fecha para input[type=date]
const toInputDate = (dateString?: string | null): string => {
  const defaultDate = new Date().toISOString().split('T')[0];
  if (!dateString) return defaultDate;
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return defaultDate;
    return date.toISOString().split('T')[0];
  } catch (e) {
    return defaultDate;
  }
}

const loadItemData = async () => {
  if (isEditing.value && props.id) { 
    uiStore.setLoading(true)
    try {
      const response = await articleService.findOne(Number(props.id), {
        populate: ['imagen_portada', 'categoria']
      })

      const data = response.data
      currentItem.value = data;

      form.value = {
        titulo: data.titulo || '', 
        contenido: data.contenido || '',
        fecha_publicacion: toInputDate(data.fecha_publicacion),
        imagen_portada: data.imagen_portada?.id || null,
        categoria: data.categoria?.id || undefined,
        autor: data.autor || '',
      }

      existingImage.value = data.imagen_portada || null

    } catch (error: any) {
      console.error("Error cargando artículo:", error)
      uiStore.setError(`Error al cargar el artículo: ${error.message}`)
      router.back() 
    } finally {
      uiStore.setLoading(false)
    }
  }
}

onMounted(() => {
  loadRelations()
  loadItemData()
})

//
// --- CORRECCIÓN CLAVE ---
// 'handleImageUpload' ahora espera un Objeto de Imagen (FlatImage) o null
// (porque el uploader (del Canvas) emite el objeto completo y multiple=false)
//
const handleImageUpload = (uploadedImage: FlatImage | null) => { // <-- TIPO CAMBIADO
  if (uploadedImage && uploadedImage.id) {
    // 1. Añadir solo el ID al formulario
    form.value.imagen_portada = uploadedImage.id;
    // 2. Añadir el objeto completo a 'existingImage' para la vista previa
    existingImage.value = uploadedImage;
  } else {
    // Si la subida falla o devuelve null
    form.value.imagen_portada = null;
    existingImage.value = null;
  }
}


const removeExistingImage = () => {
  form.value.imagen_portada = null
  existingImage.value = null
}

const handleSubmit = async () => {
  if (!form.value.titulo || !form.value.categoria || !form.value.autor || !form.value.fecha_publicacion) {
    uiStore.setError("Título, Categoría, Autor y Fecha son obligatorios.")
    return
  }
  
  const payload = { ...form.value };

  try {
    if (isEditing.value) {
       const docId = currentItem.value?.documentId;
       if (!docId) {
         uiStore.setError("No se pudo obtener el documentId para actualizar. Refresca la página.");
         console.error("currentItem o documentId es nulo/undefined:", currentItem.value);
         return;
       }
      await articleService.update(docId, payload)
    } else {
      await articleService.create(payload)
    }
    router.back()
  } catch (error: any) {
    console.error("Error al guardar:", error)
     uiStore.setError(`Error al guardar el artículo: ${error.message}`)
  }
}

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
  let finalUrl = possibleUrl
  if (!finalUrl.startsWith('http')) finalUrl = `${baseUrl}${finalUrl.startsWith('/') ? finalUrl : '/' + finalUrl}`

  const ts = logo.updatedAt ? new Date(logo.updatedAt).getTime() : Date.now()
  return `${finalUrl}${finalUrl.includes('?') ? '&' : '?'}_=${ts}`
}
</script>