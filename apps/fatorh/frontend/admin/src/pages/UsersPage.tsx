import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { User, Shield, Mail, CheckCircle, XCircle, Loader2, Search } from 'lucide-react';
import { listUsers, type User as UserType } from '../lib/api';

export default function UsersPage() {
  const [realmFilter, setRealmFilter] = useState('');
  const [debouncedRealm, setDebouncedRealm] = useState('');

  // Debounce the realm filter (500ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedRealm(realmFilter);
    }, 500);
    return () => clearTimeout(timer);
  }, [realmFilter]);

  // List users query - uses debounced value
  const { data: usersData, isLoading, error } = useQuery({
    queryKey: ['users', debouncedRealm],
    queryFn: () => listUsers(debouncedRealm),
    enabled: debouncedRealm.length > 0,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Trigger immediate search by updating debounced value
    setDebouncedRealm(realmFilter);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'supervisor':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'manager':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'candidate':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-800">
          <XCircle className="w-5 h-5" />
          <p className="font-medium">Error loading users</p>
        </div>
        <p className="text-red-700 mt-1">{(error as Error).message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">User Management</h2>
        <p className="text-gray-600 mt-1">
          View and manage users across all tenant realms
        </p>
      </div>

      {/* Search Form */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <form onSubmit={handleSearch} className="flex gap-3 items-center">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Realm ID
            </label>
            <input
              type="text"
              placeholder="e.g., company-name (without globex_ prefix)"
              value={realmFilter}
              onChange={(e) => setRealmFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Enter the realm ID to list users (e.g., "company-name" for realm "globex_company-name")</p>
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={!realmFilter.trim() || isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Search
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Users List */}
      {usersData && usersData.users && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-xl font-semibold text-gray-900">
              Users in realm "{usersData.realm}"
            </h3>
            <span className="text-sm text-gray-500">
              {usersData.users.length} user{usersData.users.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="overflow-x-auto">
            {usersData.users.length > 0 ? (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Roles
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {usersData.users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                            {user.firstName?.[0] || user.username?.[0] || '?'}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-gray-500">@{user.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-700">
                          <Mail className="w-4 h-4 text-gray-400" />
                          {user.email}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {user.roles.length > 0 ? (
                            user.roles.map((role) => (
                              <span
                                key={role}
                                className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border ${getRoleBadgeColor(role)}`}
                              >
                                <Shield className="w-3 h-3" />
                                {role}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-400 text-sm">No roles</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${user.enabled
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                            }`}>
                            {user.enabled ? (
                              <>
                                <CheckCircle className="w-3 h-3" />
                                Enabled
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3" />
                                Disabled
                              </>
                            )}
                          </span>
                          {!user.emailVerified && (
                            <span className="text-xs text-yellow-600">
                              Email not verified
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-gray-500">
                {usersData.realmExists === false ? (
                  <>
                    <XCircle className="w-12 h-12 mx-auto mb-3 text-orange-400" />
                    <p className="font-medium text-orange-700">Realm not found</p>
                    <p className="text-sm mt-1">The realm "{usersData.realm}" does not exist in Keycloak</p>
                  </>
                ) : (
                  <>
                    <User className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>No users found in this realm</p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Initial State */}
      {!usersData && !isLoading && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center">
          <User className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Search for Users</h3>
          <p className="text-gray-500 mb-6">
            Enter a realm ID above to view users in that realm
          </p>
        </div>
      )}
    </div>
  );
}
