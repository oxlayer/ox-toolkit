import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Establishments from './pages/Establishments';
import EstablishmentForm from './pages/EstablishmentForm';
import EstablishmentTypes from './pages/EstablishmentTypes';
import Users from './pages/Users';
import UserForm from './pages/UserForm';
import DeliveryMen from './pages/DeliveryMen';
import DeliveryManForm from './pages/DeliveryManForm';
import ServiceProviders from './pages/ServiceProviders';
import ServiceProviderForm from './pages/ServiceProviderForm';
import ServiceCategories from './pages/ServiceCategories';
import ServiceCatalog from './pages/ServiceCatalog';
import ServiceProviderOrders from './pages/ServiceProviderOrders';
import OrdersDashboard from './pages/OrdersDashboard';
import Providers from './pages/Providers';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="orders" element={<OrdersDashboard />} />
            <Route path="providers" element={<Providers />} />
            <Route path="establishments">
              <Route index element={<Establishments />} />
              <Route path="new" element={<EstablishmentForm />} />
              <Route path=":id" element={<EstablishmentForm />} />
              <Route path="types" element={<EstablishmentTypes />} />
            </Route>
            <Route path="users">
              <Route index element={<Users />} />
              <Route path="new" element={<UserForm />} />
              <Route path=":id" element={<UserForm />} />
            </Route>
            <Route path="delivery-men">
              <Route index element={<DeliveryMen />} />
              <Route path="new" element={<DeliveryManForm />} />
              <Route path=":id" element={<DeliveryManForm />} />
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
  );
}

export default App;
