import { apiClient } from './client'
import type {
  Establishment,
  CreateEstablishmentInput,
  EstablishmentType,
  CreateEstablishmentTypeInput,
} from '@/types'

/**
 * Establishments API
 */
export const establishmentsApi = {
  /**
   * Get all establishments
   */
  getAll: async (): Promise<Establishment[]> => {
    const { data } = await apiClient.get<{ data: Establishment[] }>('/establishments')
    return data.data
  },

  /**
   * Get establishment by ID
   */
  getById: async (id: number): Promise<Establishment> => {
    const { data } = await apiClient.get<Establishment>(`/establishments/${id}`)
    return data
  },

  /**
   * Create a new establishment
   */
  create: async (input: CreateEstablishmentInput): Promise<Establishment> => {
    const { data } = await apiClient.post<Establishment>('/establishments', input)
    return data
  },

  /**
   * Update an establishment
   */
  update: async (id: number, input: Partial<CreateEstablishmentInput>): Promise<Establishment> => {
    const { data } = await apiClient.put<Establishment>(`/establishments/${id}`, input)
    return data
  },

  /**
   * Delete an establishment
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/establishments/${id}`)
  },

  /**
   * Get all establishment types
   */
  getTypes: async (): Promise<EstablishmentType[]> => {
    const { data } = await apiClient.get<EstablishmentType[]>('/establishment-types')
    return data
  },

  /**
   * Create establishment type
   */
  createType: async (input: CreateEstablishmentTypeInput): Promise<EstablishmentType> => {
    const { data } = await apiClient.post<EstablishmentType>('/establishment-types', input)
    return data
  },

  /**
   * Update establishment type
   */
  updateType: async (id: number, input: Partial<CreateEstablishmentTypeInput>): Promise<EstablishmentType> => {
    const { data } = await apiClient.put<EstablishmentType>(`/establishment-types/${id}`, input)
    return data
  },

  /**
   * Delete establishment type
   */
  deleteType: async (id: number): Promise<void> => {
    await apiClient.delete(`/establishment-types/${id}`)
  },
}
