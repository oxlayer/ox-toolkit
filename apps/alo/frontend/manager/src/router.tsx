/**
 * Router Configuration
 */

import { createBrowserRouter, Outlet } from 'react-router-dom'
import { Sidebar } from './components/sidebar'
import { AppProvider } from './contexts/app-context'

// Pages
import { default as DashboardPage } from './pages/dashboard/page'
import { default as ServicesListPage } from './pages/services/services-list/page'
import { default as ServiceFormPage } from './pages/services/service-form/page'
import { default as ServiceDetailPage } from './pages/services/service-detail/page'
import { default as ProductsListPage } from './pages/products/products-list/page'
import { default as ProductFormPage } from './pages/products/product-form/page'
import { default as ProductDetailPage } from './pages/products/product-detail/page'
import { default as AgendaPage } from './pages/agenda/page'
import { default as ChatsListPage } from './pages/chats/chats-list/page'
import { default as ChatRoomPage } from './pages/chats/chat-room/page'
import { default as ProfilePage } from './pages/profile/page'
import { default as SettingsPage } from './pages/settings/page'

function DashboardLayout() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        {/* <Header /> */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <AppProvider>
        <DashboardLayout />
      </AppProvider>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'services', element: <ServicesListPage /> },
      { path: 'services/new', element: <ServiceFormPage /> },
      { path: 'services/:id', element: <ServiceDetailPage /> },
      { path: 'products', element: <ProductsListPage /> },
      { path: 'products/new', element: <ProductFormPage /> },
      { path: 'products/:id', element: <ProductDetailPage /> },
      { path: 'agenda', element: <AgendaPage /> },
      { path: 'chats', element: <ChatsListPage /> },
      { path: 'chats/:id', element: <ChatRoomPage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
])
