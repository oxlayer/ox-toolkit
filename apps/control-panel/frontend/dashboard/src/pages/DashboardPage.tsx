/**
 * Dashboard Page
 *
 * Shows overview statistics and recent activity
 */

import { useOrganizations } from '@/services/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

function StatCard({ title, value, change, icon }: {
  title: string;
  value: string | number;
  change?: string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
            <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
              {value}
            </p>
            {change && (
              <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                {change}
              </p>
            )}
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/20">
            <div className="text-primary-600 dark:text-primary-400">
              {icon}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const { data: organizations } = useOrganizations();

  const stats = {
    organizations: organizations?.data?.length || 0,
    licenses: organizations?.data?.reduce((acc, _org) => acc + 5, 0) || 0, // Mock
    developers: organizations?.data?.reduce((acc, _org) => acc + 12, 0) || 0, // Mock
    apiKeys: organizations?.data?.reduce((acc, _org) => acc + 8, 0) || 0, // Mock
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Welcome to the OxLayer Control Panel. Here's an overview of your SDK distribution.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Organizations"
          value={stats.organizations}
          change="+12% from last month"
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 5.472m0 0a9.09 9.09 0 00-3.741.479 3 3 0 004.682 2.72m.94-3.198l-.001-.03a9.094 9.094 0 00-.037-.666A11.959 11.959 0 0112 2.25c2.176 0 4.208.576 5.963 1.584A6.062 6.062 0 0118 5.281m0 0a5.971 5.971 0 00.941 3.197M7.5 10.5h.008v.008H7.5V10.5zm0 3h.008v.008H7.5V13.5zm9-3h.008v.008H16.5V10.5zm0 3h.008v.008H16.5V13.5z" />
            </svg>
          }
        />
        <StatCard
          title="Active Licenses"
          value={stats.licenses}
          change="+8% from last month"
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
            </svg>
          }
        />
        <StatCard
          title="Developers"
          value={stats.developers}
          change="+15% from last month"
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          }
        />
        <StatCard
          title="API Keys"
          value={stats.apiKeys}
          change="+5% from last month"
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          }
        />
      </div>

      {/* Recent organizations */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Organizations</CardTitle>
        </CardHeader>
        <CardContent>
          {organizations?.data && organizations.data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-slate-800">
                    <th className="pb-3 text-left font-medium text-gray-900 dark:text-white">Name</th>
                    <th className="pb-3 text-left font-medium text-gray-900 dark:text-white">Slug</th>
                    <th className="pb-3 text-left font-medium text-gray-900 dark:text-white">Tier</th>
                    <th className="pb-3 text-left font-medium text-gray-900 dark:text-white">Developers</th>
                    <th className="pb-3 text-left font-medium text-gray-900 dark:text-white">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {organizations.data.slice(0, 5).map((org) => (
                    <tr key={org.id} className="border-b border-gray-100 dark:border-slate-800/50">
                      <td className="py-3 font-medium text-gray-900 dark:text-white">
                        {org.name}
                      </td>
                      <td className="py-3 text-gray-600 dark:text-gray-400">
                        {org.slug}
                      </td>
                      <td className="py-3">
                        <Badge className={getLicenseTierColor(org.tier)}>
                          {org.tier}
                        </Badge>
                      </td>
                      <td className="py-3 text-gray-600 dark:text-gray-400">
                        {org.maxDevelopers}
                      </td>
                      <td className="py-3 text-gray-600 dark:text-gray-400">
                        {new Date(org.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
              No organizations yet. Create your first organization to get started.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick actions */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="cursor-pointer transition-shadow hover:shadow-md">
          <CardContent className="flex flex-col items-center justify-center p-6 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/20">
              <svg className="h-6 w-6 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
            <h3 className="font-medium text-gray-900 dark:text-white">New Organization</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Create a new organization
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer transition-shadow hover:shadow-md">
          <CardContent className="flex flex-col items-center justify-center p-6 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
              <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <h3 className="font-medium text-gray-900 dark:text-white">Add Developer</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Invite a new developer
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer transition-shadow hover:shadow-md">
          <CardContent className="flex flex-col items-center justify-center p-6 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/20">
              <svg className="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
              </svg>
            </div>
            <h3 className="font-medium text-gray-900 dark:text-white">Create License</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Issue a new license
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer transition-shadow hover:shadow-md">
          <CardContent className="flex flex-col items-center justify-center p-6 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
              <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <h3 className="font-medium text-gray-900 dark:text-white">Generate API Key</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Create a new API key
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function getLicenseTierColor(tier: string): string {
  switch (tier) {
    case 'enterprise':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
    case 'professional':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    case 'starter':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
  }
}
