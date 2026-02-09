/**
 * API Keys Page
 *
 * Manage API keys - view, create, revoke
 */

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useOrganizations,
  useLicenses,
  useDevelopers,
  useApiKeys,
  useCreateApiKey,
  useDeleteApiKey,
  useRevokeApiKey,
  type CreateApiKeyInput,
} from '@/services/api-client';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/utils/format';

const scopeOptions = [
  { value: 'read', label: 'Read' },
  { value: 'write', label: 'Write' },
  { value: 'admin', label: 'Admin' },
  { value: 'install', label: 'Install' },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    case 'revoked':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    case 'expired':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
  }
};

const getScopeColor = (scope: string) => {
  switch (scope) {
    case 'admin':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    case 'write':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
    case 'read':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    case 'install':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
  }
};

export function ApiKeysPage() {
  const queryClient = useQueryClient();
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [newApiKey, setNewApiKey] = useState<CreateApiKeyInput>({
    name: '',
    scopes: ['read'],
    expiresAt: null,
  });

  const { data: organizations } = useOrganizations();
  const { data: licenses } = useLicenses(selectedOrgId || undefined);
  const { data: developers } = useDevelopers(selectedOrgId || undefined);
  const { data: apiKeys, isLoading: apiKeysLoading } = useApiKeys(selectedOrgId || undefined);
  const createMutation = useCreateApiKey();
  const deleteMutation = useDeleteApiKey();
  const revokeMutation = useRevokeApiKey();

  const selectedOrg = organizations?.data?.find((org) => org.id === selectedOrgId);

  const handleCreate = () => {
    if (!selectedOrgId) return;
    createMutation.mutate(
      {
        organizationId: selectedOrgId,
        data: newApiKey,
      },
      {
        onSuccess: (response) => {
          queryClient.invalidateQueries({ queryKey: [{ url: '/v1/api-keys' }] });
          setIsCreateModalOpen(false);
          // Extract the full key from the response
          if (response && typeof response === 'object' && 'data' in response) {
            setCreatedKey((response as any).data?.key || null);
            if ((response as any).data?.key) {
              setShowKeyModal(true);
            }
          }
          setNewApiKey({ name: '', scopes: ['read'], expiresAt: null });
        },
      }
    );
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this API key?')) {
      deleteMutation.mutate(
        { id },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [{ url: '/v1/api-keys' }] });
          },
        }
      );
    }
  };

  const handleRevoke = (id: string) => {
    if (confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
      revokeMutation.mutate(
        { id },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [{ url: '/v1/api-keys' }] });
          },
        }
      );
    }
  };

  const toggleScope = (scope: string) => {
    const scopes = newApiKey.scopes || [];
    if (scopes.includes(scope as any)) {
      setNewApiKey({ ...newApiKey, scopes: scopes.filter((s) => s !== scope) });
    } else {
      setNewApiKey({ ...newApiKey, scopes: [...scopes, scope] as any });
    }
  };

  const copyKeyToClipboard = () => {
    if (createdKey) {
      navigator.clipboard.writeText(createdKey);
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
        <Button disabled={!selectedOrgId} onClick={() => setIsCreateModalOpen(true)}>
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
            value={selectedOrgId || ''}
            onChange={(e) => setSelectedOrgId(e.target.value || null)}
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
            {apiKeysLoading ? (
              <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
                Loading...
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
                        Key Preview
                      </th>
                      <th className="px-6 py-3 text-left font-medium text-gray-900 dark:text-white">
                        Scopes
                      </th>
                      <th className="px-6 py-3 text-left font-medium text-gray-900 dark:text-white">
                        License
                      </th>
                      <th className="px-6 py-3 text-left font-medium text-gray-900 dark:text-white">
                        Status
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
                    {apiKeys.data.map((apiKey) => (
                      <tr
                        key={apiKey.id}
                        className="border-b border-gray-100 dark:border-slate-800/50 transition-colors hover:bg-gray-50 dark:hover:bg-slate-900/50"
                      >
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {apiKey.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {apiKey.id}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <code className="rounded bg-gray-100 px-2 py-1 text-xs dark:bg-slate-800 dark:text-gray-300">
                            {apiKey.keyPreview}
                          </code>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {apiKey.scopes.map((scope: string) => (
                              <Badge key={scope} className={getScopeColor(scope)}>
                                {scope}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            {licenses?.data?.find((l) => l.id === apiKey.licenseId)?.name || 'Unknown'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge className={getStatusColor(apiKey.status)}>
                            {apiKey.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-gray-900 dark:text-white">
                            {apiKey.expiresAt ? formatDate(apiKey.expiresAt) : 'Never'}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            {apiKey.status === 'active' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 dark:text-yellow-400 dark:hover:bg-yellow-900/20"
                                onClick={() => handleRevoke(apiKey.id)}
                                disabled={revokeMutation.isPending}
                              >
                                Revoke
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                              onClick={() => handleDelete(apiKey.id)}
                              disabled={deleteMutation.isPending}
                            >
                              Delete
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
                  No API keys yet
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Create API keys for {selectedOrg?.name} to authenticate SDK requests.
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
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Organization
            </label>
            <div className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white">
              {organizations?.data?.find((org) => org.id === selectedOrgId)?.name || 'None selected'}
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Name
            </label>
            <input
              type="text"
              placeholder="Production API Key"
              value={newApiKey.name}
              onChange={(e) => setNewApiKey({ ...newApiKey, name: e.target.value })}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:placeholder-gray-400"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              License (Optional)
            </label>
            <select
              value={newApiKey.licenseId || ''}
              onChange={(e) => setNewApiKey({ ...newApiKey, licenseId: e.target.value || undefined })}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            >
              <option value="">All licenses</option>
              {licenses?.data?.map((license) => (
                <option key={license.id} value={license.id}>
                  {license.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Developer (Optional)
            </label>
            <select
              value={newApiKey.developerId || ''}
              onChange={(e) => setNewApiKey({ ...newApiKey, developerId: e.target.value || undefined })}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            >
              <option value="">All developers</option>
              {developers?.data?.map((developer) => (
                <option key={developer.id} value={developer.id}>
                  {developer.name} ({developer.email})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Scopes
            </label>
            <div className="space-y-2">
              {scopeOptions.map((scope) => (
                <label key={scope.value} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={(newApiKey.scopes || []).includes(scope.value as any)}
                    onChange={() => toggleScope(scope.value)}
                    className="rounded border-gray-300 text-primary-500 focus:ring-primary-500 dark:border-slate-800 dark:bg-slate-900"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{scope.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Expiration Date
            </label>
            <input
              type="datetime-local"
              value={newApiKey.expiresAt ? new Date(newApiKey.expiresAt).toISOString().slice(0, 16) : ''}
              onChange={(e) => setNewApiKey({ ...newApiKey, expiresAt: e.target.value || null })}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            />
          </div>
        </div>
      </Modal>

      {/* Key Created Modal */}
      <Modal
        isOpen={showKeyModal}
        onClose={() => {
          setShowKeyModal(false);
          setCreatedKey(null);
        }}
        title="API Key Created"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setShowKeyModal(false);
                setCreatedKey(null);
              }}
            >
              Done
            </Button>
            <Button onClick={copyKeyToClipboard}>
              Copy to Clipboard
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="rounded-lg bg-yellow-50 p-4 dark:bg-yellow-900/20">
            <div className="flex items-start gap-3">
              <svg className="mt-0.5 h-5 w-5 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <div>
                <h4 className="font-medium text-yellow-800 dark:text-yellow-200">Save this API key now</h4>
                <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                  You won't be able to see this key again. Make sure to copy it and store it securely.
                </p>
              </div>
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Your API Key
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={createdKey || ''}
                className="flex-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-mono text-gray-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
