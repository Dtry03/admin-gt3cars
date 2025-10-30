// src/services/uploadService.ts
import apiClient from '@/api/apiClient'
import type { StrapiImage } from '@/types/strapi'

/**
 * Sube uno o más archivos a Strapi.
 * Strapi siempre devuelve un array, incluso si se sube un solo archivo.
 * @param files El archivo o archivos a subir
 */
export const upload = async (files: File | File[]): Promise<StrapiImage[]> => {
  const formData = new FormData()
  
  if (Array.isArray(files)) {
    files.forEach(file => {
      formData.append('files', file)
    })
  } else {
    formData.append('files', files)
    
  }

  const response = await apiClient.post('/api/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  
  return response.data
}