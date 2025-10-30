// src/stores/uiStore.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUiStore = defineStore('ui', () => {
  const isLoading = ref(false)
  const errorMessage = ref<string | null>(null)

  function setLoading(status: boolean) {
    isLoading.value = status
  }

  function setError(message: string | null) {
    errorMessage.value = message
    // Opcional: auto-limpiar el error después de un tiempo
    if (message) {
      setTimeout(() => {
        errorMessage.value = null
      }, 5000)
    }
  }

  function clearError() {
    errorMessage.value = null
  }

  return {
    isLoading,
    errorMessage,
    setLoading,
    setError,
    clearError,
  }
})