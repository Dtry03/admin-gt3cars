<template>
  <div>
    <label :for="uploadId" class="block text-sm font-medium text-white mb-1">
      {{ label }}
    </label>
    
    <div
      :class="[
        'mt-1 flex justify-center px-6 pt-5 pb-6 border-4 border-secondary border-dashed rounded-md',
        isDragging ? 'border-primary bg-green-50' : ''
      ]"
      @dragover.prevent="onDragOver"
      @dragleave.prevent="onDragLeave"
      @drop.prevent="handleDrop"
    >
      <div class="space-y-1 text-center">
        <PhotoIcon class="mx-auto h-12 w-12 text-gray-400" />
        <div class="flex text-sm text-gray-600">
          <label
            :for="uploadId"
            class="relative cursor-pointer bg-primary rounded-md font-medium text-white hover:bg-primary-dark focus-within:outline-none"
          >
            <span>Sube un archivo</span>
            <input 
              :id="uploadId" 
              :name="uploadId" 
              type="file" 
              :multiple="multiple" 
              class="sr-only" 
              @change="handleFileSelect"
              :accept="accept"
            />
          </label>
          <p class="pl-1 text-gray-400">o arrastra y suelta</p>
        </div>
        <p class="text-xs text-gray-400">PNG, JPG, GIF hasta 10MB</p>
      </div>
    </div>
    
    <div v-if="isUploading" class="mt-2 text-sm text-gray-500 flex items-center">
      <div class="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary mr-2"></div>
      Subiendo...
    </div>

    <!-- Vistas previas (solo local, desaparecen al subir) -->
    <div v-if="previews.length > 0" class="mt-4 grid grid-cols-3 gap-4">
      <div v-for="(preview, index) in previews" :key="index" class="relative group">
        <img :src="preview.url" :alt="preview.name" class="h-32 w-full object-cover rounded-md shadow-md" />
        <button
          @click="removePreview(index)"
          class="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-75 group-hover:opacity-100 transition-opacity"
          title="Eliminar"
        >
          <XMarkIcon class="h-4 w-4" />
        </button>
        <div class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b-md truncate">
          {{ preview.name }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue' // CORRECCIÓN: computed importado
import { PhotoIcon, XMarkIcon } from '@heroicons/vue/24/solid'
import { upload as uploadService } from '@/services/uploadService'
import { useUiStore } from '@/stores/uiStore'

const props = defineProps({
  multiple: {
    type: Boolean,
    default: false,
  },
  label: {
    type: String,
    default: 'Imagen'
  },
  accept: {
    type: String,
    default: 'image/*'
  }
})

const emit = defineEmits(['upload-success', 'upload-error'])

interface PreviewFile {
  file: File
  url: string
  name: string
}

const isDragging = ref(false)
const isUploading = ref(false)
const previews = ref<PreviewFile[]>([])
const uiStore = useUiStore()
// CORRECCIÓN: ID único para el input/label
const uploadId = computed(() => `file-upload-${Math.random().toString(36).substring(7)}`)

const onDragOver = () => { isDragging.value = true; };
const onDragLeave = () => { isDragging.value = false; };

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files) {
    processFiles(Array.from(target.files))
  }
  // Limpiar el input para permitir seleccionar el mismo archivo de nuevo
  target.value = '';
}

const handleDrop = (event: DragEvent) => {
  isDragging.value = false
  if (event.dataTransfer?.files) {
    processFiles(Array.from(event.dataTransfer.files))
  }
}

const processFiles = (files: File[]) => {
  previews.value = [] // Limpiar vistas previas anteriores
  let filesToUpload: File[] = []

  if (!props.multiple) {
    // Si no es múltiple, reemplazamos
    if (files.length > 0) {
      filesToUpload = [files[0]] // Solo el primero
    }
  } else {
    // Si es múltiple, añadimos
    filesToUpload = files
  }
  
  // Iniciar la lógica de vista previa (asíncrona)
  filesToUpload.forEach(addFileToPreview)
  
  // Iniciar la subida automáticamente (síncrono)
  // CORRECCIÓN: Pasar los archivos directamente a uploadFiles
  if(filesToUpload.length > 0) {
    uploadFiles(filesToUpload);
  }
}

const addFileToPreview = (file: File) => {
  // Validar tipo de archivo
  if (!file.type.startsWith('image/')) {
    uiStore.setError(`El archivo "${file.name}" no es una imagen.`)
    return
  }
  
  const reader = new FileReader()
  reader.onload = (e) => {
    previews.value.push({
      file,
      url: e.target?.result as string,
      name: file.name
    })
  }
  reader.readAsDataURL(file)
}

const removePreview = (index: number) => {
  // Esta función solo elimina la vista previa local *antes* de la subida
  previews.value.splice(index, 1)
  // (Nota: Si se quisiera cancelar una subida en progreso, sería más complejo)
}

// CORRECCIÓN: uploadFiles ahora acepta 'filesToUpload' como argumento
const uploadFiles = async (filesToUpload: File[]) => {
  // CORRECCIÓN: Comprobar el array de argumento, no previews.value
  if (filesToUpload.length === 0) return

  isUploading.value = true
  uiStore.setLoading(true) // Usar el loader global

  try {
    // CORRECCIÓN: Usar 'filesToUpload' directamente
    const files = props.multiple ? filesToUpload : filesToUpload[0]
    
    // AQUÍ ES DONDE SE LLAMA AL SERVICIO DEL CANVAS
    // (Ahora deberías ver los logs de "Enviando..." en la consola)
    const response = await uploadService(files) 

    // (El console.log de "Respuesta de /api/upload:" debería aparecer ahora)

    // Emitir los IDs de las imágenes subidas
    // Asumimos que la respuesta (aplanada) es un array de objetos con 'id'
    const uploadedIds = (response || []).map((img: any) => img.id).filter(Boolean);
    
    if (uploadedIds.length > 0) {
      emit('upload-success', uploadedIds)
    } else {
      console.warn("La subida tuvo éxito pero no se recibieron IDs de imagen.", response);
    }
    
    uiStore.setError(null) // Limpiar errores previos
    
  } catch (error: any) { // CORRECCIÓN: tipar error
    // (El console.log de "Error durante la subida..." debería aparecer si falla)
    console.error('Error al subir archivos (desde ImageUploader):', error)
    uiStore.setError(`Error al subir la imagen: ${error.message || 'Error desconocido'}`)
    emit('upload-error', error)
  } finally {
    isUploading.value = false
    uiStore.setLoading(false)
    previews.value = [] // Limpiar vistas previas después de subir
  }
}

</script>