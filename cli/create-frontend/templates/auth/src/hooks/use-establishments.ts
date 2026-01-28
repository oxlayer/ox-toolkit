/**
 * Establishments hooks
 */

import { useQuery } from '@tanstack/react-query'
import { establishmentsApi } from '../services/api'

export interface EstablishmentsQueryParams {
  page?: number
  perPage?: number
  search?: string
}

export function useEstablishments(params?: EstablishmentsQueryParams) {
  return useQuery({
    queryKey: ['establishments', params],
    queryFn: () => establishmentsApi.getEstablishments(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
