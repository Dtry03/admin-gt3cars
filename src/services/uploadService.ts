// CORRECCIÓN: Importar 'axios' directamente, no el 'apiClient'
import axios from 'axios';
// CORRECCIÓN: Importar el store para coger el token manualmente
import { useAuthStore } from '@/stores/authStore';
import type { FlatImage } from '@/types'; 

/**
 * Sube uno o más archivos a Strapi.
 * @param files El archivo o archivos a subir
 */
export const upload = async (files: File | File[]): Promise<FlatImage[]> => {
  const formData = new FormData();
  
  if (Array.isArray(files)) {
    files.forEach(file => {
      formData.append('files', file);
    });
  } else {
    formData.append('files', files);
  }

  // --- CORRECCIÓN CLAVE ---
  //
  // Dejamos de usar 'apiClient' y creamos una petición 'axios' limpia
  // para evitar conflictos con el 'Content-Type: application/json'
  // por defecto de los interceptores.
  //

  // 1. Obtener la URL base de la API desde las variables de entorno
  const apiUrl = `${import.meta.env.VITE_API_URL}/api/upload`;

  // 2. Obtener el token de autenticación manualmente (el interceptor no se ejecutará)
  const authStore = useAuthStore();
  const token = authStore.token;

  if (!token) {
    console.error("Fallo al subir: No hay token de autenticación disponible.");
    return []; // Falla silenciosamente si no hay token
  }

  try {
    // 3. Crear la configuración de la petición
    const config = {
      headers: {
        // 4. Añadir el token de autorización manualmente
        'Authorization': `Bearer ${token}`,
        
        // 5. NO añadir 'Content-Type'. Dejar que Axios/Navegador
        // lo generen automáticamente (multipart/form-data con boundary)
        // al enviar FormData.
      }
    };

    // 6. Enviar la petición usando 'axios' limpio
    console.log(`Enviando ${Array.isArray(files) ? files.length : 1} archivo(s) a ${apiUrl}...`);
    const response = await axios.post(apiUrl, formData, config);
    
    // 7. AÑADIDO: Log para ver qué responde Strapi
    console.log("Respuesta de /api/upload:", response.data);

    // Si la respuesta es vacía, es un fallo silencioso (probablemente de proveedor externo)
    if (!response.data || (Array.isArray(response.data) && response.data.length === 0)) {
      console.warn("La subida tuvo éxito (HTTP 200) pero Strapi no devolvió archivos. Revisa los logs del servidor Strapi y la configuración del proveedor (ej. Cloudinary/S3).");
    }

    // Asumimos que la API de upload también devuelve una respuesta aplanada
    return response.data;

  } catch (error: any) {
    console.error("Error durante la subida de archivo:", error.response?.data || error.message);
    // Opcional: notificar al usuario del error de subida
    // const uiStore = useUiStore();
    // uiStore.setError("Fallo al subir la imagen.");
    return []; // Falla silenciosamente
  }
}

