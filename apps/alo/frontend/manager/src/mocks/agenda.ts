/**
 * Mock Agenda/Appointments Data with localStorage persistence
 */

const STORAGE_KEY = 'alo_appointments'

export type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled'

export interface Appointment {
  id: string
  clientId: string
  clientName: string
  serviceId: string
  service: string
  startAt: Date
  endAt: Date
  status: AppointmentStatus
  color: string
  price?: number
}

const STATUS_COLORS: Record<AppointmentStatus, string> = {
  scheduled: '#F59E0B',
  confirmed: '#3B82F6',
  completed: '#10B981',
  cancelled: '#6B7280',
}

const CLIENT_NAMES = [
  'Maria Silva Santos', 'João Pedro dos Santos', 'Ana Carolina Costa',
  'Pedro Henrique Lima', 'Carla Oliveira Dias', 'Ricardo Almeida',
  'Fernanda Rodrigues', 'Marcos Vinicius Paulo'
]

const SERVICES = [
  'Instalação de Chuveiro', 'Reparo Elétrico', 'Instalação de Tomadas',
  'Manutenção de Ar Condicionado', 'Troca de Disjuntor', 'Instalação de Luminária',
  'Manutenção Preventiva - Quadro', 'Instalação Ar Condicionado', 'Reparo Elétrico Residencial'
]

// Service prices for mock data
const SERVICE_PRICES: Record<string, number> = {
  'Instalação de Chuveiro': 150,
  'Reparo Elétrico': 120,
  'Instalação de Tomadas': 100,
  'Manutenção de Ar Condicionado': 180,
  'Troca de Disjuntor': 80,
  'Instalação de Luminária': 120,
  'Manutenção Preventiva - Quadro': 200,
  'Instalação Ar Condicionado': 350,
  'Reparo Elétrico Residencial': 150,
}

// Generate random appointments for the next 60 days
function generateRandomAppointments(): Appointment[] {
  const appointments: Appointment[] = []
  const now = new Date()

  // Generate 15-25 random appointments
  const count = Math.floor(Math.random() * 11) + 15

  for (let i = 0; i < count; i++) {
    const clientIndex = Math.floor(Math.random() * CLIENT_NAMES.length)
    const clientName = CLIENT_NAMES[clientIndex]
    const clientId = `client-${clientIndex + 1}`
    const serviceIndex = Math.floor(Math.random() * SERVICES.length)
    const serviceName = SERVICES[serviceIndex]
    const serviceId = `service-${serviceIndex + 1}`

    const daysOffset = Math.floor(Math.random() * 60) - 7 // Some in the past (up to 7 days ago)
    const appointmentDate = new Date(now)
    appointmentDate.setDate(now.getDate() + daysOffset)

    // Random time between 8:00 and 18:00
    const startHour = 8 + Math.floor(Math.random() * 9)
    const startMinute = [0, 15, 30, 45][Math.floor(Math.random() * 4)]
    const durationHours = [1, 1.5, 2, 3, 4][Math.floor(Math.random() * 5)]
    const durationMinutes = durationHours % 1 === 0 ? 0 : 30

    const startAt = new Date(appointmentDate)
    startAt.setHours(startHour, startMinute, 0, 0)

    const endAt = new Date(startAt)
    endAt.setHours(startAt.getHours() + Math.floor(durationHours), startAt.getMinutes() + durationMinutes)

    const statusRoll = Math.random()
    let status: AppointmentStatus
    if (daysOffset < -1) {
      status = 'completed'
    } else if (daysOffset < 0) {
      status = statusRoll < 0.7 ? 'completed' : 'confirmed'
    } else if (statusRoll < 0.3) {
      status = 'confirmed'
    } else {
      status = 'scheduled'
    }

    const price = status === 'completed' ? SERVICE_PRICES[serviceName] || 150 : undefined

    appointments.push({
      id: `apt-${Date.now()}-${i}`,
      clientId,
      clientName,
      serviceId,
      service: serviceName,
      startAt,
      endAt,
      status,
      color: STATUS_COLORS[status],
      price,
    })
  }

  return appointments.sort((a, b) => a.startAt.getTime() - b.startAt.getTime())
}

// Get appointments from localStorage or generate new ones
function getStoredAppointments(): Appointment[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      // Convert date strings back to Date objects
      return parsed.map((apt: any) => ({
        ...apt,
        startAt: new Date(apt.startAt),
        endAt: new Date(apt.endAt),
      }))
    }
  } catch (error) {
    console.error('Error reading appointments from localStorage:', error)
  }

  // Generate and store
  const appointments = generateRandomAppointments()
  setStoredAppointments(appointments)
  return appointments
}

// Store appointments in localStorage
function setStoredAppointments(appointments: Appointment[]): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appointments))
  } catch (error) {
    console.error('Error writing appointments to localStorage:', error)
  }
}

// Export
export let mockAppointments: Appointment[] = getStoredAppointments()

export const getAppointmentById = (id: string): Appointment | undefined => {
  return mockAppointments.find(apt => apt.id === id)
}

export const getAppointmentsByDate = (date: Date): Appointment[] => {
  return mockAppointments.filter(apt => {
    return apt.startAt.toDateString() === date.toDateString()
  })
}

export const getAppointmentsByStatus = (status: AppointmentStatus): Appointment[] => {
  return mockAppointments.filter(apt => apt.status === status)
}

export const getUpcomingAppointments = (): Appointment[] => {
  const now = new Date()
  return mockAppointments
    .filter(apt => apt.startAt > now)
    .sort((a, b) => a.startAt.getTime() - b.startAt.getTime())
}

export const getAppointmentsByClient = (clientName: string): Appointment[] => {
  return mockAppointments.filter(apt =>
    apt.clientName.toLowerCase().includes(clientName.toLowerCase())
  )
}

// CRUD functions
export function createAppointment(appointment: Omit<Appointment, 'id' | 'color'>): Appointment {
  const newAppointment: Appointment = {
    ...appointment,
    id: `apt-${Date.now()}`,
    color: STATUS_COLORS[appointment.status],
  }
  mockAppointments.push(newAppointment)
  mockAppointments.sort((a, b) => a.startAt.getTime() - b.startAt.getTime())
  setStoredAppointments(mockAppointments)
  return newAppointment
}

export function updateAppointmentStatus(id: string, status: AppointmentStatus): Appointment | null {
  const appointment = mockAppointments.find(apt => apt.id === id)
  if (!appointment) return null

  appointment.status = status
  appointment.color = STATUS_COLORS[status]
  setStoredAppointments(mockAppointments)
  return appointment
}

export function deleteAppointment(id: string): boolean {
  const initialLength = mockAppointments.length
  mockAppointments = mockAppointments.filter(apt => apt.id !== id)

  if (mockAppointments.length !== initialLength) {
    setStoredAppointments(mockAppointments)
    return true
  }
  return false
}

export function resetAppointments(): void {
  localStorage.removeItem(STORAGE_KEY)
  mockAppointments = getStoredAppointments()
}
