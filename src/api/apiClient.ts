// src/api/apiClient.ts
import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'
import { useUiStore } from '@/stores/uiStore'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor de Petición (Request)
apiClient.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore()
    const token = authStore.token

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    
    // No activar el loader global para peticiones GET (para evitar parpadeo)
    if (config.method !== 'get') {
       const uiStore = useUiStore()
       uiStore.setLoading(true)
    }

    return config
  },
  (error) => {
    const uiStore = useUiStore()
    uiStore.setLoading(false)
    uiStore.setError('Error en la configuración de la petición.')
    return Promise.reject(error)
  }
)

// Interceptor de Respuesta (Response)
apiClient.interceptors.response.use(
  (response) => {
    // Desactivar loader global al recibir respuesta
    const uiStore = useUiStore()
    uiStore.setLoading(false)
    return response
  },
  (error) => {
    const uiStore = useUiStore()
    uiStore.setLoading(false)
    
    let errorMessage = 'Ha ocurrido un error inesperado.'

    if (error.response) {
      // Error de Strapi (usualmente en error.response.data.error.message)
      const strapiError = error.response.data?.error
      if (strapiError) {
        errorMessage = `[${strapiError.status}] ${strapiError.message}`
      } else {
        errorMessage = `Error ${error.response.status}: ${error.response.statusText}`
      }

      // Manejo específico de 401 (No autorizado) o 403 (Prohibido)
      if (error.response.status === 401 || error.response.status === 403) {
        const authStore = useAuthStore()
        authStore.logout() // Desloguear al usuario
        errorMessage = 'Tu sesión ha expirado. Por favor, inicia sesión de nuevo.'
      }

    } else if (error.request) {
      // La petición se hizo pero no se recibió respuesta (ej. API caída)
      errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión.'
    } else {
      // Algo pasó al configurar la petición
      errorMessage = error.message
    }

    uiStore.setError(errorMessage)
    return Promise.reject(error)
  }
)

export default apiClient