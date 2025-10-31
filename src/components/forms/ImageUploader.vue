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
        <p class="text-xs text-gray-400">PNG, JPG, GIF</p>
      </div>
    </div>
    
    <div v-if="isUploading" class="mt-2 text-sm text-gray-500 flex items-center">
      <div class="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary mr-2"></div>
      Subiendo...
    </div>

    <!-- Vistas previas locales (ahora no desaparecen) -->
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
import { ref, computed } from 'vue'
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

// 'upload-success' ahora emite el/los objeto(s) de imagen completos
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
const uploadId = computed(() => `file-upload-${Math.random().toString(36).substring(7)}`)

const onDragOver = () => { isDragging.value = true; };
const onDragLeave = () => { isDragging.value = false; };

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files) {
    processFiles(Array.from(target.files))
  }
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
    if (files.length > 0) filesToUpload = [files[0]];
  } else {
    filesToUpload = files;
  }
  
  filesToUpload.forEach(addFileToPreview);
  
  if(filesToUpload.length > 0) {
    uploadFiles(filesToUpload);
  }
}

const addFileToPreview = (file: File) => {
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
  previews.value.splice(index, 1)
}

const uploadFiles = async (filesToUpload: File[]) => {
  if (filesToUpload.length === 0) return

  isUploading.value = true
  uiStore.setLoading(true)

  try {
    const files = props.multiple ? filesToUpload : filesToUpload[0]
    
    // El servicio (corregido) devuelve los objetos de imagen aplanados
    const response = await uploadService(files) 

    // Emitir los objetos de imagen completos, no solo los IDs
    if (props.multiple) {
      // response es un array (ej. [img1, img2])
      emit('upload-success', response || []) 
    } else {
      // response es un array con un solo objeto (ej. [img1])
      // Emitimos solo el primer objeto (o null)
      emit('upload-success', (response && response[0]) ? response[0] : null)
    }
    
    uiStore.setError(null)
    
  } catch (error: any) { 
    console.error('Error al subir archivos (desde ImageUploader):', error)
    uiStore.setError(`Error al subir la imagen: ${error.message || 'Error desconocido'}`)
    emit('upload-error', error)
  } finally {
    isUploading.value = false
    uiStore.setLoading(false)
    
    // CORRECCIÓN: Comentamos la línea que borra la vista previa
    // previews.value = [] 
  }
}
</script>

