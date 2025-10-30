// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

// Importar Layouts y Vistas
import AppLayout from '@/components/layout/AppLayout.vue'
import Login from '@/views/Login.vue'
import Dashboard from '@/views/Dashboard.vue'

// Vistas de Vehículos
import VehicleList from '@/views/vehicles/VehicleList.vue'
import VehicleForm from '@/views/vehicles/VehicleForm.vue'

// Vistas de Artículos
import ArticleList from '@/views/articles/ArticleList.vue'
import ArticleForm from '@/views/articles/ArticleForm.vue'

// Vistas de Marcas
import BrandList from '@/views/brands/BrandList.vue'
import BrandForm from '@/views/brands/BrandForm.vue'

// Vistas de Categorías
import CategoryList from '@/views/categories/CategoryList.vue'
import CategoryForm from '@/views/categories/CategoryForm.vue'

//Solicitudes
import SolicitudList from '@/views/solicitudes/SolicitudList.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { requiresAuth: false },
  },
  {
    path: '/',
    component: AppLayout, // Layout principal que envuelve las rutas protegidas
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'INICIO',
        component: Dashboard,
      },
      // Rutas de Vehículos
      {
        path: 'vehicles',
        name: 'VEHICULOS',
        component: VehicleList,
      },
      {
        path: 'vehicles/new',
        name: 'CREAR VEHICULO',
        component: VehicleForm,
      },
      {
        path: 'vehicles/edit/:id',
        name: 'EDITAR VEHICULO',
        component: VehicleForm,
        props: true, // Pasa el :id como prop al componente
      },
      // Rutas de Artículos
      {
        path: 'articles',
        name: 'ARTICULOS',
        component: ArticleList,
      },
      {
        path: 'articles/new',
        name: 'CREAR ARTICULO',
        component: ArticleForm,
      },
      {
        path: 'articles/edit/:id',
        name: 'EDITAR ARTICULO',
        component: ArticleForm,
        props: true,
      },
      // Rutas de Marcas
      {
        path: 'brands',
        name: 'MARCAS',
        component: BrandList,
      },
      {
        path: 'brands/new',
        name: 'CREAR MARCA',
        component: BrandForm,
      },
      {
        path: 'brands/edit/:id',
        name: 'EDITAR MARCA',
        component: BrandForm,
        props: true,
      },
      // Rutas de Categorías
      {
        path: 'categories',
        name: 'CATEGORIAS',
        component: CategoryList,
      },
      {
        path: 'categories/new',
        name: 'CREAR CATEGORIA',
        component: CategoryForm,
      },
      {
        path: 'categories/edit/:id',
        name: 'EDITAR CATEGORIA',
        component: CategoryForm,
        props: true,
      },
      {
        path: 'solicitudes',
        name: 'SolicitudList',
        component: SolicitudList,

      },
    ],
  },
  // Redirección para rutas no encontradas
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Guardia de Navegación (Navigation Guard)
router.beforeEach((to, _from, next) => { // CORRECCIÓN: 'from' renombrado a '_from'
  // Asegurarnos que el store está inicializado
  const authStore = useAuthStore()
  authStore.initializeAuth()

  const requiresAuth = to.meta.requiresAuth
  const isAuthenticated = authStore.isAuthenticated

  if (requiresAuth && !isAuthenticated) {
    // Si la ruta requiere autenticación y no estamos logueados, redirigir a Login
    next({ name: 'Login' })
  } else if (!requiresAuth && isAuthenticated && to.name === 'Login') {
    // Si intentamos ir a Login pero ya estamos logueados, redirigir al Dashboard
    next({ name: 'Dashboard' })
  } else {
    // En cualquier otro caso, permitir la navegación
    next()
  }
})

export default router