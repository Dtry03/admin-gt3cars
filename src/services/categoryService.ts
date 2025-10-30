import { createCrudService } from '@/api/crudService'
import type { Category } from '@/types'

export const categoryService = createCrudService<Category>('categorias')