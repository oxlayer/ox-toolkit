/**
 * Mock Services Data with localStorage persistence
 */

import type { Service, CreateServiceInput, UpdateServiceInput, PriceType } from '@/types'

const STORAGE_KEY = 'alo_services'

// Generate random services
function generateRandomServices(): Service[] {
  const serviceTemplates = [
    {
      title: 'Instalação de Chuveiro Elétrico',
      description: 'Instalação completa de chuveiro elétrico, com substituição de suporte e ajuste de altura.',
      priceType: 'fixed' as PriceType,
      basePrice: 150,
      duration: 60,
    },
    {
      title: 'Reparo de Instalação Elétrica Residencial',
      description: 'Diagnóstico e reparo de problemas elétricos em residências. Tomadas, interruptores, luminárias.',
      priceType: 'hourly' as PriceType,
      basePrice: 80,
      duration: 60,
    },
    {
      title: 'Instalação de Tomadas e Interruptores',
      description: 'Instalação de pontos adicionais de tomadas e interruptores. Até 3 pontos.',
      priceType: 'starting_at' as PriceType,
      basePrice: 100,
      duration: 90,
    },
    {
      title: 'Manutenção Preventiva - Quadro Elétrico',
      description: 'Verificação completa do quadro elétrico, aperto de conexões, identificação de problemas potenciais.',
      priceType: 'fixed' as PriceType,
      basePrice: 200,
      duration: 120,
    },
    {
      title: 'Troca de Disjuntor',
      description: 'Substituição de disjuntor padrão (monopolar, bipolar ou tripolar). Não inclui o material.',
      priceType: 'fixed' as PriceType,
      basePrice: 80,
      duration: 30,
    },
    {
      title: 'Instalação de Luminária/Teto',
      description: 'Instalação de luminárias de teto. Inclui fixação e conexão elétrica.',
      priceType: 'fixed' as PriceType,
      basePrice: 120,
      duration: 60,
    },
    {
      title: 'Instalação de Ar Condicionado Split',
      description: 'Instalação completa de ar condicionado split até 12.000 BTUs. Inclui fixação e conexões elétricas.',
      priceType: 'starting_at' as PriceType,
      basePrice: 350,
      duration: 180,
    },
    {
      title: 'Manutenção de Ar Condicionado',
      description: 'Limpeza de filtros, verificação de gás, limpeza da unidade interna e externa.',
      priceType: 'fixed' as PriceType,
      basePrice: 150,
      duration: 90,
    },
  ]

  return serviceTemplates.map((template, index) => {
    // Add some random variation to price
    const priceVariation = Math.floor(Math.random() * 20) - 10 // +/- 10
    const price = Math.max(50, template.basePrice + priceVariation)

    return {
      id: `service-${index + 1}`,
      providerId: 'provider-1',
      title: template.title,
      description: template.description,
      priceType: template.priceType,
      price,
      duration: template.duration,
      active: Math.random() > 0.1, // 90% chance of being active
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    }
  })
}

// Get services from localStorage or generate new ones
function getStoredServices(): Service[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('Error reading services from localStorage:', error)
  }

  // Generate and store
  const services = generateRandomServices()
  setStoredServices(services)
  return services
}

// Store services in localStorage
function setStoredServices(services: Service[]): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(services))
  } catch (error) {
    console.error('Error writing services to localStorage:', error)
  }
}

// Export functions
export let mockServices: Service[] = getStoredServices()

export function getServiceById(id: string): Service | undefined {
  return mockServices.find(service => service.id === id)
}

export function getServicesByProviderId(providerId: string): Service[] {
  return mockServices.filter(service => service.providerId === providerId)
}

export function getActiveServices(): Service[] {
  return mockServices.filter(service => service.active)
}

// CRUD functions
export function createService(input: CreateServiceInput): Service {
  const newService: Service = {
    title: input.title,
    description: input.description || null,
    priceType: input.priceType,
    price: input.price,
    duration: input.duration || null,
    active: input.active ?? true,
    id: `service-${Date.now()}`,
    providerId: 'provider-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  mockServices.unshift(newService)
  setStoredServices(mockServices)
  return newService
}

export function updateService(id: string, input: UpdateServiceInput): Service | null {
  const index = mockServices.findIndex(s => s.id === id)
  if (index === -1) return null

  mockServices[index] = {
    ...mockServices[index],
    ...input,
    updatedAt: new Date().toISOString(),
  }

  setStoredServices(mockServices)
  return mockServices[index]
}

export function deleteService(id: string): boolean {
  const initialLength = mockServices.length
  mockServices = mockServices.filter(s => s.id !== id)

  if (mockServices.length !== initialLength) {
    setStoredServices(mockServices)
    return true
  }
  return false
}

export function toggleServiceActive(id: string): Service | null {
  const service = mockServices.find(s => s.id === id)
  if (!service) return null

  service.active = !service.active
  service.updatedAt = new Date().toISOString()
  setStoredServices(mockServices)
  return service
}

// Reset function for testing
export function resetServices(): void {
  localStorage.removeItem(STORAGE_KEY)
  mockServices = getStoredServices()
}
