/**
 * Router Configuration
 */

import { createBrowserRouter, Outlet } from 'react-router-dom'
import { Sidebar } from './components/sidebar'
import { AppProvider } from './contexts/app-context'
import { SidebarProvider } from './contexts/sidebar-context'

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
import { default as ChatPlaceholder } from './pages/chats/chat-placeholder'
import { default as ChatRoomPage } from './pages/chats/chat-room/page'
import { default as ClientsPage } from './pages/clients/page'
import { default as ClientDetailPage } from './pages/clients/client-detail/page'
import { default as ProfilePage } from './pages/profile/page'
import { default as SettingsPage } from './pages/settings/page'
import { default as WorkingHoursPage } from './pages/settings/hours'
import { default as LabelsPage } from './pages/settings/labels'
import { default as QuickRepliesPage } from './pages/settings/quick-replies'
import { default as OrganizationPage } from './pages/settings/organization/page'
import { default as IntegrationsPage } from './pages/settings/integrations/page'
import { default as AutomationPage } from './pages/settings/automation/page'

function DashboardLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
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
      {
        path: '/',
        element: <ChatsListPage />,
        children: [
          { index: true, element: <ChatPlaceholder /> },
          { path: 'c/:id', element: <ChatRoomPage /> },
        ],
      },
      { path: 'reports', element: <DashboardPage /> },
      { path: 'services', element: <ServicesListPage /> },
      { path: 'services/new', element: <ServiceFormPage /> },
      { path: 'services/:id', element: <ServiceDetailPage /> },
      { path: 'products', element: <ProductsListPage /> },
      { path: 'products/new', element: <ProductFormPage /> },
      { path: 'products/:id', element: <ProductDetailPage /> },
      { path: 'clients', element: <ClientsPage /> },
      { path: 'clients/:id', element: <ClientDetailPage /> },
      { path: 'agenda', element: <AgendaPage /> },

      { path: 'settings', element: <SettingsPage /> },
      { path: 'settings/profile', element: <ProfilePage /> },
      { path: 'settings/hours', element: <WorkingHoursPage /> },
      { path: 'settings/organization', element: <OrganizationPage /> },
      { path: 'settings/integrations', element: <IntegrationsPage /> },
      { path: 'settings/automation', element: <AutomationPage /> },
      { path: 'settings/labels', element: <LabelsPage /> },
      { path: 'settings/quick-replies', element: <QuickRepliesPage /> },
    ],
  },
])
