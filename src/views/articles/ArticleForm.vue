<template>
  <div>

    <form @submit.prevent="handleSubmit" class="space-y-6 bg-dark p-8 rounded-lg shadow-md">

      <!-- Título -->
      <div>
        <label for="titulo" class="block text-sm font-medium text-white">Título</label>
        <input
          type="text"
          v-model="form.titulo"
          id="titulo"
          required
          class="mt-1 block w-full bg-dark text-gray-400 rounded-md border-4 border-4 border-secondary shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
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
        <div v-if="isEditing && existingImage" class="mt-4">
          <h4 class="text-sm font-medium text-gray-400 mb-2">Imagen Actual</h4>
          <div class="relative group w-32">
            <!--
              CORRECCIÓN: Se aplica la lógica de API aplanada.
              Se accede a formats.thumbnail.url en lugar de solo .url
            -->
            <img
              :src="getImageUrl(existingImage.formats?.thumbnail?.url)"
              alt="Imagen actual"
              class="h-32 w-32 object-cover rounded-md shadow-md"
            />
            <button
              type="button"
              @click="removeExistingImage"
              class="absolute top-1 right-1 bg-red-600 text-gray-400 rounded-full p-1 opacity-75 group-hover:opacity-100 transition-opacity"
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
          class="px-4 py-2 bg-white border border-4 border-secondary rounded-md text-sm font-medium text-gray-800 hover:bg-gray-50"
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
// Importamos el tipo Article, que ya incluye documentId?
import type { Article } from '@/types'
// import type { StrapiImage } from '@/types/strapi' // No lo usamos directamente si está aplanado
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

const categories = ref<any[]>([]) // Tipado como 'any' para manejar la estructura aplanada
const existingImage = ref<any | null>(null) // Usamos 'any' para la imagen aplanada
// CORRECCIÓN: Ref para guardar el artículo completo, incluyendo documentId
const currentItem = ref<Article | null>(null)

const loadRelations = async () => {
  try {
    const categoriesResponse = await categoryService.find({ pagination: { pageSize: 1000 } })
    // Asumimos que la API de categorías también está aplanada y devuelve un array directo
     if (Array.isArray(categoriesResponse)) {
       categories.value = categoriesResponse;
     } else if (categoriesResponse?.data) {
        // O si sigue la estructura { data: [...] }
        categories.value = categoriesResponse.data
     }
  } catch (error:any) {
    console.error("Error cargando categorías:", error)
     uiStore.setError("Error al cargar las categorías.")
  }
}

// Helper para formatear fecha para input[type=date]
const toInputDate = (dateString?: string | null): string => {
  const defaultDate = new Date().toISOString().split('T')[0];
  if (!dateString) return defaultDate;
  try {
    // Intenta crear la fecha; si es inválida, usa la por defecto
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return defaultDate;
    return date.toISOString().split('T')[0];
  } catch (e) {
    return defaultDate;
  }
}

const loadItemData = async () => {
  if (isEditing.value && props.id) { // Añadido chequeo de props.id
    uiStore.setLoading(true)
    try {
      // Usamos el findOne (que ahora usa filtros) y populate
      const response = await articleService.findOne(Number(props.id), {
        populate: ['imagen_portada', 'categoria']
      })

      // Asumimos que la API está aplanada (sin .attributes)
      const data = response.data

      // CORRECCIÓN: Guardar el item completo
      currentItem.value = data;

      form.value = {
        titulo: data.titulo || '', // Añadido fallback por si acaso
        contenido: data.contenido || '',
        fecha_publicacion: toInputDate(data.fecha_publicacion),
        // CORRECCIÓN: Acceder al ID de la imagen aplanada
        imagen_portada: data.imagen_portada?.id || null,
        // CORRECCIÓN: Acceder al ID de la categoría aplanada
        categoria: data.categoria?.id || undefined,
        autor: data.autor || '',
      }

      // CORRECCIÓN: Guardar la imagen aplanada directamente
      existingImage.value = data.imagen_portada || null

    } catch (error:any) {
      console.error("Error cargando artículo:", error)
      uiStore.setError(`Error al cargar el artículo: ${error.message}`)
      router.push('/articles') // Ir a la lista si falla la carga
    } finally {
      uiStore.setLoading(false)
    }
  }
}

onMounted(() => {
  loadRelations()
  loadItemData()
})

const handleImageUpload = (uploadedIds: number[]) => {
  if (uploadedIds.length > 0) form.value.imagen_portada = uploadedIds[0]
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

  try {
    if (isEditing.value) {
       // CORRECCIÓN: Obtener documentId de currentItem
       const docId = currentItem.value?.documentId;
       if (!docId) {
         uiStore.setError("No se pudo obtener el documentId para actualizar. Refresca la página.");
         console.error("currentItem o documentId es nulo/undefined:", currentItem.value);
         return;
       }
      await articleService.update(docId, { ...form.value })
    } else {
      await articleService.create({ ...form.value })
    }
    router.push('/articles')
  } catch (error:any) {
    console.error("Error al guardar:", error)
     uiStore.setError(`Error al guardar el artículo: ${error.message}`)
    // El interceptor de Axios ya debería manejar errores de red/API
  }
}

// CORRECCIÓN: Función 'getImageUrl' actualizada para la API aplanada
const getImageUrl = (url?: string | null): string => {
  const placeholder = 'https://placehold.co/150x150/e2e8f0/94a3b8?text=Sin+Imagen';
  if (!url) {
      // console.log("getImageUrl: URL es nula o undefined, usando placeholder.");
      return placeholder;
  }

  // Comprueba si la URL ya es absoluta
  if (url.startsWith('http://') || url.startsWith('https://')) {
      // console.log("getImageUrl: URL ya es absoluta:", url);
      return url;
  }

  // Si es relativa (empieza con '/'), constrúyela con VITE_API_URL
  if (url.startsWith('/')) {
     const baseUrl = import.meta.env.VITE_API_URL;
     if (!baseUrl) {
       console.error("VITE_API_URL no está definida en .env");
       return placeholder;
     }
     const fullUrl = `${baseUrl}${url}`;
     // console.log("getImageUrl: Construyendo URL absoluta:", fullUrl);
     return fullUrl;
  }

  // Si no empieza con '/' ni es http/https, podría ser un path relativo extraño
  console.warn("getImageUrl: URL tiene un formato inesperado, usando placeholder:", url);
  return placeholder;
}
</script>