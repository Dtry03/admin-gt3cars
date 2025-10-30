<template>
  <header class="h-16 bg-dark shadow-sm flex items-center justify-between px-6">
    <!-- Título de la Ruta -->
    <div>
      <h2 class="text-xl font-semibold text-gray-400">{{ $route.name }}</h2>
    </div>

    <!-- Lado derecho: Nombre de usuario y Botón de Atrás -->
    <div class="flex items-center">
      <span class="text-sm text-gray-400 mr-4">
        {{ authStore.user ? authStore.user.username : 'Admin (API Token)' }}
      </span>
      
      <!-- 
        CORRECCIÓN: 
        El botón "Atrás" ahora solo se muestra si el nombre de la ruta NO es 'INICIO'
      -->
      <button
        v-if="route.name !== 'INICIO'"
        @click="router.back()"
        class="flex items-center text-sm text-gray-400 hover:text-primary transition-colors"
        title="Atrás"
      >
        <ArrowLeftIcon class="h-5 w-5 mr-1" />
        Atrás
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/authStore'
// CORRECCIÓN: Importar useRouter, useRoute y el icono
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'

const authStore = useAuthStore()
const router = useRouter() 
// CORRECCIÓN: Añadir useRoute para comprobar la ruta actual
const route = useRoute() 
</script>