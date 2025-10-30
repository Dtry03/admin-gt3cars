<template>
  <div>

    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <DashboardCard
        title="Vehículos"
        to="/vehicles"
        :icon="RectangleStackIcon"
        stats="Gestionar inventario"
        color="bg-blue-500"
      />
      <DashboardCard
        title="Artículos"
        to="/articles"
        :icon="NewspaperIcon"
        stats="Noticias y blogs"
        color="bg-green-500"
      />
      <DashboardCard
        title="Categorías"
        to="/categories"
        :icon="TagIcon"
        stats="Organizar contenido"
        color="bg-yellow-500"
      />
      <DashboardCard
        title="Marcas"
        to="/brands"
        :icon="BuildingStorefrontIcon"
        stats="Fabricantes"
        color="bg-red-500"
      />

          <DashboardCard
        title="Solicitudes"
        to="/solicitudes"
        :icon="EnvelopeOpenIcon"
        stats="Gestionar contactos"
        color="bg-indigo-500"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  RectangleStackIcon,
  TagIcon,
  NewspaperIcon,
  BuildingStorefrontIcon,
  EnvelopeOpenIcon
} from '@heroicons/vue/24/outline'


import { RouterLink } from 'vue-router'

const DashboardCard = {
  props: ['title', 'to', 'icon', 'stats', 'color'],
  components: { RouterLink },
  template: `
    <RouterLink :to="to" class="block p-6 rounded-lg shadow-lg text-white transition-transform transform hover:scale-105" :class="color">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-xl font-semibold">{{ title }}</h3>
          <p class="text-sm opacity-80">{{ stats }}</p>
        </div>
        <component :is="icon" class="h-10 w-10 opacity-70" />
      </div>
    </RouterLink>
  `,
}
</script>