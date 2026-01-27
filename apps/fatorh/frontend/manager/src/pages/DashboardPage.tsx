import { useQuery } from '@tanstack/react-query';

interface Organization {
  id: string;
  name: string;
  realmId: string;
  databaseName: string;
  domainAliases: string[];
}

function DashboardPage() {
  const { data: orgData, isLoading } = useQuery({
    queryKey: ['organization'],
    queryFn: async () => {
      const response = await fetch('/api/organization');
      if (!response.ok) throw new Error('Failed to fetch organization');
      return response.json() as Promise<Organization>;
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Organization Dashboard</h2>
        <p className="text-gray-600 mt-1">
          Manage your organization, users, and settings
        </p>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
          <div className="text-gray-500">Loading...</div>
        </div>
      ) : orgData ? (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900">{orgData.name}</h3>
          </div>
          <div className="p-6">
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Organization ID</dt>
                <dd className="mt-1 text-sm text-gray-900 font-mono">{orgData.id.slice(0, 8)}...</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Realm ID</dt>
                <dd className="mt-1 text-sm text-gray-900 font-mono">{orgData.realmId}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Database</dt>
                <dd className="mt-1 text-sm text-gray-900 font-mono">{orgData.databaseName}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Domain Aliases</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {orgData.domainAliases.length > 0 ? (
                    <ul className="list-disc list-inside">
                      {orgData.domainAliases.map((alias) => (
                        <li key={alias}>{alias}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-gray-400">None configured</span>
                  )}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
          <div className="text-gray-500">No organization found</div>
        </div>
      )}
    </div>
  );
}

export default DashboardPage;
