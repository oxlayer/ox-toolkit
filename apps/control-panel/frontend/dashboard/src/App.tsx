/**
 * App Component
 *
 * Main application component with routing
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { OrganizationsPage } from './pages/OrganizationsPage';
import { DevelopersPage } from './pages/DevelopersPage';
import { LicensesPage } from './pages/LicensesPage';
import { ApiKeysPage } from './pages/ApiKeysPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="organizations" element={<OrganizationsPage />} />
          <Route path="developers" element={<DevelopersPage />} />
          <Route path="licenses" element={<LicensesPage />} />
          <Route path="api-keys" element={<ApiKeysPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
