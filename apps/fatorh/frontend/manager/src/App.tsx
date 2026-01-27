import { Routes, Route, Navigate } from 'react-router';
import { useKeycloak } from './lib/keycloak';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';

function App() {
  const { keycloak, initialized } = useKeycloak();

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!keycloak.authenticated) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">FatorH Manager</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {keycloak.tokenParsed?.preferred_username || keycloak.tokenParsed?.email}
            </span>
            <button
              onClick={() => keycloak.logout()}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
