<template>
  <aside class="w-64 bg-dark text-gray-300 flex flex-col">
    <div class="h-16 flex items-center justify-center border-b border-gray-700">
      <h1 class="text-xl font-bold text-white">GT3CARS <span class="text-primary">Admin</span></h1>
    </div>
    <nav class="flex-1 px-4 py-6 space-y-2">
      <router-link
        v-for="item in navigation"
        :key="item.name"
        :to="item.href"
        v-slot="{ isActive }"
        class="flex items-center px-3 py-2 rounded-md text-sm font-medium"
      >
        <span
          :class="[
            isActive ? 'bg-primary text-white' : 'hover:bg-gray-700 hover:text-white',
            'flex items-center px-3 py-2 rounded-md text-sm font-medium w-full transition-colors',
          ]"
        >
          <component :is="item.icon" class="h-5 w-5 mr-3" />
          {{ item.name }}
        </span>
      </router-link>
    </nav>
  </aside>
</template>

<script setup lang="ts">
import {
  HomeIcon,
  RectangleStackIcon,
  TagIcon,
  NewspaperIcon,
  BuildingStorefrontIcon,
} from '@heroicons/vue/24/outline'

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Vehículos', href: '/vehicles', icon: RectangleStackIcon },
  { name: 'Artículos', href: '/articles', icon: NewspaperIcon },
  { name: 'Categorías', href: '/categories', icon: TagIcon },
  { name: 'Marcas', href: '/brands', icon: BuildingStorefrontIcon },
]
</script>