<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100">
    <div class="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
      <h2 class="text-3xl font-bold text-center text-gray-900 mb-2">GT3CARS Admin</h2>
      <p class="text-center text-gray-600 mb-6">Inicia sesión con tu cuenta (JWT)</p>

      <div
        v-if="uiStore.errorMessage"
        class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
        role="alert"
      >
        <span class="block sm:inline">{{ uiStore.errorMessage }}</span>
      </div>
      
      <form @submit.prevent="handleLogin">
        <div class="mb-4">
          <label for="identifier" class="block text-sm font-medium text-gray-700">Usuario o Email</label>
          <input
            v-model="identifier"
            type="text"
            id="identifier"
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            required
          />
        </div>
        <div class="mb-6">
          <label for="password" class="block text-sm font-medium text-gray-700">Contraseña</label>
          <input
            v-model="password"
            type="password"
            id="password"
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            required
          />
        </div>
        <div>
          <button
            type="submit"
            :disabled="uiStore.isLoading"
            class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
          >
            <span v-if="!uiStore.isLoading">Iniciar Sesión</span>
            <span v-else>Cargando...</span>
          </button>
        </div>
      </form>
      
      <p class="text-xs text-gray-500 text-center mt-4">
        Si no se usa JWT, la aplicación utilizará el API Token de VITE_API_TOKEN (si está configurado).
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useUiStore } from '@/stores/uiStore'

const identifier = ref('')
const password = ref('')
const authStore = useAuthStore()
const uiStore = useUiStore()

// Limpiar errores al montar
uiStore.clearError()

const handleLogin = async () => {
  await authStore.login(identifier.value, password.value)
}
</script>