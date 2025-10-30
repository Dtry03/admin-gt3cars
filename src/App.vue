<template>
  <div id="app-container">
    <router-view />

    <div v
      v-if="uiStore.isLoading"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
    >
      <Loader />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUiStore } from '@/stores/uiStore'
import Loader from '@/components/ui/Loader.vue'

const uiStore = useUiStore()
</script>