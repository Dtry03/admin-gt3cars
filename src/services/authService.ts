import apiClient from '@/api/apiClient';
import type { StrapiUser } from '@/types';

interface LoginResponse {
  jwt: string;
  user: StrapiUser;
}

interface StrapiError {
  status: number;
  name: string;
  message: string;
  details: Record<string, unknown>;
}

interface StrapiErrorResponse {
  data: null;
  error: StrapiError;
}

export const login = async (identifier: string, password: string): Promise<LoginResponse> => {
  // Validación de entradas
  if (!identifier?.trim()) {
    throw new Error('El correo electrónico es obligatorio');
  }
  if (!password?.trim()) {
    throw new Error('La contraseña es obligatoria');
  }

  const endpoint = '/api/auth/local';
  
  try {
    const response = await apiClient.post<LoginResponse>(endpoint, {
      identifier: identifier.trim(),
      password // No hacemos trim() a la contraseña ya que podría contener espacios válidos
    });

    // Validación de respuesta
    if (!response?.data?.jwt) {
      throw new Error('Respuesta del servidor inválida');
    }

    return response.data;
  } catch (error: any) {
    const respData = error?.response?.data as StrapiErrorResponse;
    
    // Log detallado para depuración
    console.error('Detalles del error de login:', {
      estado: error?.response?.status,
      error: respData?.error,
      mensaje: respData?.error?.message
    });

    // Manejo de errores específicos de Strapi
    if (respData?.error?.name === 'ValidationError') {
      switch (respData.error.message) {
        case 'Invalid identifier or password':
          throw new Error('Correo o contraseña incorrectos. Por favor verifica tus credenciales.');
        case 'Please confirm your email address':
          throw new Error('Por favor confirma tu dirección de correo antes de iniciar sesión.');
        default:
          throw new Error('Error de validación: ' + respData.error.message);
      }
    }

    // Error genérico
    throw new Error('Error al intentar iniciar sesión. Por favor intenta nuevamente.');
  }
};