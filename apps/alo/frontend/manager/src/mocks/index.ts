/**
 * Mock Data Index
 *
 * Central export point for all mock data used in the application.
 */

// Services
export {
  mockServices,
  getServiceById,
  getServicesByProviderId,
  getActiveServices,
} from './services'

// Clients
export {
  mockClients,
  getClientById,
  searchClients,
  getTopClients,
  type Client,
} from './clients'

// Agenda/Appointments
export {
  mockAppointments,
  getAppointmentById,
  getAppointmentsByDate,
  getAppointmentsByStatus,
  getUpcomingAppointments,
  getAppointmentsByClient,
} from './agenda'

// Chats
export {
  mockChats,
  mockMessages,
  getChatById,
  getMessagesByChatId,
  getOpenChats,
  getChatsWithUnread,
  searchChats,
} from './chats'

// Prices
export {
  priceTiers,
  pricingRules,
  servicePrices,
  getServicePrice,
  getServicesByPriceRange,
  getServicesByPriceType,
  calculateEstimatedPrice,
  type PriceTier,
  type PricingRule,
  type ServicePrice,
} from './prices'

// Notifications
export {
  mockNotifications,
  getUnreadCount,
  getNotificationsByType,
  getRecentNotifications,
  markAsRead,
  markAllAsRead,
  type Notification,
  type NotificationType,
  type NotificationStatus,
} from './notifications'
