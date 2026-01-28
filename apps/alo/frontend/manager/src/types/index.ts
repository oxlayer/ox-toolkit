/**
 * Types for Catalog Management System
 */

// ============================================================================
// PROVIDER TYPE
// ============================================================================

export type ProviderType = 'service_provider' | 'company'

export interface ProviderProfile {
  id: string
  name: string
  type: ProviderType
  email: string | null
  phone: string | null
  // Service provider specific
  agendaEnabled?: boolean
  availabilityEnabled?: boolean
  // Company specific
  addressEnabled?: boolean
  stockEnabled?: boolean
}

// ============================================================================
// SERVICES (for Service Providers)
// ============================================================================

export type PriceType = 'fixed' | 'hourly' | 'starting_at'

export interface Service {
  id: string
  providerId: string
  title: string
  description: string | null
  priceType: PriceType
  price: number
  duration: number | null // minutes, null if not applicable
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateServiceInput {
  title: string
  description?: string
  priceType: PriceType
  price: number
  duration?: number
  active?: boolean
}

export interface UpdateServiceInput extends Partial<CreateServiceInput> {}

// ============================================================================
// PRODUCTS (for Companies)
// ============================================================================

export interface Product {
  id: string
  providerId: string
  title: string
  description: string | null
  price: number
  stock: number
  address: string | null // Location where product is available
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateProductInput {
  title: string
  description?: string
  price: number
  stock: number
  address?: string
  active?: boolean
}

export interface UpdateProductInput extends Partial<CreateProductInput> {}

// ============================================================================
// CHAT & MESSAGES
// ============================================================================

export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read'
export type MessageType = 'text' | 'image' | 'file'

export interface Message {
  id: string
  chatId: string
  senderId: string
  senderName: string
  content: string
  type: MessageType
  status: MessageStatus
  createdAt: string
}

export type ChatStatus = 'open' | 'closed' | 'archived'

export interface Chat {
  id: string
  providerId: string
  customerId: string
  customerName: string
  customerEmail: string | null
  customerPhone: string | null
  status: ChatStatus
  lastMessageAt: string | null
  unreadCount: number
  createdAt: string
  updatedAt: string
}

export interface SendMessageInput {
  chatId: string
  content: string
  type?: MessageType
}

// ============================================================================
// AVAILABILITY (for Service Providers)
// ============================================================================

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'

export interface TimeSlot {
  start: string // HH:mm format
  end: string   // HH:mm format
}

export interface WeeklyAvailability {
  day: DayOfWeek
  enabled: boolean
  slots: TimeSlot[]
}

export interface AvailabilitySchedule {
  providerId: string
  weekly: WeeklyAvailability[]
  timezone: string
}

// ============================================================================
// FEATURE FLAGS
// ============================================================================

export interface FeatureFlags {
  // Service provider features
  hasServices: boolean
  hasAgenda: boolean
  hasAvailability: boolean

  // Company features
  hasProducts: boolean
  hasStock: boolean
  hasAddress: boolean

  // Common features
  hasChat: boolean
}

export function getFeatureFlagsForType(type: ProviderType): FeatureFlags {
  if (type === 'service_provider') {
    return {
      hasServices: true,
      hasAgenda: true,
      hasAvailability: true,
      hasProducts: false,
      hasStock: false,
      hasAddress: false,
      hasChat: true,
    }
  }

  return {
    hasServices: false,
    hasAgenda: false,
    hasAvailability: false,
    hasProducts: true,
    hasStock: true,
    hasAddress: true,
    hasChat: true,
  }
}
