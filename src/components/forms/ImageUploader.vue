<template>
  <div>
    <label class="block text-sm font-medium text-white mb-1">
      {{ label }}
    </label>
    
    <div
      :class="[
        'mt-1 flex justify-center px-6 pt-5 pb-6 border-4 border-secondary border-dashed rounded-md',
        isDragging ? 'border-primary bg-green-50' : ''
      ]"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleDrop"
    >
      <div class="space-y-1 text-center">
        <PhotoIcon class="mx-auto h-12 w-12 text-gray-400" />
        <div class="flex text-sm text-gray-600">
          <label
            for="file-upload"
            class="relative cursor-pointer bg-primary rounded-md font-medium text-white hover:bg-primary-dark  focus-within:outline-none"
          >
            <span>Sube un archivo</span>
            <input 
              id="file-upload" 
              name="file-upload" 
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
import { ref } from 'vue'
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

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files) {
    processFiles(Array.from(target.files))
  }
}

const handleDrop = (event: DragEvent) => {
  isDragging.value = false
  if (event.dataTransfer?.files) {
    processFiles(Array.from(event.dataTransfer.files))
  }
}

const processFiles = (files: File[]) => {
  if (!props.multiple) {
    // Si no es múltiple, reemplazamos
    previews.value = []
    if (files.length > 0) {
      addFileToPreview(files[0])
    }
  } else {
    // Si es múltiple, añadimos
    files.forEach(addFileToPreview)
  }
  
  // Iniciar la subida automáticamente
  uploadFiles()
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
  // Aquí también deberíamos manejar la eliminación del ID de imagen del formulario padre
  // Por ahora, solo lo quitamos de la vista previa local antes de subir
  previews.value.splice(index, 1)
  // NOTA: Si las imágenes ya están subidas, necesitaríamos emitir un evento 'remove-file' con el ID
}

const uploadFiles = async () => {
  if (previews.value.length === 0) return

  isUploading.value = true
  uiStore.setLoading(true) // Usar el loader global

  try {
    const filesToUpload = previews.value.map(p => p.file)
    const files = props.multiple ? filesToUpload : filesToUpload[0]
    
    const response = await uploadService(files) // response es StrapiImage[]

    // Emitir los IDs de las imágenes subidas
    const uploadedIds = response.map(img => img.id)
    emit('upload-success', uploadedIds)
    
    uiStore.setError(null) // Limpiar errores previos
    previews.value = [] // Limpiar vistas previas después de subir

  } catch (error) {
    console.error('Error al subir archivos:', error)
    emit('upload-error', error)
    // El interceptor de Axios ya maneja el uiStore.setError
  } finally {
    isUploading.value = false
    uiStore.setLoading(false)
  }
}

</script>