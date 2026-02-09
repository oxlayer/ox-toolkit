/**
 * Licenses Page
 *
 * Manage licenses - view, create, edit capabilities
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { controlPanelApi } from '@/services/api';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { getLicenseStatusColor, getLicenseTierColor, formatDate, formatRelativeTime } from '@/utils/format';

export function LicensesPage() {
  const queryClient = useQueryClient();
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);

  const { data: organizations, isLoading: isLoadingOrgs } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => controlPanelApi.organizations.list(),
  });

  const { data: licenses, isLoading: isLoadingLicenses } = useQuery({
    queryKey: ['licenses', selectedOrg],
    queryFn: () =>
      selectedOrg
        ? controlPanelApi.licenses.listByOrganization(selectedOrg)
        : Promise.resolve({ data: [] }),
    enabled: !!selectedOrg,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Licenses
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage licenses and configure capability limits
          </p>
        </div>
        <Button>
          <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New License
        </Button>
      </div>

      {/* Organization selector */}
      <Card>
        <CardContent className="p-4">
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Select Organization
          </label>
          <select
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            value={selectedOrg || ''}
            onChange={(e) => setSelectedOrg(e.target.value || null)}
          >
            <option value="">Select an organization...</option>
            {organizations?.data?.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name} ({org.slug})
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {/* Licenses list */}
      {selectedOrg && (
        <Card>
          <CardContent className="p-0">
            {isLoadingLicenses ? (
              <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
                Loading licenses...
              </div>
            ) : licenses?.data && licenses.data.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50">
                      <th className="px-6 py-3 text-left font-medium text-gray-900 dark:text-white">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left font-medium text-gray-900 dark:text-white">
                        Tier
                      </th>
                      <th className="px-6 py-3 text-left font-medium text-gray-900 dark:text-white">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left font-medium text-gray-900 dark:text-white">
                        Packages
                      </th>
                      <th className="px-6 py-3 text-left font-medium text-gray-900 dark:text-white">
                        Capabilities
                      </th>
                      <th className="px-6 py-3 text-left font-medium text-gray-900 dark:text-white">
                        Expires
                      </th>
                      <th className="px-6 py-3 text-right font-medium text-gray-900 dark:text-white">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {licenses.data.map((license) => (
                      <tr
                        key={license.id}
                        className="border-b border-gray-100 dark:border-slate-800/50 transition-colors hover:bg-gray-50 dark:hover:bg-slate-900/50"
                      >
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {license.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {license.id}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge className={getLicenseTierColor(license.tier)}>
                            {license.tier}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <Badge className={getLicenseStatusColor(license.status)}>
                            {license.status}
                          </Badge>
                          {!license.isValid && (
                            <div className="mt-1 text-xs text-red-600 dark:text-red-400">
                              Invalid
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {license.packages.map((pkg) => (
                              <span
                                key={pkg}
                                className="rounded-full bg-gray-100 px-2 py-0.5 text-xs dark:bg-slate-800 dark:text-gray-300"
                              >
                                {pkg}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-gray-600 dark:text-gray-400">
                            {Object.keys(license.capabilities).length} capabilities
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {license.expiresAt ? (
                            <div>
                              <div className="text-gray-900 dark:text-white">
                                {formatDate(license.expiresAt)}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {formatRelativeTime(license.expiresAt)}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-500 dark:text-gray-400">Never</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm">
                              Manage
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                  No licenses
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Create a license to enable SDK access for this organization.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
