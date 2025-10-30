// src/stores/authStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import type { StrapiUser } from '@/types'
import { login as apiLogin } from '@/services/authService'

export const useAuthStore = defineStore('auth', () => {
  const router = useRouter()
  
  // El token puede ser el JWT o el API Token de .env
  const token = ref<string | null>(localStorage.getItem('jwt_token') || import.meta.env.VITE_API_TOKEN)
  const user = ref<StrapiUser | null>(JSON.parse(localStorage.getItem('user') || 'null'))

  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.username === 'admin' || !!import.meta.env.VITE_API_TOKEN) // Simplificación

  function setCredentials(jwt: string, userData: StrapiUser) {
    token.value = jwt
    user.value = userData
    localStorage.setItem('jwt_token', jwt)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  function clearCredentials() {
    token.value = null
    user.value = null
    localStorage.removeItem('jwt_token')
    localStorage.removeItem('user')
    // Al hacer logout, volvemos al API Token por si acaso
    token.value = import.meta.env.VITE_API_TOKEN
  }

  async function login(identifier: string, password: string) {
    try {
      const response = await apiLogin(identifier, password)
      setCredentials(response.jwt, response.user)
      await router.push('/')
    } catch (error) {
      console.error('Error en el login:', error)
      // El interceptor de Axios ya debería haber mostrado el error
    }
  }

  function logout() {
    clearCredentials()
    router.push('/login')
  }

  // Cargar el token inicial (API Token si no hay JWT)
  function initializeAuth() {
    const jwt = localStorage.getItem('jwt_token')
    if (jwt) {
      token.value = jwt
      user.value = JSON.parse(localStorage.getItem('user') || 'null')
    } else {
      token.value = import.meta.env.VITE_API_TOKEN
      user.value = null // No hay usuario si usamos API Token
    }
  }
  
  // Inicializar al cargar el store
  initializeAuth()

  return {
    token,
    user,
    isAuthenticated,
    isAdmin,
    login,
    logout,
    initializeAuth,
  }
})