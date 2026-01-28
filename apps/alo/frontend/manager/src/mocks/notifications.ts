/**
 * Mock Notifications Data with localStorage persistence
 */

export type NotificationType = 'appointment' | 'message' | 'review' | 'system'
export type NotificationStatus = 'unread' | 'read'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  status: NotificationStatus
  createdAt: string
  link?: string
  icon?: string
}

const STORAGE_KEY = 'alo_notifications'

// Generate random notifications
function generateRandomNotifications(): Notification[] {
  const clientNames = [
    'Maria Silva Santos', 'João Pedro dos Santos', 'Ana Carolina Costa',
    'Pedro Henrique Lima', 'Carla Oliveira Dias', 'Ricardo Almeida',
    'Fernanda Rodrigues', 'Marcos Vinicius Paulo'
  ]

  const templates = [
    { type: 'message' as const, icon: '💬', titlePrefix: 'Nova mensagem de', messagePrefix: 'enviou uma nova mensagem' },
    { type: 'appointment' as const, icon: '📅', titlePrefix: 'Agendamento', messagePrefix: 'agendou um serviço de' },
    { type: 'appointment' as const, icon: '⏰', titlePrefix: 'Lembrete:', messagePrefix: 'Lembrete: Agendamento hoje às' },
    { type: 'review' as const, icon: '⭐', titlePrefix: 'Nova avaliação!', messagePrefix: 'avaliou seu serviço com' },
    { type: 'system' as const, icon: '👋', titlePrefix: 'Bem-vindo!', messagePrefix: 'Bem-vindo ao' },
  ]

  const notifications: Notification[] = []
  const now = new Date()

  // Generate 10-15 random notifications
  const count = Math.floor(Math.random() * 6) + 10

  for (let i = 0; i < count; i++) {
    const template = templates[Math.floor(Math.random() * templates.length)]
    const clientName = clientNames[Math.floor(Math.random() * clientNames.length)]
    const daysAgo = Math.floor(Math.random() * 30)
    const hoursAgo = Math.floor(Math.random() * 24)
    const minutesAgo = Math.floor(Math.random() * 60)

    let createdAt = new Date(now)
    if (daysAgo > 0) createdAt.setDate(createdAt.getDate() - daysAgo)
    else if (hoursAgo > 0) createdAt.setHours(createdAt.getHours() - hoursAgo)
    else createdAt.setMinutes(createdAt.getMinutes() - minutesAgo)

    const isUnread = i < 3 // First 3 are unread
    const hasLink = template.type !== 'system' || Math.random() > 0.5

    let title = template.titlePrefix
    let message = template.messagePrefix

    if (template.type === 'message') {
      title = `${template.titlePrefix} ${clientName.split(' ')[0]}`
      message = `${clientName.split(' ')[0]} ${template.messagePrefix} sobre o agendamento.`
    } else if (template.type === 'appointment') {
      if (template.icon === '📅') {
        const hour = 9 + Math.floor(Math.random() * 10)
        title = `${template.titlePrefix} confirmado`
        message = `${clientName} confirmou o agendamento para ${hour}:00.`
      } else {
        const hour = 14 + Math.floor(Math.random() * 4)
        title = template.titlePrefix
        message = `Você tem um agendamento hoje às ${hour}:00 com ${clientName}.`
      }
    } else if (template.type === 'review') {
      const stars = Math.floor(Math.random() * 2) + 4 // 4-5 stars
      title = template.titlePrefix
      message = `${clientName} ${template.messagePrefix} ${stars} estrelas!`
    } else if (template.type === 'system') {
      title = template.titlePrefix
      message = `${template.messagePrefix} sistema!`
    }

    notifications.push({
      id: `notif-${Date.now()}-${i}`,
      type: template.type,
      title,
      message,
      status: isUnread ? 'unread' : 'read',
      createdAt: createdAt.toISOString(),
      link: hasLink ? (template.type === 'message' ? '/chats' : '/agenda') : undefined,
      icon: template.icon,
    })
  }

  // Sort by date descending
  return notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

// Get notifications from localStorage or generate new ones
function getStoredNotifications(): Notification[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('Error reading notifications from localStorage:', error)
  }

  // Generate and store
  const notifications = generateRandomNotifications()
  setStoredNotifications(notifications)
  return notifications
}

// Store notifications in localStorage
function setStoredNotifications(notifications: Notification[]): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications))
  } catch (error) {
    console.error('Error writing notifications to localStorage:', error)
  }
}

// Export functions
export let mockNotifications: Notification[] = getStoredNotifications()

export function getUnreadCount(): number {
  return mockNotifications.filter(n => n.status === 'unread').length
}

export function getNotificationsByType(type: NotificationType): Notification[] {
  return mockNotifications.filter(n => n.type === type)
}

export function getRecentNotifications(limit: number = 10): Notification[] {
  return [...mockNotifications]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit)
}

export function markAsRead(id: string): void {
  const notification = mockNotifications.find(n => n.id === id)
  if (notification && notification.status === 'unread') {
    notification.status = 'read'
    setStoredNotifications(mockNotifications)
  }
}

export function markAllAsRead(): void {
  mockNotifications.forEach(n => {
    if (n.status === 'unread') {
      n.status = 'read'
    }
  })
  setStoredNotifications(mockNotifications)
}

export function addNotification(notification: Omit<Notification, 'id'>): Notification {
  const newNotification: Notification = {
    ...notification,
    id: `notif-${Date.now()}`,
    createdAt: new Date().toISOString(),
  }
  mockNotifications.unshift(newNotification)
  setStoredNotifications(mockNotifications)
  return newNotification
}

export function deleteNotification(id: string): void {
  mockNotifications = mockNotifications.filter(n => n.id !== id)
  setStoredNotifications(mockNotifications)
}

export function clearAllNotifications(): void {
  mockNotifications = []
  setStoredNotifications(mockNotifications)
}
