import { Routes, Route, Link } from 'react-router';
import { LogOut, Shield, User as UserIcon, Loader2, Users } from 'lucide-react';
import TenantsPage from './pages/TenantsPage';
import UsersPage from './pages/UsersPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function AppContent() {
  const { isAuthenticated, isLoading, userInfo, logout, hasRole } = useAuth();

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login prompt
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">FatorH Admin</h1>
            <p className="text-gray-600 mt-2">Tenant Management Portal</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> You need a platform-admin account in the realm-platform realm to access this portal.
            </p>
          </div>
          <button
            onClick={() => (window.location.href = window.location.origin)}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Login with Keycloak
          </button>
        </div>
      </div>
    );
  }

  // Check if user has platform-admin role
  if (!hasRole('platform-admin')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg border border-red-200 shadow-sm p-8 max-w-md w-full">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
            <p className="text-gray-600 mt-2">
              You need the <code>platform-admin</code> role to access this portal.
            </p>
            <div className="mt-4 p-3 bg-gray-100 rounded text-sm text-left">
              <p className="font-medium">Your roles:</p>
              <p className="text-gray-700">{userInfo?.roles.join(', ') || 'None'}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full mt-6 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-8">
              <h1 className="text-2xl font-bold text-gray-900">FatorH Admin</h1>
              <nav className="hidden md:flex gap-6">
                <Link
                  to="/"
                  className="text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Tenants
                </Link>
                <Link
                  to="/users"
                  className="text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Users
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{userInfo?.name}</p>
                <p className="text-xs text-gray-500">{userInfo?.email}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <UserIcon className="w-5 h-5 text-blue-600" />
              </div>
              <button
                onClick={logout}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={<TenantsPage />} />
          <Route path="/users" element={<UsersPage />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
