/**
 * Mock Chats Data with localStorage persistence
 */

import type { Chat, Message } from '@/types'

const CHATS_STORAGE_KEY = 'alo_chats'
const MESSAGES_STORAGE_KEY = 'alo_messages'

export type ChatStatus = 'open' | 'closed'
export type MessageStatus = 'sent' | 'delivered' | 'read'

const CLIENT_NAMES = [
  'Maria Silva Santos', 'João Pedro dos Santos', 'Ana Carolina Costa',
  'Pedro Henrique Lima', 'Carla Oliveira Dias', 'Ricardo Almeida',
  'Fernanda Rodrigues', 'Marcos Vinicius Paulo'
]

const MESSAGE_TEMPLATES = {
  client: [
    'Olá! Gostaria de saber mais sobre seus serviços.',
    'Você tem disponibilidade na próxima semana?',
    'Quanto custa o serviço de {servico}?',
    'Preciso de um orçamento para {servico}.',
    'O serviço inclui o material?',
    'Você atende no meu bairro?',
    'Posso agendar para amanhã?',
    'Quanto tempo demora o serviço?',
    'Aceita cartão de crédito?',
    'Tem alguma garantia no serviço?'
  ],
  provider: [
    'Olá! Tudo bem? Em que posso ajudar?',
    'Tenho sim! Qual dia fica melhor para você?',
    'O valor é R$ {valor}. Inclui mão de obra completa.',
    'Sim, atendo! Me passa seu endereço.',
    'O serviço tem garantia de 30 dias.',
    'Funciona! Qual horário prefere?',
    'Preciso saber mais detalhes sobre o serviço.',
    'Vou verificar e te retorno.',
    'Sim, aceito cartão, PIX ou dinheiro.',
    'O material pode ser por seu conta ou posso eu providenciar.'
  ]
}

const SERVICES = [
  'instalação elétrica', 'chuveiro', 'tomadas', 'ar condicionado',
  'manutenção elétrica', 'disjuntor', 'luminária', 'quadro elétrico'
]

// Generate random messages for a chat
function generateMessages(chatId: string, customerName: string): Message[] {
  const messages: Message[] = []
  const messageCount = Math.floor(Math.random() * 8) + 3 // 3-10 messages
  const now = new Date()

  for (let i = 0; i < messageCount; i++) {
    const isFromProvider = i % 2 === 1
    const senderId = isFromProvider ? 'provider-1' : `client-${chatId.split('-')[1]}`
    const senderName = isFromProvider ? 'Você' : customerName

    const template = MESSAGE_TEMPLATES[isFromProvider ? 'provider' : 'client']
    const content = template[Math.floor(Math.random() * template.length)]
      .replace('{servico}', SERVICES[Math.floor(Math.random() * SERVICES.length)])
      .replace('{valor}', `${Math.floor(Math.random() * 300) + 80}`)

    const minutesAgo = (messageCount - i) * (Math.floor(Math.random() * 30) + 5)
    const createdAt = new Date(now.getTime() - minutesAgo * 60000)

    const statusRoll = Math.random()
    let status: MessageStatus = 'sent'
    if (isFromProvider && statusRoll > 0.3) status = 'read'
    else if (isFromProvider && statusRoll > 0.1) status = 'delivered'

    messages.push({
      id: `msg-${chatId}-${i}`,
      chatId,
      senderId,
      senderName,
      content,
      type: 'text',
      status,
      createdAt: createdAt.toISOString(),
    })
  }

  return messages
}

// Generate random chats
function generateRandomChats(): { chats: Chat[], messages: { [chatId: string]: Message[] } } {
  const chats: Chat[] = []
  const messagesByChat: { [chatId: string]: Message[] } = {}
  const now = new Date()
  const chatCount = Math.floor(Math.random() * 6) + 5 // 5-10 chats

  for (let i = 0; i < chatCount; i++) {
    const customerName = CLIENT_NAMES[Math.floor(Math.random() * CLIENT_NAMES.length)]
    const firstName = customerName.split(' ')[0]
    const daysAgo = Math.floor(Math.random() * 30)
    const hoursAgo = Math.floor(Math.random() * 24)

    const createdAt = new Date(now)
    createdAt.setDate(now.getDate() - daysAgo)
    createdAt.setHours(now.getHours() - hoursAgo)

    const lastMessageAt = new Date(createdAt)
    lastMessageAt.setHours(lastMessageAt.getHours() + Math.floor(Math.random() * 12))

    const isOpen = Math.random() > 0.2 // 80% open
    const unreadCount = isOpen ? Math.floor(Math.random() * 6) : 0

    const chat: Chat = {
      id: `chat-${i + 1}`,
      providerId: 'provider-1',
      customerId: `client-${i + 1}`,
      customerName,
      customerEmail: Math.random() > 0.2 ? `${firstName.toLowerCase().replace(' ', '.')}@email.com` : null,
      customerPhone: `+55 11 9${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`,
      status: isOpen ? 'open' : 'closed',
      lastMessageAt: lastMessageAt.toISOString(),
      unreadCount,
      createdAt: createdAt.toISOString(),
      updatedAt: lastMessageAt.toISOString(),
    }

    chats.push(chat)
    messagesByChat[chat.id] = generateMessages(chat.id, customerName)
  }

  return { chats, messages: messagesByChat }
}

// Get chats from localStorage or generate new ones
function getStoredChats(): Chat[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = localStorage.getItem(CHATS_STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('Error reading chats from localStorage:', error)
  }

  const { chats } = generateRandomChats()
  setStoredChats(chats)
  return chats
}

// Store chats in localStorage
function setStoredChats(chats: Chat[]): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(chats))
  } catch (error) {
    console.error('Error writing chats to localStorage:', error)
  }
}

// Get messages from localStorage or generate new ones
function getStoredMessages(): { [chatId: string]: Message[] } {
  if (typeof window === 'undefined') return {}

  try {
    const stored = localStorage.getItem(MESSAGES_STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('Error reading messages from localStorage:', error)
  }

  const { messages } = generateRandomChats()
  setStoredMessages(messages)
  return messages
}

// Store messages in localStorage
function setStoredMessages(messages: { [chatId: string]: Message[] }): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(messages))
  } catch (error) {
    console.error('Error writing messages to localStorage:', error)
  }
}

// Export
export let mockChats: Chat[] = getStoredChats()
export let mockMessages: { [chatId: string]: Message[] } = getStoredMessages()

// Query functions
export const getChatById = (id: string): Chat | undefined => {
  return mockChats.find(chat => chat.id === id)
}

export const getMessagesByChatId = (chatId: string): Message[] => {
  return mockMessages[chatId] || []
}

export const getOpenChats = (): Chat[] => {
  return mockChats.filter(chat => chat.status === 'open')
}

export const getChatsWithUnread = (): Chat[] => {
  return mockChats.filter(chat => chat.unreadCount > 0)
}

export const searchChats = (query: string): Chat[] => {
  const lowerQuery = query.toLowerCase()
  return mockChats.filter(chat =>
    chat.customerName.toLowerCase().includes(lowerQuery) ||
    chat.customerEmail?.toLowerCase().includes(lowerQuery) ||
    chat.customerPhone?.includes(query)
  )
}

// CRUD functions
export function createChat(customerName: string, customerEmail: string | null, customerPhone: string | null): Chat {
  const newChat: Chat = {
    id: `chat-${Date.now()}`,
    providerId: 'provider-1',
    customerId: `client-${Date.now()}`,
    customerName,
    customerEmail,
    customerPhone,
    status: 'open',
    lastMessageAt: new Date().toISOString(),
    unreadCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  mockChats.unshift(newChat)
  mockMessages[newChat.id] = []
  setStoredChats(mockChats)
  setStoredMessages(mockMessages)
  return newChat
}

export function sendMessage(chatId: string, content: string, senderId: string, senderName: string): Message {
  const newMessage: Message = {
    id: `msg-${Date.now()}`,
    chatId,
    senderId,
    senderName,
    content,
    type: 'text',
    status: 'sent',
    createdAt: new Date().toISOString(),
  }

  if (!mockMessages[chatId]) {
    mockMessages[chatId] = []
  }
  mockMessages[chatId].push(newMessage)

  // Update chat's lastMessageAt and updatedAt
  const chat = mockChats.find(c => c.id === chatId)
  if (chat) {
    chat.lastMessageAt = newMessage.createdAt
    chat.updatedAt = newMessage.createdAt
    // If message is from client, increment unread count
    if (senderId !== 'provider-1') {
      chat.unreadCount += 1
    }
  }

  setStoredMessages(mockMessages)
  setStoredChats(mockChats)
  return newMessage
}

export function markChatAsRead(chatId: string): Chat | null {
  const chat = mockChats.find(c => c.id === chatId)
  if (!chat) return null

  chat.unreadCount = 0
  setStoredChats(mockChats)
  return chat
}

export function closeChat(chatId: string): Chat | null {
  const chat = mockChats.find(c => c.id === chatId)
  if (!chat) return null

  chat.status = 'closed'
  chat.updatedAt = new Date().toISOString()
  setStoredChats(mockChats)
  return chat
}

export function reopenChat(chatId: string): Chat | null {
  const chat = mockChats.find(c => c.id === chatId)
  if (!chat) return null

  chat.status = 'open'
  chat.updatedAt = new Date().toISOString()
  setStoredChats(mockChats)
  return chat
}

export function deleteChat(chatId: string): boolean {
  const initialLength = mockChats.length
  mockChats = mockChats.filter(c => c.id !== chatId)
  delete mockMessages[chatId]

  if (mockChats.length !== initialLength) {
    setStoredChats(mockChats)
    setStoredMessages(mockMessages)
    return true
  }
  return false
}

export function resetChats(): void {
  localStorage.removeItem(CHATS_STORAGE_KEY)
  localStorage.removeItem(MESSAGES_STORAGE_KEY)
  const { chats, messages } = generateRandomChats()
  mockChats = chats
  mockMessages = messages
  setStoredChats(mockChats)
  setStoredMessages(mockMessages)
}
