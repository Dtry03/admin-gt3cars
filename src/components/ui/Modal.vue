<template>
  <div
    v-if="show"
    class="fixed inset-0 z-40 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center"
    @click.self="close"
  >
    <!-- CORRECCIÓN: Colores oscuros restaurados -->
    <div class="bg-dark border border-secondary rounded-lg shadow-xl max-w-md w-full m-4 text-white">
      <!-- Header -->
      <div class="flex justify-between items-center border-b border-secondary p-4">
        <h3 class="text-lg font-semibold">{{ title }}</h3>
        <button @click="close" class="text-gray-400 hover:text-gray-300">
          <XMarkIcon class="h-6 w-6" />
        </button>
      </div>

      <!-- Body -->
      <div class="p-6">
        <slot>
          <!-- CORRECCIÓN: Añadido whitespace-pre-wrap para respetar saltos de línea en mensajes -->
          <p class="whitespace-pre-wrap">{{ message }}</p>
        </slot>
      </div>

      <!-- Footer -->
      <div class="flex justify-end items-center space-x-3 bg-dark p-4 rounded-b-lg">
        <!-- CORRECCIÓN: Botón de Cancelar ahora es opcional -->
        <button
          v-if="showCancel"
          @click="close"
          class="px-4 py-2 bg-gray-600 border border-gray-700 rounded-md text-sm font-medium text-gray-200 hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {{ cancelText }}
        </button>
        <!-- CORRECCIÓN: Botón de Confirmar ahora es opcional -->
        <button
          v-if="showConfirm"
          @click="confirm"
          :class="[
            'px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white',
            confirmClass,
          ]"
        >
          {{ confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { XMarkIcon } from '@heroicons/vue/24/solid'
import { computed } from 'vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  title: { type: String, default: 'Confirmar Acción' },
  message: { type: String, default: '¿Estás seguro de que deseas realizar esta acción?' },
  confirmText: { type: String, default: 'Confirmar' },
  cancelText: { type: String, default: 'Cancelar' },
  variant: { type: String, default: 'danger' }, // 'danger' (rojo) o 'primary' (verde)
  showConfirm: { type: Boolean, default: true },
  showCancel: { type: Boolean, default: true }, // <-- Prop añadida
})

const emit = defineEmits(['close', 'confirm'])

const close = () => emit('close')
// CORRECCIÓN: 'confirm' ya no cierra el modal por defecto
// La lógica de cierre debe estar en el componente padre o en el @click
const confirm = () => emit('confirm') 

const confirmClass = computed(() => {
  if (props.variant === 'danger') {
    return 'bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
  }
  // CORRECCIÓN: 'primary' u cualquier otro valor será verde
  return 'bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary'
})
</script>

