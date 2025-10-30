import { createCrudService } from '@/api/crudService'
import type { Brand } from '@/types'

export const brandService = createCrudService<Brand>('marcas')