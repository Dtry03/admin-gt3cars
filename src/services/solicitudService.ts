import { createCrudService } from '@/api/crudService'

import type { Solicitud } from '@/types' 

export const solicitudService = createCrudService<Solicitud>('solicituds')