/**
 * API Keys Page
 *
 * Manage API keys - view, create, revoke
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { controlPanelApi, type CreateApiKeyInput } from '@/services/api';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { getApiKeyStatusColor, formatDate, formatRelativeTime } from '@/utils/format';

export function ApiKeysPage() {
  const queryClient = useQueryClient();
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newKey, setNewKey] = useState<CreateApiKeyInput>({
    organizationId: '',
    licenseId: '',
    developerId: null,
    name: '',
    scopes: ['read'],
    environments: ['development'],
  });

  const { data: organizations } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => controlPanelApi.organizations.list(),
  });

  const { data: apiKeys, isLoading } = useQuery({
    queryKey: ['api-keys', selectedOrg],
    queryFn: () =>
      selectedOrg
        ? controlPanelApi.apiKeys.listByOrganization(selectedOrg)
        : Promise.resolve({ data: [] }),
    enabled: !!selectedOrg,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateApiKeyInput) =>
      controlPanelApi.apiKeys.create(data.organizationId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys', selectedOrg] });
      setIsCreateModalOpen(false);
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => controlPanelApi.apiKeys.revoke(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys', selectedOrg] });
    },
  });

  const handleCreate = () => {
    if (selectedOrg) {
      createMutation.mutate({
        ...newKey,
        organizationId: selectedOrg,
      });
    }
  };

  const handleRevoke = (id: string) => {
    if (confirm('Are you sure you want to revoke this API key?')) {
      revokeMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            API Keys
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage API keys for SDK authentication
          </p>
        </div>
        <Button onClick={() => selectedOrg && setIsCreateModalOpen(true)} disabled={!selectedOrg}>
          <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New API Key
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

      {/* API Keys list */}
      {selectedOrg && (
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
                Loading API keys...
              </div>
            ) : apiKeys?.data && apiKeys.data.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50">
                      <th className="px-6 py-3 text-left font-medium text-gray-900 dark:text-white">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left font-medium text-gray-900 dark:text-white">
                        Key Prefix
                      </th>
                      <th className="px-6 py-3 text-left font-medium text-gray-900 dark:text-white">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left font-medium text-gray-900 dark:text-white">
                        Scopes
                      </th>
                      <th className="px-6 py-3 text-left font-medium text-gray-900 dark:text-white">
                        Environments
                      </th>
                      <th className="px-6 py-3 text-left font-medium text-gray-900 dark:text-white">
                        Last Used
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
                    {apiKeys.data.map((key) => (
                      <tr
                        key={key.id}
                        className="border-b border-gray-100 dark:border-slate-800/50 transition-colors hover:bg-gray-50 dark:hover:bg-slate-900/50"
                      >
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {key.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {key.id}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <code className="rounded bg-gray-100 px-2 py-1 text-xs dark:bg-slate-800 dark:text-gray-300">
                            {key.keyPrefix}***
                          </code>
                        </td>
                        <td className="px-6 py-4">
                          <Badge className={getApiKeyStatusColor(key.status)}>
                            {key.status}
                          </Badge>
                          {!key.isValid && (
                            <div className="mt-1 text-xs text-red-600 dark:text-red-400">
                              Invalid
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {key.scopes.map((scope) => (
                              <span
                                key={scope}
                                className="rounded-full bg-gray-100 px-2 py-0.5 text-xs dark:bg-slate-800 dark:text-gray-300"
                              >
                                {scope}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {key.environments.map((env) => (
                              <span
                                key={env}
                                className="rounded-full bg-gray-100 px-2 py-0.5 text-xs dark:bg-slate-800 dark:text-gray-300"
                              >
                                {env}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {key.lastUsedAt ? (
                            <div>
                              <div className="text-gray-900 dark:text-white">
                                {formatDate(key.lastUsedAt)}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {formatRelativeTime(key.lastUsedAt)}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-500 dark:text-gray-400">Never</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {key.expiresAt ? (
                            <div>
                              <div className="text-gray-900 dark:text-white">
                                {formatDate(key.expiresAt)}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {formatRelativeTime(key.expiresAt)}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-500 dark:text-gray-400">Never</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                              onClick={() => handleRevoke(key.id)}
                              disabled={key.status === 'revoked'}
                            >
                              {key.status === 'revoked' ? 'Revoked' : 'Revoke'}
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
                    d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                  No API keys
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Create an API key to enable SDK access for this organization.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create API Key"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="API Key Name"
            placeholder="Production SDK Key"
            value={newKey.name}
            onChange={(e) => setNewKey({ ...newKey, name: e.target.value })}
          />
          <Input
            label="License ID"
            placeholder="lic_xxx"
            value={newKey.licenseId}
            onChange={(e) => setNewKey({ ...newKey, licenseId: e.target.value })}
          />
          <div className="text-sm text-gray-500 dark:text-gray-400">
            After creating, the raw API key will be shown once. Save it securely as it won't be displayed again.
          </div>
        </div>
      </Modal>
    </div>
  );
}
