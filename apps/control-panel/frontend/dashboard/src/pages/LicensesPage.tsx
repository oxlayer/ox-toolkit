/**
 * Licenses Page
 *
 * Manage licenses - view, create, edit, delete, activate, suspend, revoke
 */

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useOrganizations,
  useLicenses,
  useCreateLicense,
  useUpdateLicense,
  useDeleteLicense,
  useActivateLicense,
  useSuspendLicense,
  useRevokeLicense,
  type CreateLicenseInput,
  type UpdateLicenseInput,
} from '@/services/api-client';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/utils/format';

type LicenseFormData = CreateLicenseInput & Partial<UpdateLicenseInput>;

const tierOptions = [
  { value: 'starter', label: 'Starter' },
  { value: 'professional', label: 'Professional' },
  { value: 'enterprise', label: 'Enterprise' },
  { value: 'custom', label: 'Custom' },
];

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'expired', label: 'Expired' },
  { value: 'revoked', label: 'Revoked' },
];

const packageOptions = [
  { value: 'backend-sdk', label: 'Backend SDK' },
  { value: 'frontend-sdk', label: 'Frontend SDK' },
  { value: 'cli-tools', label: 'CLI Tools' },
  { value: 'channels', label: 'Channels' },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    case 'suspended':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
    case 'expired':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    case 'revoked':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
  }
};

const getTierColor = (tier: string) => {
  switch (tier) {
    case 'starter':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    case 'professional':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
    case 'enterprise':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
    case 'custom':
      return 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
  }
};

export function LicensesPage() {
  const queryClient = useQueryClient();
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<any>(null);
  const [newLicense, setNewLicense] = useState<LicenseFormData>({
    name: '',
    tier: 'starter',
    packages: [],
    capabilities: {},
    expiresAt: null,
  });

  const { data: organizations } = useOrganizations();
  const { data: licenses, isLoading: licensesLoading } = useLicenses(selectedOrgId || undefined);
  const createMutation = useCreateLicense();
  const updateMutation = useUpdateLicense();
  const deleteMutation = useDeleteLicense();
  const activateMutation = useActivateLicense();
  const suspendMutation = useSuspendLicense();
  const revokeMutation = useRevokeLicense();

  const selectedOrg = organizations?.data?.find((org) => org.id === selectedOrgId);

  const handleCreate = () => {
    if (!selectedOrgId) return;
    createMutation.mutate(
      {
        organizationId: selectedOrgId,
        data: newLicense,
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: [{ url: '/v1/licenses' }] });
          setIsCreateModalOpen(false);
          setNewLicense({ name: '', tier: 'starter', packages: [], capabilities: {}, expiresAt: null });
        },
      }
    );
  };

  const handleUpdate = () => {
    if (!selectedLicense) return;
    updateMutation.mutate(
      {
        id: selectedLicense.id,
        data: {
          name: newLicense.name,
          tier: newLicense.tier,
          status: newLicense.status,
          expiresAt: newLicense.expiresAt,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: [{ url: '/v1/licenses' }] });
          setIsEditModalOpen(false);
          setSelectedLicense(null);
        },
      }
    );
  };

  const openEditModal = (license: any) => {
    setSelectedLicense(license);
    setNewLicense({
      name: license.name,
      tier: license.tier,
      status: license.status,
      packages: license.packages,
      capabilities: license.capabilities,
      expiresAt: license.expiresAt,
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this license?')) {
      deleteMutation.mutate(
        { id },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [{ url: '/v1/licenses' }] });
          },
        }
      );
    }
  };

  const handleActivate = (id: string) => {
    activateMutation.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: [{ url: '/v1/licenses' }] });
        },
      }
    );
  };

  const handleSuspend = (id: string) => {
    suspendMutation.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: [{ url: '/v1/licenses' }] });
        },
      }
    );
  };

  const handleRevoke = (id: string) => {
    if (confirm('Are you sure you want to revoke this license? This action cannot be undone.')) {
      revokeMutation.mutate(
        { id },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [{ url: '/v1/licenses' }] });
          },
        }
      );
    }
  };

  const togglePackage = (pkg: string) => {
    const packages = newLicense.packages || [];
    if (packages.includes(pkg as any)) {
      setNewLicense({ ...newLicense, packages: packages.filter((p) => p !== pkg) });
    } else {
      setNewLicense({ ...newLicense, packages: [...packages, pkg] as any });
    }
  };

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
        <Button disabled={!selectedOrgId} onClick={() => setIsCreateModalOpen(true)}>
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

      {/* Licenses list */}
      {selectedOrg && (
        <Card>
          <CardContent className="p-0">
            {licensesLoading ? (
              <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
                Loading...
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
                          <Badge className={getTierColor(license.tier)}>
                            {license.tier}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <Badge className={getStatusColor(license.status)}>
                            {license.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {license.packages.map((pkg: string) => (
                              <Badge key={pkg} className="bg-gray-100 text-gray-800 dark:bg-slate-800 dark:text-gray-300">
                                {pkg}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-gray-900 dark:text-white">
                            {license.expiresAt ? formatDate(license.expiresAt) : 'Never'}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => openEditModal(license)}>
                              Edit
                            </Button>
                            {license.status === 'active' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 dark:text-yellow-400 dark:hover:bg-yellow-900/20"
                                  onClick={() => handleSuspend(license.id)}
                                  disabled={suspendMutation.isPending}
                                >
                                  Suspend
                                </Button>
                              </>
                            )}
                            {license.status === 'suspended' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20"
                                onClick={() => handleActivate(license.id)}
                                disabled={activateMutation.isPending}
                              >
                                Activate
                              </Button>
                            )}
                            {(license.status === 'active' || license.status === 'suspended') && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                                onClick={() => handleRevoke(license.id)}
                                disabled={revokeMutation.isPending}
                              >
                                Revoke
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                              onClick={() => handleDelete(license.id)}
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
                    d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                  No licenses yet
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Create licenses for {selectedOrg?.name} to get started.
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
        title="Create License"
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
              placeholder="Production License"
              value={newLicense.name}
              onChange={(e) => setNewLicense({ ...newLicense, name: e.target.value })}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:placeholder-gray-400"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tier
            </label>
            <select
              value={newLicense.tier}
              onChange={(e) => setNewLicense({ ...newLicense, tier: e.target.value as any })}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            >
              {tierOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Expiration Date
            </label>
            <input
              type="datetime-local"
              value={newLicense.expiresAt ? new Date(newLicense.expiresAt).toISOString().slice(0, 16) : ''}
              onChange={(e) => setNewLicense({ ...newLicense, expiresAt: e.target.value || null })}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Packages
            </label>
            <div className="space-y-2">
              {packageOptions.map((pkg) => (
                <label key={pkg.value} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={(newLicense.packages || []).includes(pkg.value as any)}
                    onChange={() => togglePackage(pkg.value)}
                    className="rounded border-gray-300 text-primary-500 focus:ring-primary-500 dark:border-slate-800 dark:bg-slate-900"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{pkg.label}</span>
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
        title="Edit License"
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
              placeholder="Production License"
              value={newLicense.name || ''}
              onChange={(e) => setNewLicense({ ...newLicense, name: e.target.value })}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:placeholder-gray-400"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tier
            </label>
            <select
              value={newLicense.tier || 'starter'}
              onChange={(e) => setNewLicense({ ...newLicense, tier: e.target.value as any })}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            >
              {tierOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Status
            </label>
            <select
              value={newLicense.status || 'active'}
              onChange={(e) => setNewLicense({ ...newLicense, status: e.target.value as any })}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Expiration Date
            </label>
            <input
              type="datetime-local"
              value={newLicense.expiresAt ? new Date(newLicense.expiresAt).toISOString().slice(0, 16) : ''}
              onChange={(e) => setNewLicense({ ...newLicense, expiresAt: e.target.value || null })}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
