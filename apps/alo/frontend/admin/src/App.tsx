import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import {
  ManagerLayout
} from '@/components/manager'
import {
  DashboardView,
  EstablishmentsView,
  EstablishmentFormView,
  UsersView,
  UserFormView,
  DeliveryMenView,
  DeliveryManFormView,
} from '@/views'

// Import existing pages that haven't been refactored yet
import EstablishmentTypes from './pages/EstablishmentTypes'
import ServiceProviders from './pages/ServiceProviders'
import ServiceProviderForm from './pages/ServiceProviderForm'
import ServiceCategories from './pages/ServiceCategories'
import ServiceCatalog from './pages/ServiceCatalog'
import ServiceProviderOrders from './pages/ServiceProviderOrders'
import OrdersDashboard from './pages/OrdersDashboard'
import Providers from './pages/Providers'

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
        <Routes>
          <Route path="/" element={<ManagerLayout />}>
            <Route index element={<DashboardView />} />
            <Route path="orders" element={<OrdersDashboard />} />
            <Route path="providers" element={<Providers />} />
            <Route path="establishments">
              <Route index element={<EstablishmentsView />} />
              <Route path="new" element={<EstablishmentFormView />} />
              <Route path=":id" element={<EstablishmentFormView />} />
              <Route path="types" element={<EstablishmentTypes />} />
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
              <Route index element={<ServiceProviders />} />
              <Route path="new" element={<ServiceProviderForm />} />
              <Route path=":id" element={<ServiceProviderForm />} />
              <Route path="categories" element={<ServiceCategories />} />
              <Route path=":id/catalog" element={<ServiceCatalog />} />
              <Route path=":id/orders" element={<ServiceProviderOrders />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
