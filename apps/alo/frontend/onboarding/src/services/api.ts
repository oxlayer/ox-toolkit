const API_BASE_URL = import.meta.env.VITE_API_URL

export interface ServiceCategory {
  id: number
  createdAt: string | null
  updatedAt: string | null
  deletedAt: string | null
  name: string
  description: string | null
}

export interface EstablishmentType {
  id: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  name: string
  description: string
  requiresDelivery: boolean
  requiresLocation: boolean
  requiresMenu: boolean
  requiresHours: boolean
}

export interface OnboardingLead {
  user_type: 'provider' | 'company'
  category?: string
  establishment_type?: string
  document?: string
  email?: string
  name?: string
  phone?: string
  terms_accepted: boolean
  privacy_accepted: boolean
}

class ApiService {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  async getServiceCategories(): Promise<ServiceCategory[]> {
    const response = await this.request<{ success: boolean; data: ServiceCategory[]; pageInfo: { limit: number; hasNext: boolean; nextCursor?: string } }>('/public/service-categories')
    return response.data
  }

  async getEstablishmentTypes(): Promise<EstablishmentType[]> {
    return this.request<EstablishmentType[]>('/public/establishment-types')
  }

  async submitOnboardingLead(lead: OnboardingLead): Promise<{ message: string; id?: string }> {
    return this.request<{ message: string; id?: string }>('/public/onboarding-leads', {
      method: 'POST',
      body: JSON.stringify(lead),
    })
  }
}

export const apiService = new ApiService()
