import { apiClient } from './client'
import type { User, CreateUserInput } from '@/types'

/**
 * Users API
 */
export const usersApi = {
  /**
   * Get all users
   */
  getAll: async (): Promise<User[]> => {
    const { data } = await apiClient.get<User[]>('/users')
    return data
  },

  /**
   * Get user by ID
   */
  getById: async (id: number): Promise<User> => {
    const { data } = await apiClient.get<User>(`/users/${id}`)
    return data
  },

  /**
   * Create a new user
   */
  create: async (input: CreateUserInput): Promise<User> => {
    const { data } = await apiClient.post<User>('/users', input)
    return data
  },

  /**
   * Update a user
   */
  update: async (id: number, input: Partial<CreateUserInput>): Promise<User> => {
    const { data } = await apiClient.put<User>(`/users/${id}`, input)
    return data
  },

  /**
   * Delete a user
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/users/${id}`)
  },
}
