import { createCrudService } from '@/api/crudService'
import type { Article } from '@/types'

export const articleService = createCrudService<Article>('articulos')