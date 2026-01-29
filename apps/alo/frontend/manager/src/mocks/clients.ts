/**
 * Mock Clients Data with localStorage persistence
 */

const STORAGE_KEY = 'alo_clients'

export interface Client {
  id: string
  name: string
  email: string | null
  phone: string | null
  cpf: string | null
  address: string | null
  city: string | null
  state: string | null
  zipCode: string | null
  birthdate: string | null
  notes: string | null
  chatId: string | null
  createdAt: string
  totalAppointments: number
  totalSpent: number
  // Links to related entities
  lastAppointmentDate: string | null
  nextAppointmentDate: string | null
}

const CLIENT_NAMES = [
  'Maria Silva Santos', 'João Pedro dos Santos', 'Ana Carolina Costa',
  'Pedro Henrique Lima', 'Carla Oliveira Dias', 'Ricardo Almeida',
  'Fernanda Rodrigues', 'Marcos Vinicius Paulo', 'Juliana Martins',
  'Lucas Oliveira', 'Camila Ferreira', 'Gabriel Souza'
]

const STREET_NAMES = [
  'Rua das Flores', 'Av. Paulista', 'Rua Augusta', 'Rua Consolação',
  'Rua Haddock Lobo', 'Rua Oscar Freire', 'Av. Rebouças', 'Rua Pamplona'
]

const CITIES = ['São Paulo', 'Santo André', 'São Bernardo do Campo', 'São Caetano do Sul']

const STATES = ['SP', 'RJ', 'MG', 'RS']

// Generate random CPF
function generateCPF(): string {
  const digits = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10))
  return `${digits.slice(0, 3).join('')}.${digits.slice(3, 6).join('')}.${digits.slice(6, 9).join('')}-00`
}

// Generate random phone
function generatePhone(): string {
  return `+55 11 9${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`
}

// Generate random CEP
function generateCEP(): string {
  return `${Math.floor(Math.random() * 90000) + 10000}-${Math.floor(Math.random() * 900) + 100}`
}

// Generate random clients
function generateRandomClients(): Client[] {
  const clients: Client[] = []
  const now = new Date()
  const clientCount = Math.floor(Math.random() * 8) + 6 // 6-13 clients

  for (let i = 0; i < clientCount; i++) {
    const name = CLIENT_NAMES[i % CLIENT_NAMES.length]
    const firstName = name.split(' ')[0]
    const daysAgo = Math.floor(Math.random() * 90) + 1 // 1-90 days ago

    const createdAt = new Date(now)
    createdAt.setDate(now.getDate() - daysAgo)

    // Generate random birthdate (between 18 and 70 years ago)
    const birthdate = new Date(now)
    birthdate.setFullYear(now.getFullYear() - (Math.floor(Math.random() * 52) + 18))

    const totalAppointments = Math.floor(Math.random() * 8) + 1
    const totalSpent = (Math.floor(Math.random() * 700) + 100) * totalAppointments

    const hasEmail = Math.random() > 0.15 // 85% have email
    const hasAddress = Math.random() > 0.3 // 70% have address
    const hasNotes = Math.random() > 0.7 // 30% have notes

    // Generate sample notes
    const sampleNotes = [
      'Prefere atendimento pela manhã',
      'Alérgico a alguns produtos',
      'Cliente VIP, sempre pontual',
      'Prefere pagamentos em dinheiro',
      'Gosta de conversar durante o atendimento',
    ]

    clients.push({
      id: `client-${i + 1}`,
      name,
      email: hasEmail ? `${firstName.toLowerCase().replace(' ', '.')}@email.com` : null,
      phone: generatePhone(),
      cpf: generateCPF(),
      address: hasAddress ? `${STREET_NAMES[i % STREET_NAMES.length]}, ${Math.floor(Math.random() * 999) + 1}` : null,
      city: hasAddress ? CITIES[Math.floor(Math.random() * CITIES.length)] : null,
      state: hasAddress ? STATES[Math.floor(Math.random() * STATES.length)] : null,
      zipCode: hasAddress ? generateCEP() : null,
      birthdate: birthdate.toISOString(),
      notes: hasNotes ? sampleNotes[Math.floor(Math.random() * sampleNotes.length)] : null,
      chatId: `chat-${i + 1}`,
      createdAt: createdAt.toISOString(),
      totalAppointments,
      totalSpent,
      lastAppointmentDate: totalAppointments > 0 ? new Date(Date.now() - Math.floor(Math.random() * 60) * 24 * 60 * 60 * 1000).toISOString() : null,
      nextAppointmentDate: Math.random() > 0.5 ? new Date(Date.now() + Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString() : null,
    })
  }

  return clients.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

// Get clients from localStorage or generate new ones
function getStoredClients(): Client[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('Error reading clients from localStorage:', error)
  }

  const clients = generateRandomClients()
  setStoredClients(clients)
  return clients
}

// Store clients in localStorage
function setStoredClients(clients: Client[]): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clients))
  } catch (error) {
    console.error('Error writing clients to localStorage:', error)
  }
}

// Export
export let mockClients: Client[] = getStoredClients()

// Query functions
export const getClientById = (id: string): Client | undefined => {
  return mockClients.find(client => client.id === id)
}

export const searchClients = (query: string): Client[] => {
  const lowerQuery = query.toLowerCase()
  return mockClients.filter(client =>
    client.name.toLowerCase().includes(lowerQuery) ||
    client.email?.toLowerCase().includes(lowerQuery) ||
    client.phone?.includes(query)
  )
}

export const getTopClients = (limit: number = 5): Client[] => {
  return [...mockClients]
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, limit)
}

export const getRecentClients = (limit: number = 10): Client[] => {
  return [...mockClients]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit)
}

// CRUD functions
export function createClient(input: Omit<Client, 'id' | 'createdAt' | 'totalAppointments' | 'totalSpent' | 'birthdate' | 'notes' | 'chatId'> & { birthdate?: string | null; notes?: string | null; chatId?: string | null }): Client {
  const newClient: Client = {
    ...input,
    birthdate: input.birthdate || null,
    notes: input.notes || null,
    chatId: input.chatId || null,
    id: `client-${Date.now()}`,
    createdAt: new Date().toISOString(),
    totalAppointments: 0,
    totalSpent: 0,
  }
  mockClients.unshift(newClient)
  setStoredClients(mockClients)
  return newClient
}

export function updateClient(id: string, updates: Partial<Omit<Client, 'id' | 'createdAt'>>): Client | null {
  const client = mockClients.find(c => c.id === id)
  if (!client) return null

  Object.assign(client, updates)
  setStoredClients(mockClients)
  return client
}

export function deleteClient(id: string): boolean {
  const initialLength = mockClients.length
  mockClients = mockClients.filter(c => c.id !== id)

  if (mockClients.length !== initialLength) {
    setStoredClients(mockClients)
    return true
  }
  return false
}

export function incrementClientAppointments(id: string, amountSpent: number): Client | null {
  const client = mockClients.find(c => c.id === id)
  if (!client) return null

  client.totalAppointments += 1
  client.totalSpent += amountSpent
  setStoredClients(mockClients)
  return client
}

export function resetClients(): void {
  localStorage.removeItem(STORAGE_KEY)
  mockClients = getStoredClients()
}
