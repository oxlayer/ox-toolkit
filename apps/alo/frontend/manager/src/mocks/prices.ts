/**
 * Mock Prices/Pricing Data
 */

export interface PriceTier {
  id: string
  name: string
  description: string
  minPrice: number
  maxPrice: number
  popular: boolean
}

export const priceTiers: PriceTier[] = [
  {
    id: 'economy',
    name: 'Econômico',
    description: 'Serviços simples e rápidos',
    minPrice: 50,
    maxPrice: 150,
    popular: false,
  },
  {
    id: 'standard',
    name: 'Padrão',
    description: 'Serviços comuns com qualidade garantida',
    minPrice: 150,
    maxPrice: 350,
    popular: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Serviços complexos e especializados',
    minPrice: 350,
    maxPrice: 800,
    popular: false,
  },
]

export interface PricingRule {
  id: string
  name: string
  type: 'fixed' | 'hourly' | 'starting_at' | 'per_unit'
  basePrice: number
  description: string
  conditions?: string[]
}

export const pricingRules: PricingRule[] = [
  {
    id: 'rule-1',
    name: 'Visita Técnica',
    type: 'fixed',
    basePrice: 80,
    description: 'Avaliação inicial do problema e orçamento',
    conditions: ['Valor deduzido do serviço final se contratado'],
  },
  {
    id: 'rule-2',
    name: 'Mão de Obra por Hora',
    type: 'hourly',
    basePrice: 80,
    description: 'Para serviços não previstos em tabela',
    conditions: ['Mínimo de 1 hora', 'Frações de hora são cobradas proporcionalmente'],
  },
  {
    id: 'rule-3',
    name: 'Taxa de Deslocamento',
    type: 'fixed',
    basePrice: 30,
    description: 'Para atendimentos fora da área central',
    conditions: ['Até 10km de distância', 'Acima disso, R$ 3,00 por km adicional'],
  },
  {
    id: 'rule-4',
    name: 'Serviço de Urgência',
    type: 'fixed',
    basePrice: 100,
    description: 'Acréscimo para atendimentos fora do horário comercial',
    conditions: ['Após 18h e antes de 8h', 'Sábados após 13h', 'Domingos e feriados'],
  },
]

export interface ServicePrice {
  serviceId: string
  serviceName: string
  priceType: 'fixed' | 'hourly' | 'starting_at'
  price: number
  estimatedDuration: number // minutes
  description: string
}

export const servicePrices: ServicePrice[] = [
  {
    serviceId: '1',
    serviceName: 'Instalação de Chuveiro Elétrico',
    priceType: 'fixed',
    price: 150,
    estimatedDuration: 60,
    description: 'Inclui suporte e ajustes necessários',
  },
  {
    serviceId: '2',
    serviceName: 'Reparo de Instalação Elétrica Residencial',
    priceType: 'hourly',
    price: 80,
    estimatedDuration: 60,
    description: 'Mínimo de 1 hora',
  },
  {
    serviceId: '3',
    serviceName: 'Instalação de Tomadas e Interruptores',
    priceType: 'starting_at',
    price: 100,
    estimatedDuration: 90,
    description: 'Até 3 pontos. Pontos adicionais: R$ 40 cada',
  },
  {
    serviceId: '4',
    serviceName: 'Manutenção Preventiva - Quadro Elétrico',
    priceType: 'fixed',
    price: 200,
    estimatedDuration: 120,
    description: 'Verificação completa e relatório',
  },
  {
    serviceId: '5',
    serviceName: 'Troca de Disjuntor',
    priceType: 'fixed',
    price: 80,
    estimatedDuration: 30,
    description: 'Não inclui o material',
  },
  {
    serviceId: '6',
    serviceName: 'Instalação de Luminária/Teto',
    priceType: 'fixed',
    price: 120,
    estimatedDuration: 60,
    description: 'Inclui fixação e conexão elétrica',
  },
  {
    serviceId: '7',
    serviceName: 'Instalação de Ar Condicionado Split',
    priceType: 'starting_at',
    price: 350,
    estimatedDuration: 180,
    description: 'Até 12.000 BTUs. Material por conta do cliente',
  },
  {
    serviceId: '8',
    serviceName: 'Manutenção de Ar Condicionado',
    priceType: 'fixed',
    price: 150,
    estimatedDuration: 90,
    description: 'Limpeza completa e verificação de gás',
  },
]

export const getServicePrice = (serviceId: string): ServicePrice | undefined => {
  return servicePrices.find(sp => sp.serviceId === serviceId)
}

export const getServicesByPriceRange = (minPrice: number, maxPrice: number): ServicePrice[] => {
  return servicePrices.filter(sp => sp.price >= minPrice && sp.price <= maxPrice)
}

export const getServicesByPriceType = (priceType: ServicePrice['priceType']): ServicePrice[] => {
  return servicePrices.filter(sp => sp.priceType === priceType)
}

export const calculateEstimatedPrice = (servicePrice: ServicePrice, hours?: number): number => {
  if (servicePrice.priceType === 'hourly' && hours) {
    return servicePrice.price * hours
  }
  return servicePrice.price
}
