// src/types/strapi.ts

// Formato de una imagen individual
export interface StrapiImageFormat {
  name: string
  hash: string
  ext: string
  mime: string
  path: string | null
  width: number
  height: number
  size: number
  url: string
}

// Atributos de una imagen de Strapi
export interface StrapiImageAttributes {
  name: string
  alternativeText: string | null
  caption: string | null
  width: number
  height: number
  formats: {
    thumbnail: StrapiImageFormat
    small: StrapiImageFormat
    medium: StrapiImageFormat
    large: StrapiImageFormat
  }
  hash: string
  ext: string
  mime: string
  size: number
  url: string
  previewUrl: string | null
  provider: string
  provider_metadata: any
  createdAt: string
  updatedAt: string
}

// La entidad de imagen completa
export interface StrapiImage {
  id: number
  attributes: StrapiImageAttributes
}

// Relación Strapi (para un solo item)
export interface StrapiRelation<T> {
  data: T | null
}

// Relación Strapi (para múltiples items)
export interface StrapiRelationMany<T> {
  data: T[]
}

// Paginación de Strapi
export interface StrapiPagination {
  page: number
  pageSize: number
  pageCount: number
  total: number
}

// Meta de Strapi
export interface StrapiMeta {
  pagination: StrapiPagination
}

// Respuesta de Strapi para un solo item
export interface StrapiResponse<T> {
  data: T
  meta: {}
}

// Respuesta de Strapi para múltiples items
export interface StrapiResponseMany<T> {
  data: T[]
  meta: StrapiMeta
}

// Entidad base de Strapi (lo que todas tienen)
export interface StrapiBaseEntity {
  id: number
  attributes: {
    createdAt: string
    updatedAt: string
    publishedAt: string | null
  }
}