import apiClient from './apiClient'
import type { StrapiResponse, StrapiResponseMany, StrapiBaseEntity } from '@/types/strapi'
import qs from 'qs'

/**
 * Define la estructura de los parámetros de consulta de Strapi.
 */
export interface StrapiQueryParams {
  sort?: string | string[]
  filters?: Record<string, any>
  populate?: string | string[] | Record<string, any>
  fields?: string[]
  pagination?: {
    page?: number
    pageSize?: number
    start?: number
    limit?: number
  }
  publicationState?: 'live' | 'preview'
  // ...otros parámetros
}

// Interfaz base que asume la presencia de documentId (ajustar nombre si es diferente)
// NOTA: Si tu API no devuelve documentId, esta solución no funcionará directamente.
interface StrapiEntityWithDocId extends StrapiBaseEntity {
  documentId?: number | string; // Ajusta el tipo si es necesario
  // Otros campos aplanados pueden estar aquí...
}


/**
 * Crea un servicio CRUD genérico para una entidad de Strapi v5 (considerando documentId).
 * @param endpoint El endpoint de la API sin '/api/' (ej. 'vehiculos')
 */
// Ajusta el tipo genérico para esperar potencialmente documentId
export const createCrudService = <T extends StrapiEntityWithDocId>(
  endpoint: string
) => {
  const apiUrl = `/api/${endpoint}`

  /**
   * Busca múltiples entradas (Listar)
   */
  const find = async (params?: StrapiQueryParams): Promise<StrapiResponseMany<T>> => {
    const queryString = qs.stringify(params, {
      encodeValuesOnly: true,
    })
    // Asume que la respuesta viene aplanada o con { data: [...] }
    const response = await apiClient.get(`${apiUrl}?${queryString}`)
     // Ajusta según la estructura real de tu respuesta 'find'
    return response.data; // O response.data si no está aplanada
  }

  /**
   * SOLUCIÓN (FINDONE):
   * Busca un item por ID (numérico) usando filtros.
   * La respuesta (aplanada) DEBE incluir el documentId.
   */
  const findOne = async (id: number | string, params?: StrapiQueryParams): Promise<StrapiResponse<T>> => {

    const baseParams = { ...params };
    const idFilter = { id: { $eq: id } }; // Filtra por el ID numérico

    const mergedFilters = {
      ...baseParams.filters,
      ...idFilter
    };

    // Asegura que podamos encontrar borradores (Drafts)
    const finalParams: StrapiQueryParams = {
      ...baseParams,
      filters: mergedFilters,
      publicationState: 'preview'
    };

    const queryString = qs.stringify(finalParams, {
      encodeValuesOnly: true,
    });

    const response = await apiClient.get(`${apiUrl}?${queryString}`);

    const itemsArray = Array.isArray(response.data) ? response.data : response.data?.data;

    if (!itemsArray || itemsArray.length === 0) {
       console.warn(`[404] No se encontró el item con ID ${id} en ${apiUrl}.`);
       throw new Error(`Item con ID ${id} no encontrado.`);
    }

    // Devuelve el primer item (ya aplanado) envuelto como 'findOne'
    // IMPORTANTE: Este item DEBE contener el campo 'documentId'
    const singleItemResponse: StrapiResponse<T> = {
      data: itemsArray[0],
      meta: {},
    };

    return singleItemResponse;
  }

  /**
   * Limpia el payload de claves 'undefined'.
   */
  const cleanPayload = (data: any) => {
    const payload = { ...data };
    Object.keys(payload).forEach(key => {
      if (payload[key] === undefined) {
        delete payload[key];
      }
    });
    return payload;
  }

  /**
   * Crea una nueva entrada (Método estándar POST)
   */
  const create = async (data: any): Promise<StrapiResponse<T>> => {
    const cleanedData = cleanPayload(data);
    const payload = { data: cleanedData }; // Strapi espera el wrapper
    const response = await apiClient.post(apiUrl, payload)
    // Asume que la respuesta viene aplanada o con { data: item }
    return response.data?.data || response.data;
  }

  /**
   * Actualiza una entrada existente - USA documentId (Strapi v5)
   * IMPORTANTE: El código que llama a esta función (ej. handleSubmit en Form.vue)
   * debe pasar el documentId correcto en lugar del 'id' numérico.
   */
  const update = async (documentId: number | string, data: any): Promise<StrapiResponse<T>> => {
     if (!documentId) {
       throw new Error("Se requiere documentId para actualizar la entrada.");
     }
    const cleanedData = cleanPayload(data);
    const payload = { data: cleanedData }; // Strapi espera el wrapper
    // Usa el documentId en la URL
    const response = await apiClient.put(`${apiUrl}/${documentId}`, payload)
    // Asume respuesta aplanada o con { data: item }
    return response.data?.data || response.data;
  }

  /**
   * Elimina una entrada - USA documentId (Strapi v5)
   * IMPORTANTE: El código que llama a esta función (ej. confirmDelete en List.vue)
   * debe pasar el documentId correcto en lugar del 'id' numérico.
   */
  const remove = async (documentId: number | string): Promise<StrapiResponse<T>> => {
     if (!documentId) {
       throw new Error("Se requiere documentId para eliminar la entrada.");
     }
    // Usa el documentId en la URL
    const response = await apiClient.delete(`${apiUrl}/${documentId}`)
    // Asume respuesta aplanada o con { data: item }
    return response.data?.data || response.data;
  }

  return {
    find,
    findOne,
    create,
    update,
    delete: remove, // Mantenemos el nombre 'delete' por convención
  }
}

