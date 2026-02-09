/**
 * Organizations Page
 *
 * Manage organizations - view, create, edit, delete
 */

import { useState } from 'react';
import {
  useOrganizations,
  useCreateOrganization,
  useDeleteOrganization,
  type CreateOrganizationInput,
} from '@oxlayer/api-client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { getLicenseTierColor, formatDate, formatRelativeTime } from '@/utils/format';

const tierOptions = [
  { value: 'starter', label: 'Starter' },
  { value: 'professional', label: 'Professional' },
  { value: 'enterprise', label: 'Enterprise' },
  { value: 'custom', label: 'Custom' },
];

export function OrganizationsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newOrg, setNewOrg] = useState<CreateOrganizationInput>({
    name: '',
    tier: 'starter',
    maxDevelopers: 5,
    maxProjects: 3,
  });

  const { data: organizations, isLoading } = useOrganizations();
  const createMutation = useCreateOrganization();
  const deleteMutation = useDeleteOrganization();

  const handleCreate = () => {
    createMutation.mutate(newOrg, {
      onSuccess: () => {
        setIsCreateModalOpen(false);
        setNewOrg({ name: '', tier: 'starter', maxDevelopers: 5, maxProjects: 3 });
      },
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this organization?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Organizations
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage organizations and their access to SDK packages
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Organization
        </Button>
      </div>

      {/* Organizations list */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
              Loading...
            </div>
          ) : organizations?.data && organizations.data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50">
                    <th className="px-6 py-3 text-left font-medium text-gray-900 dark:text-white">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left font-medium text-gray-900 dark:text-white">
                      Slug
                    </th>
                    <th className="px-6 py-3 text-left font-medium text-gray-900 dark:text-white">
                      Tier
                    </th>
                    <th className="px-6 py-3 text-left font-medium text-gray-900 dark:text-white">
                      Limits
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
                  {organizations.data.map((org) => (
                    <tr
                      key={org.id}
                      className="border-b border-gray-100 dark:border-slate-800/50 transition-colors hover:bg-gray-50 dark:hover:bg-slate-900/50"
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {org.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {org.id}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <code className="rounded bg-gray-100 px-2 py-1 text-xs dark:bg-slate-800 dark:text-gray-300">
                          {org.slug}
                        </code>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={getLicenseTierColor(org.tier)}>
                          {org.tier}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-600 dark:text-gray-400">
                          {org.maxDevelopers} developers
                        </div>
                        <div className="text-gray-600 dark:text-gray-400">
                          {org.maxProjects === -1 ? 'Unlimited' : `${org.maxProjects} projects`}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-900 dark:text-white">
                          {formatDate(org.createdAt)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {formatRelativeTime(org.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {/* TODO: Edit */}}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                            onClick={() => handleDelete(org.id)}
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
                  d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 5.472m0 0a9.09 9.09 0 00-3.741.479 3 3 0 004.682 2.72m.94-3.198l-.001-.03a9.094 9.094 0 00-.037-.666A11.959 11.959 0 0112 2.25c2.176 0 4.208.576 5.963 1.584A6.062 6.062 0 0118 5.281m0 0a5.971 5.971 0 00.941 3.197M7.5 10.5h.008v.008H7.5V10.5zm0 3h.008v.008H7.5V13.5zm9-3h.008v.008H16.5V10.5zm0 3h.008v.008H16.5V13.5z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                No organizations
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Get started by creating a new organization.
              </p>
              <div className="mt-6">
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  Create Organization
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Organization"
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
            label="Organization Name"
            placeholder="Acme Corp"
            value={newOrg.name}
            onChange={(e) => setNewOrg({ ...newOrg, name: e.target.value })}
          />
          <Select
            label="Tier"
            options={tierOptions}
            value={newOrg.tier}
            onChange={(e) => setNewOrg({ ...newOrg, tier: e.target.value as any })}
          />
          <Input
            label="Max Developers"
            type="number"
            value={newOrg.maxDevelopers}
            onChange={(e) => setNewOrg({ ...newOrg, maxDevelopers: parseInt(e.target.value) })}
          />
          <Input
            label="Max Projects"
            type="number"
            value={newOrg.maxProjects}
            onChange={(e) => setNewOrg({ ...newOrg, maxProjects: parseInt(e.target.value) })}
          />
        </div>
      </Modal>
    </div>
  );
}
