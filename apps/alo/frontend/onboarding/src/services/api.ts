const API_BASE_URL = import.meta.env.VITE_API_URL

export interface ServiceCategory {
  id: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  name: string
  description: string
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
    return this.request<ServiceCategory[]>('/api/auth/service-categories')
  }

  async getEstablishmentTypes(): Promise<EstablishmentType[]> {
    return this.request<EstablishmentType[]>('/api/auth/establishment-types')
  }

  async submitOnboardingLead(lead: OnboardingLead): Promise<{ message: string; id?: string }> {
    return this.request<{ message: string; id?: string }>('/api/auth/onboarding-leads', {
      method: 'POST',
      body: JSON.stringify(lead),
    })
  }
}

export const apiService = new ApiService()
