import { createCrudService } from '@/api/crudService'
import type { Vehicle } from '@/types'

export const vehicleService = createCrudService<Vehicle>('vehiculos')