/**
 * Developers Page
 *
 * Manage developers - view, create, edit, delete
 */

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useOrganizations,
  useDevelopers,
  useCreateDeveloper,
  useUpdateDeveloper,
  useDeleteDeveloper,
  type CreateDeveloperInput,
} from '@/services/api-client';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/utils/format';

const environmentOptions = [
  { value: 'development', label: 'Development' },
  { value: 'staging', label: 'Staging' },
  { value: 'production', label: 'Production' },
];

export function DevelopersPage() {
  const queryClient = useQueryClient();
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDeveloper, setSelectedDeveloper] = useState<any>(null);
  const [newDeveloper, setNewDeveloper] = useState<CreateDeveloperInput>({
    name: '',
    email: '',
    environments: ['development'],
  });

  const { data: organizations } = useOrganizations();
  const { data: developers, isLoading: devsLoading } = useDevelopers(selectedOrgId || undefined);
  const createMutation = useCreateDeveloper();
  const updateMutation = useUpdateDeveloper();
  const deleteMutation = useDeleteDeveloper();

  const selectedOrg = organizations?.data?.find((org) => org.id === selectedOrgId);

  const handleCreate = () => {
    if (!selectedOrgId) return;
    createMutation.mutate(
      {
        organizationId: selectedOrgId,
        data: newDeveloper,
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: [{ url: '/v1/developers' }] });
          setIsCreateModalOpen(false);
          setNewDeveloper({ name: '', email: '', environments: ['development'] });
        },
      }
    );
  };

  const handleUpdate = () => {
    if (!selectedDeveloper) return;
    updateMutation.mutate(
      {
        id: selectedDeveloper.id,
        data: {
          name: newDeveloper.name,
          email: newDeveloper.email,
          environments: newDeveloper.environments,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: [{ url: '/v1/developers' }] });
          setIsEditModalOpen(false);
          setSelectedDeveloper(null);
        },
      }
    );
  };

  const openEditModal = (developer: any) => {
    setSelectedDeveloper(developer);
    setNewDeveloper({
      name: developer.name,
      email: developer.email,
      environments: developer.environments,
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this developer?')) {
      deleteMutation.mutate(
        { id },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [{ url: '/v1/developers' }] });
          },
        }
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Developers
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage developers and their access to SDK packages
          </p>
        </div>
        <Button disabled={!selectedOrgId} onClick={() => setIsCreateModalOpen(true)}>
          <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Developer
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

      {/* Developers list */}
      {selectedOrg && (
        <Card>
          <CardContent className="p-0">
            {devsLoading ? (
              <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
                Loading...
              </div>
            ) : developers?.data && developers.data.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50">
                      <th className="px-6 py-3 text-left font-medium text-gray-900 dark:text-white">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left font-medium text-gray-900 dark:text-white">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left font-medium text-gray-900 dark:text-white">
                        Environments
                      </th>
                      <th className="px-6 py-3 text-left font-medium text-gray-900 dark:text-white">
                        Created
                      </th>
                      <th className="px-6 py-3 text-right font-medium text-gray-900 dark:text-white">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {developers.data.map((dev) => (
                      <tr
                        key={dev.id}
                        className="border-b border-gray-100 dark:border-slate-800/50 transition-colors hover:bg-gray-50 dark:hover:bg-slate-900/50"
                      >
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {dev.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {dev.id}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-gray-600 dark:text-gray-400">
                            {dev.email}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {dev.environments.map((env: string) => (
                              <Badge key={env} className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                {env}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-gray-900 dark:text-white">
                            {formatDate(dev.createdAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => openEditModal(dev)}>
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                              onClick={() => handleDelete(dev.id)}
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
                    d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                  No developers yet
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Add developers to {selectedOrg?.name} to get started.
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
        title="Create Developer"
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
              placeholder="John Doe"
              value={newDeveloper.name}
              onChange={(e) => setNewDeveloper({ ...newDeveloper, name: e.target.value })}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:placeholder-gray-400"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email
            </label>
            <input
              type="email"
              placeholder="john@example.com"
              value={newDeveloper.email}
              onChange={(e) => setNewDeveloper({ ...newDeveloper, email: e.target.value })}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:placeholder-gray-400"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Environments
            </label>
            <div className="space-y-2">
              {environmentOptions.map((env) => (
                <label key={env.value} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newDeveloper.environments?.includes(env.value as any)}
                    onChange={(e) => {
                      const envs = e.target.checked
                        ? [...(newDeveloper.environments || []), env.value as any]
                        : (newDeveloper.environments || []).filter((e) => e !== env.value);
                      setNewDeveloper({ ...newDeveloper, environments: envs });
                    }}
                    className="rounded border-gray-300 text-primary-500 focus:ring-primary-500 dark:border-slate-800 dark:bg-slate-900"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{env.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Developer"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Name
            </label>
            <input
              type="text"
              placeholder="John Doe"
              value={newDeveloper.name}
              onChange={(e) => setNewDeveloper({ ...newDeveloper, name: e.target.value })}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:placeholder-gray-400"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email
            </label>
            <input
              type="email"
              placeholder="john@example.com"
              value={newDeveloper.email}
              onChange={(e) => setNewDeveloper({ ...newDeveloper, email: e.target.value })}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:placeholder-gray-400"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Environments
            </label>
            <div className="space-y-2">
              {environmentOptions.map((env) => (
                <label key={env.value} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newDeveloper.environments?.includes(env.value as any)}
                    onChange={(e) => {
                      const envs = e.target.checked
                        ? [...(newDeveloper.environments || []), env.value as any]
                        : (newDeveloper.environments || []).filter((e) => e !== env.value);
                      setNewDeveloper({ ...newDeveloper, environments: envs });
                    }}
                    className="rounded border-gray-300 text-primary-500 focus:ring-primary-500 dark:border-slate-800 dark:bg-slate-900"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{env.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
