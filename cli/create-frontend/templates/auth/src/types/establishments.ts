/**
 * Types
 */

export interface Establishment {
  id: string
  name: string
  address?: string
  phone?: string
  createdAt: string
}

export interface CreateEstablishmentInput {
  name: string
  address?: string
  phone?: string
}

export interface UpdateEstablishmentInput {
  name?: string
  address?: string
  phone?: string
}

export interface EstablishmentsResponse {
  data: Establishment[]
  meta: {
    page: number
    perPage: number
    total: number
  }
}
