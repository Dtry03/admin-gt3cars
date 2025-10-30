// src/types/index.ts
import type { StrapiBaseEntity} from './strapi'

// Interfaz base que incluye documentId
interface StrapiEntityWithDocId extends StrapiBaseEntity {
  documentId?: string | number;
}

// --- Usuario (para la relación de Autor) ---
export interface StrapiUser {
  id: number;
  username: string;
  email: string;
}

// --- TIPO DE IMAGEN APLANADA (Simplificado) ---
// (Este tipo representa el objeto de imagen que devuelve tu API aplanada)
export type FlatImage = {
  id: number;
  url: string;
  formats?: {
    thumbnail?: { url: string };
    small?: { url: string };
    // ...otros formatos si los usas
  };
  // ...otros campos de la imagen si los usas
}

// --- MARCA (Brand) ---
// CORRECCIÓN: Tipo aplanado sin 'attributes'
export type Brand = StrapiEntityWithDocId & {
  id: number;
  nombre: string;
  logo: FlatImage | null; // Asume que la relación de logo también está aplanada
  modelo?: string; // Campo 'modelo' que mencionaste
  // ...otros campos aplanados
}

// --- CATEGORÍA (Category) ---
// CORRECCIÓN: Tipo aplanado sin 'attributes'
export type Category = StrapiEntityWithDocId & {
  id: number;
  nombre: string;
  // descripcion?: string; // Eliminado
  // ...otros campos aplanados
}

// --- ARTÍCULO (Article) ---
// CORRECCIÓN: Tipo aplanado sin 'attributes'
export type Article = StrapiEntityWithDocId & {
  id: number;
  titulo: string;
  contenido: string;
  slug?: string;
  fecha_publicacion: string;
  imagen_portada: FlatImage | null; // Relación aplanada
  categoria: Category | null; // Relación aplanada
  autor: string; // Campo de texto
  // ...otros campos aplanados
}

// --- VEHÍCULO (Vehicle) ---
// CORRECCIÓN: Tipo aplanado sin 'attributes'
export type Vehicle = StrapiEntityWithDocId & {
  id: number;
  modelo: string;
  ano: number;
  kilometraje: number;
  precio: number;
  descripcion: string;
  estado: 'disponible' | 'vendido';
  marca: Brand | null; // Relación aplanada
  // categoria: Category | null; // Eliminado
  imagenes: FlatImage[] | null; // Array de imágenes aplanadas
  // ...otros campos aplanados
}

// --- SOLICITUD (Nuevo Tipo) ---
// CORRECCIÓN: Tipo aplanado sin 'attributes'
export type Solicitud = StrapiEntityWithDocId & {
  id: number;
  nombre: string;
  correo: string;
  telefono: string;
  mensaje: string;
  estado: 'Nueva' | 'En proceso' | 'Resuelta';
  fecha_creacion?: string;
  // ...otros campos aplanados
}