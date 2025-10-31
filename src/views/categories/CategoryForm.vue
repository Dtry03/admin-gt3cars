<template>
  <div>

    <form @submit.prevent="handleSubmit" class="space-y-6 bg-dark p-8 rounded-lg shadow-md max-w-2xl mx-auto">

      <div>
        <label for="nombre" class="block text-sm font-medium text-white">Nombre</label>
        <input type="text" v-model="form.nombre" id="nombre" required class="mt-1 block w-full rounded-md text-gray-400 bg-dark border-4 border-secondary shadow-sm focus:border-primary focus:ring-primary sm:text-sm" />
      </div>

      <!-- CORRECCIÓN: Eliminado el campo 'descripcion' del template -->
      <!--
      <div>
        <label for="descripcion" class="block text-sm font-medium text-gray-700">Descripción</label>
        <textarea v-model="form.descripcion" id="descripcion" rows="4" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"></textarea>
      </div>
      -->

      <div class="flex justify-end space-x-4">
        <router-link
          to="/categories"
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
import { categoryService } from '@/services/categoryService'
import type { Category } from '@/types' // Importar tipo Category
import { useUiStore } from '@/stores/uiStore'

const props = defineProps({
  id: {
    type: String,
    default: null,
  },
})

// CORRECCIÓN: Interfaz del formulario solo con 'nombre'
interface CategoryFormState {
  nombre: string;
}

const router = useRouter()
const uiStore = useUiStore()

const isEditing = computed(() => !!props.id)
// CORRECCIÓN: Estado inicial solo con 'nombre'
const form = ref<Partial<CategoryFormState>>({
  nombre: '',
})

const currentItem = ref<Category | null>(null);

const loadItemData = async () => {
  if (isEditing.value && props.id) {
    uiStore.setLoading(true)
    try {
      const response = await categoryService.findOne(Number(props.id))
      const data = response.data
      currentItem.value = data;

      // CORRECCIÓN: Mapear solo 'nombre'
      form.value = {
        nombre: data.nombre || '',
      }

    } catch (error:any) {
      console.error("Error cargando categoría:", error)
      uiStore.setError(`Error al cargar la categoría: ${error.message}`)
      router.back()
    } finally {
      uiStore.setLoading(false)
    }
  }
}

onMounted(loadItemData)

const handleSubmit = async () => {
  if (!form.value.nombre) {
    uiStore.setError("El nombre es obligatorio.")
    return
  }

  // CORRECCIÓN: El payload ahora solo contiene 'nombre'
  const payload = { ...form.value }

  try {
    if (isEditing.value) {
       const docId = currentItem.value?.documentId;
       if (!docId) {
         uiStore.setError("No se pudo obtener el documentId para actualizar. Refresca la página.");
         console.error("currentItem o documentId es nulo/undefined:", currentItem.value);
         return;
       }
      await categoryService.update(docId, payload)
    } else {
      await categoryService.create(payload)
    }
    router.back()
  } catch (error:any) {
    console.error("Error al guardar:", error)
    uiStore.setError(`Error al guardar la categoría: ${error.message}`)
  }
}
</script>