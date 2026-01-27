import { useState } from 'react';
import { useKeycloak } from '../lib/keycloak';

function LoginPage() {
  const { keycloak } = useKeycloak();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = () => {
    setIsLoading(true);
    keycloak.login();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">FatorH Manager</h1>
            <p className="text-gray-600 mt-2">
              Sign in to manage your organization
            </p>
          </div>

          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full flex justify-center items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14" />
                </svg>
                Sign in with Keycloak
              </>
            )}
          </button>

          <p className="mt-6 text-center text-sm text-gray-500">
            You'll be redirected to Keycloak for authentication
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
