/**
 * Services API
 */

import { api } from '../lib/api'

export interface EstablishmentsQueryParams {
  page?: number
  perPage?: number
  search?: string
}

export const establishmentsApi = {
  getEstablishments: (params?: EstablishmentsQueryParams) =>
    api.get<EstablishmentsResponse>('/establishments', {
      params,
    }),

  createEstablishment: (data: CreateEstablishmentInput) =>
    api.post<Establishment>('/establishments', data),

  updateEstablishment: (id: string, data: UpdateEstablishmentInput) =>
    api.patch<Establishment>(`/establishments/${id}`, data),

  deleteEstablishment: (id: string) =>
    api.delete<void>(`/establishments/${id}`),
}
