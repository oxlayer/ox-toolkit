import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import {
  ManagerLayout
} from '@/components/manager'
import {
  DashboardView,
  EstablishmentsView,
  EstablishmentFormView,
  EstablishmentTypesView,
  UsersView,
  UserFormView,
  DeliveryMenView,
  DeliveryManFormView,
  ServiceProvidersView,
  ServiceProviderFormView,
  ServiceCategoriesView,
  ServiceCatalogView,
  ServiceProviderOrdersView,
  OrdersDashboardView,
  OnboardingCompleteView,
} from '@/views'

// Import existing pages that haven't been refactored yet
import Providers from './pages/Providers'

import { AuthProvider } from './contexts/AuthContext'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public route for onboarding completion (outside ManagerLayout) */}
            <Route path="/onboarding/complete" element={<OnboardingCompleteView />} />

            <Route path="/" element={<ManagerLayout />}>
              <Route index element={<DashboardView />} />
              <Route path="orders" element={<OrdersDashboardView />} />
              <Route path="providers" element={<Providers />} />
              <Route path="establishments">
                <Route index element={<EstablishmentsView />} />
                <Route path="new" element={<EstablishmentFormView />} />
                <Route path=":id" element={<EstablishmentFormView />} />
                <Route path="types" element={<EstablishmentTypesView />} />
              </Route>
              <Route path="users">
                <Route index element={<UsersView />} />
                <Route path="new" element={<UserFormView />} />
                <Route path=":id" element={<UserFormView />} />
              </Route>
              <Route path="delivery-men">
                <Route index element={<DeliveryMenView />} />
                <Route path="new" element={<DeliveryManFormView />} />
                <Route path=":id" element={<DeliveryManFormView />} />
              </Route>
              <Route path="service-providers">
                <Route index element={<ServiceProvidersView />} />
                <Route path="new" element={<ServiceProviderFormView />} />
                <Route path=":id" element={<ServiceProviderFormView />} />
                <Route path="categories" element={<ServiceCategoriesView />} />
                <Route path=":id/catalog" element={<ServiceCatalogView />} />
                <Route path=":id/orders" element={<ServiceProviderOrdersView />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
