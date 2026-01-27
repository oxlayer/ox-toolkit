import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Database, CheckCircle, XCircle, Loader2, User, RefreshCw, Building, AlertCircle, AlertTriangle, X, Server, RotateCcw, Key } from 'lucide-react';
import {
  listTenants,
  getTenant,
  provisionTenant,
  retryOrganizations,
  deleteTenant,
  deleteRealm,
  deleteDatabase,
  recreateRealm,
  recreateDatabase,
  rotateCredentials,
  type Workspace,
  type ProvisionTenantRequest,
  type OwnerUser,
  type TenantOrganization,
  type Tenant
} from '../lib/api';
import ConfirmationDialog from '../components/ConfirmationDialog';

export default function TenantsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [formData, setFormData] = useState<ProvisionTenantRequest>({
    realmId: '',
    displayName: '',
    owner: {
      email: '',
      firstName: '',
      lastName: '',
      temporaryPassword: '',
    },
    workspaces: [{ name: '', domainAliases: [] }],
  });

  // List tenants query
  const { data: tenantsData, isLoading, error } = useQuery({
    queryKey: ['tenants'],
    queryFn: listTenants,
  });

  // Get specific tenant query (fetches fresh data when modal opens)
  const { data: tenantData, refetch: refetchTenant } = useQuery({
    queryKey: ['tenant', selectedTenant?.realmId],
    queryFn: () => getTenant(selectedTenant!.realmId),
    enabled: !!selectedTenant,
  });

  // Provision tenant mutation
  const provisionMutation = useMutation({
    mutationFn: provisionTenant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      setShowForm(false);
      setFormData({
        realmId: '',
        displayName: '',
        owner: {
          email: '',
          firstName: '',
          lastName: '',
          temporaryPassword: '',
        },
        workspaces: [{ name: '', alias: '', domainAliases: [] }],
      });
    },
  });

  // Retry organization mutation (for specific workspace)
  const retryOrgMutation = useMutation({
    mutationFn: ({ realmId, workspaceId }: { realmId: string; workspaceId: string }) =>
      retryOrganizations(realmId, workspaceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['tenant', selectedTenant?.realmId] });
      refetchTenant();
    },
  });

  // Delete and recreate state
  const [deleteConfirmMode, setDeleteConfirmMode] = useState<'realm' | 'database' | 'tenant' | null>(null);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');
  const [databaseToDelete, setDatabaseToDelete] = useState<string | null>(null);
  const [recreateState, setRecreateState] = useState<{ realm: boolean; database: string | null }>({ realm: false, database: null });

  // Password rotation state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
  const [selectedWorkspaceName, setSelectedWorkspaceName] = useState<string>('');
  const [selectedDbUser, setSelectedDbUser] = useState<string>('');
  const [passwordMode, setPasswordMode] = useState<'generate' | 'custom'>('generate');
  const [customPassword, setCustomPassword] = useState('');
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);

  // Delete mutations
  const deleteTenantMutation = useMutation({
    mutationFn: deleteTenant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      setSelectedTenant(null);
      setDeleteConfirmMode(null);
      setDeleteConfirmInput('');
    },
  });

  const deleteRealmMutation = useMutation({
    mutationFn: deleteRealm,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['tenant', selectedTenant?.realmId] });
      refetchTenant();
      setDeleteConfirmMode(null);
      setDeleteConfirmInput('');
    },
  });

  const deleteDatabaseMutation = useMutation({
    mutationFn: ({ workspaceId }: { workspaceId: string }) =>
      deleteDatabase(selectedTenant!.realmId, workspaceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['tenant', selectedTenant?.realmId] });
      refetchTenant();
      setDeleteConfirmMode(null);
      setDeleteConfirmInput('');
      setDatabaseToDelete(null);
    },
  });

  // Recreate mutations
  const recreateRealmMutation = useMutation({
    mutationFn: recreateRealm,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['tenant', selectedTenant?.realmId] });
      refetchTenant();
      setRecreateState({ realm: false, database: null });
    },
  });

  const recreateDatabaseMutation = useMutation({
    mutationFn: ({ workspaceId }: { workspaceId: string }) =>
      recreateDatabase(selectedTenant!.realmId, workspaceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['tenant', selectedTenant?.realmId] });
      refetchTenant();
      setRecreateState({ realm: false, database: null });
    },
  });

  // Migrate database mutation
  const migrateDatabaseMutation = useMutation({
    mutationFn: async ({ workspaceId }: { workspaceId: string }) => {
      const response = await fetch(`/api/admin/databases/migrate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('kc_token')}`,
        },
        body: JSON.stringify({ realm: selectedTenant!.realmId, workspaceId }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || 'Failed to migrate database');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['tenant', selectedTenant?.realmId] });
      refetchTenant();
    },
  });

  // Rotate credentials mutation
  const rotateCredentialsMutation = useMutation({
    mutationFn: ({ workspaceId, newPassword }: { workspaceId: string; newPassword?: string }) =>
      rotateCredentials({ workspaceId, newPassword }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['tenant', selectedTenant?.realmId] });
      refetchTenant();

      // Show generated password if applicable
      if (data.passwordGenerated) {
        // We'll handle this in the modal
      }

      // Close modal and reset state
      setShowPasswordModal(false);
      setPasswordMode('generate');
      setCustomPassword('');
      setGeneratedPassword(null);
      setSelectedWorkspaceId(null);
      setSelectedWorkspaceName('');
      setSelectedDbUser('');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    provisionMutation.mutate(formData);
  };

  // Normalize text to lowercase alphanumeric with hyphens
  const normalizeId = (text: string): string => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except hyphens and spaces
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  };

  const addWorkspace = () => {
    setFormData({
      ...formData,
      workspaces: [
        ...formData.workspaces,
        { name: '', alias: '', domainAliases: [] },
      ],
    });
  };

  const removeWorkspace = (index: number) => {
    setFormData({
      ...formData,
      workspaces: formData.workspaces.filter((_, i) => i !== index),
    });
  };

  const updateWorkspace = (index: number, field: keyof Workspace, value: string | string[]) => {
    const newWorkspaces = [...formData.workspaces];
    newWorkspaces[index] = { ...newWorkspaces[index], [field]: value };
    setFormData({ ...formData, workspaces: newWorkspaces });
  };

  // Delete and recreate handlers
  const handleDeleteConfirm = () => {
    switch (deleteConfirmMode) {
      case 'tenant':
        deleteTenantMutation.mutate(selectedTenant!.realmId);
        break;
      case 'realm':
        deleteRealmMutation.mutate(selectedTenant!.realmId);
        break;
      case 'database':
        if (databaseToDelete) {
          deleteDatabaseMutation.mutate({ workspaceId: databaseToDelete });
        } else {
          // Delete all databases - this needs to be handled by the API
          // For now, we'll use deleteTenant
          deleteTenantMutation.mutate(selectedTenant!.realmId);
        }
        break;
    }
  };

  const handleRecreateRealm = () => {
    if (selectedTenant) {
      setRecreateState({ ...recreateState, realm: true });
      recreateRealmMutation.mutate(selectedTenant.realmId);
    }
  };

  const handleRecreateDatabase = (workspaceId: string) => {
    setRecreateState({ ...recreateState, database: workspaceId });
    recreateDatabaseMutation.mutate({ workspaceId });
  };

  const handleMigrateDatabase = (workspaceId: string) => {
    migrateDatabaseMutation.mutate({ workspaceId });
  };

  const handleRotateCredentials = (workspaceId: string, workspaceName: string, dbUser: string) => {
    setSelectedWorkspaceId(workspaceId);
    setSelectedWorkspaceName(workspaceName);
    setSelectedDbUser(dbUser);
    setPasswordMode('generate');
    setCustomPassword('');
    setGeneratedPassword(null);
    setShowPasswordModal(true);
  };

  const handlePasswordRotationSubmit = () => {
    if (!selectedWorkspaceId) return;

    if (passwordMode === 'custom') {
      if (!customPassword || customPassword.length < 8) {
        alert('Password must be at least 8 characters long');
        return;
      }
      rotateCredentialsMutation.mutate({
        workspaceId: selectedWorkspaceId,
        newPassword: customPassword,
      });
    } else {
      rotateCredentialsMutation.mutate({
        workspaceId: selectedWorkspaceId,
      });
    }
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-800">
          <XCircle className="w-5 h-5" />
          <p className="font-medium">Error loading tenants</p>
        </div>
        <p className="text-red-700 mt-1">{(error as Error).message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Tenant Management</h2>
          <p className="text-gray-600 mt-1">
            Provision and manage B2B tenants with isolated Keycloak realms and databases
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Tenant
          </button>
        )}
      </div>

      {/* Provision Form */}
      {showForm && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900">Provision New Tenant</h3>
            <p className="text-gray-600 text-sm mt-1">
              Create a new B2B realm in Keycloak with isolated databases for each workspace
            </p>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Realm Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Realm ID *
                </label>
                <input
                  type="text"
                  required
                  placeholder="company-name"
                  value={formData.realmId}
                  onChange={(e) => setFormData({ ...formData, realmId: normalizeId(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Auto-normalized to lowercase alphanumeric with hyphens</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Company Name"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Owner User */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center gap-2 mb-3">
                <User className="w-5 h-5 text-gray-700" />
                <label className="block text-sm font-medium text-gray-700">
                  Owner User *
                </label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="owner@company.com"
                    value={formData.owner.email}
                    onChange={(e) => setFormData({
                      ...formData,
                      owner: { ...formData.owner, email: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Temporary Password *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    placeholder="••••••••"
                    value={formData.owner.temporaryPassword}
                    onChange={(e) => setFormData({
                      ...formData,
                      owner: { ...formData.owner, temporaryPassword: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">Min 8 characters, user must change on first login</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="John"
                    value={formData.owner.firstName}
                    onChange={(e) => setFormData({
                      ...formData,
                      owner: { ...formData.owner, firstName: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Doe"
                    value={formData.owner.lastName}
                    onChange={(e) => setFormData({
                      ...formData,
                      owner: { ...formData.owner, lastName: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Workspaces */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Workspaces *
                </label>
                <button
                  type="button"
                  onClick={addWorkspace}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Add Workspace
                </button>
              </div>
              <div className="space-y-3">
                {formData.workspaces.map((workspace, index) => (
                  <div key={index} className="flex gap-3 items-start p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Name (Organization) *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="company-name"
                          value={workspace.name}
                          onChange={(e) => updateWorkspace(index, 'name', normalizeId(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                        <p className="text-xs text-gray-500 mt-1">Auto-normalized ID</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Alias (Display Name) *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Company Name"
                          value={workspace.alias}
                          onChange={(e) => updateWorkspace(index, 'alias', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                        <p className="text-xs text-gray-500 mt-1">Human-readable name</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Domain Aliases
                        </label>
                        <input
                          type="text"
                          placeholder="company.example.com, app.company.com"
                          value={workspace.domainAliases?.join(', ') || ''}
                          onChange={(e) => {
                            const aliases = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                            updateWorkspace(index, 'domainAliases', aliases);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                        <p className="text-xs text-gray-500 mt-1">Comma-separated domains</p>
                      </div>
                    </div>
                    {formData.workspaces.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeWorkspace(index)}
                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                type="submit"
                disabled={provisionMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {provisionMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Provisioning...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Provision Tenant
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                disabled={provisionMutation.isPending}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
            </div>

            {/* Error display */}
            {provisionMutation.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-800">
                  <XCircle className="w-5 h-5" />
                  <p className="font-medium">Provisioning failed</p>
                </div>
                <p className="text-red-700 text-sm mt-1">
                  {(provisionMutation.error as Error).message}
                </p>
                {(provisionMutation.error as Error).message?.includes('Organizations') && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-yellow-800 text-sm font-medium">To fix this issue:</p>
                    <ol className="text-yellow-700 text-sm mt-2 list-decimal list-inside space-y-1">
                      <li>Go to Keycloak Admin Console</li>
                      <li>Select your realm</li>
                      <li>Go to Realm Settings &gt; Extensions</li>
                      <li>Enable the "Organizations" extension</li>
                      <li>Click "Save" and retry provisioning</li>
                    </ol>
                  </div>
                )}
              </div>
            )}

            {/* Success display */}
            {provisionMutation.isSuccess && provisionMutation.data && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="w-5 h-5" />
                  <p className="font-medium">Tenant provisioned successfully!</p>
                </div>
                <div className="mt-3 space-y-2 text-sm">
                  <p className="text-green-700">
                    <strong>Realm:</strong> {provisionMutation.data.results.realm?.id}
                  </p>
                  {provisionMutation.data.results.realm?.owner && (
                    <p className="text-green-700">
                      <strong>Owner:</strong> {provisionMutation.data.results.realm.owner.firstName} {provisionMutation.data.results.realm.owner.lastName} ({provisionMutation.data.results.realm.owner.email})
                    </p>
                  )}
                  <p className="text-green-700">
                    <strong>Databases:</strong>
                  </p>
                  <ul className="list-disc list-inside text-green-700 ml-4">
                    {provisionMutation.data.results.databases.map((db, i) => (
                      <li key={i}>
                        {db.workspaceId}: {db.database} ({db.status})
                        {db.migrations && ` - migrations: ${db.migrations}`}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </form>
        </div>
      )}

      {/* Tenants List */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">Existing Tenants</h3>
        </div>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-8 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : tenantsData?.tenants && tenantsData.tenants.length > 0 ? (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tenant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Realm ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Workspaces
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Organizations
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Owner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tenantsData.tenants.map((tenant, i) => (
                  <tr
                    key={i}
                    onClick={() => setSelectedTenant(tenant)}
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{tenant.displayName}</div>
                        <div className="text-sm text-gray-500">{tenant.realmId}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 font-mono">
                      {tenant.realmName}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      <div className="space-y-1">
                        {tenant.databases.map((db: any) => (
                          <div key={db.workspaceId} className="flex items-center gap-2">
                            <span className="font-medium">{db.workspaceName}</span>
                            <span className="text-xs text-gray-500 font-mono">{db.workspaceId.slice(0, 8)}...</span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                              db.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {db.enabled ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        ))}
                        {tenant.databases.length === 0 && (
                          <span className="text-gray-400 text-sm">No workspaces</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      <div className="space-y-2">
                        {tenant.organizations && tenant.organizations.length > 0 ? (
                          tenant.organizations.map((org: TenantOrganization) => (
                            <div key={org.id} className="flex items-center gap-2">
                              <Building className="w-4 h-4 text-gray-500" />
                              <span className="font-medium">{org.name}</span>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                                org.status === 'created'
                                  ? 'bg-green-100 text-green-800'
                                  : org.status === 'failed'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {org.status === 'created' ? (
                                  <>
                                    <CheckCircle className="w-3 h-3" />
                                    Created
                                  </>
                                ) : org.status === 'failed' ? (
                                  <>
                                    <XCircle className="w-3 h-3" />
                                    Failed
                                  </>
                                ) : (
                                  <>
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    Pending
                                  </>
                                )}
                              </span>
                              {org.status === 'failed' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    retryOrgMutation.mutate({ realmId: tenant.realmId, workspaceId: org.workspaceId });
                                  }}
                                  disabled={retryOrgMutation.isPending}
                                  className="text-blue-600 hover:text-blue-700 disabled:opacity-50"
                                  title="Retry organization creation"
                                >
                                  <RefreshCw className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          ))
                        ) : (
                          <span className="text-gray-400 text-sm">No organizations</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      <div>{tenant.ownerFirstName} {tenant.ownerLastName}</div>
                      <div className="text-xs text-gray-500">{tenant.ownerEmail}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${tenant.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {tenant.enabled ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <Database className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>No tenants found</p>
            </div>
          )}
        </div>
      </div>

      {/* Tenant Detail Modal */}
      {selectedTenant && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedTenant(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{(tenantData?.tenant || selectedTenant).displayName}</h3>
                <p className="text-sm text-gray-500 font-mono">{(tenantData?.tenant || selectedTenant).realmName}</p>
              </div>
              <div className="flex items-center gap-2">
                {/* Refresh button */}
                <button
                  onClick={() => refetchTenant()}
                  disabled={!refetchTenant}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                  title="Refresh tenant data"
                >
                  <RefreshCw className="w-5 h-5 text-gray-500" />
                </button>
                <button
                  onClick={() => setSelectedTenant(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Content - scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Owner Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-5 h-5 text-gray-700" />
                  <h4 className="font-semibold text-gray-900">Owner</h4>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Name:</span>{' '}
                    <span className="font-medium">{(tenantData?.tenant || selectedTenant).ownerFirstName} {(tenantData?.tenant || selectedTenant).ownerLastName}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Email:</span>{' '}
                    <span className="font-medium">{(tenantData?.tenant || selectedTenant).ownerEmail}</span>
                  </div>
                </div>
              </div>

              {/* Databases */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Server className="w-5 h-5 text-gray-700" />
                  <h4 className="font-semibold text-gray-900">Databases</h4>
                </div>
                <div className="space-y-2">
                  {(tenantData?.tenant || selectedTenant).databases.map((db, i) => (
                    <div key={i} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{db.workspaceName}</div>
                          <div className="text-xs text-gray-500 font-mono">{db.database}</div>
                          {db.dbUser && (
                            <div className="text-xs text-gray-500 mt-1">
                              <Key className="w-3 h-3 inline mr-1" />
                              User: <span className="font-mono">{db.dbUser}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
                            db.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {db.enabled ? 'Active' : 'Inactive'}
                          </span>
                          {db.dbUser && (
                            <button
                              onClick={() => handleRotateCredentials(db.workspaceId, db.workspaceName, db.dbUser)}
                              className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                              title="Rotate database credentials"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {(tenantData?.tenant || selectedTenant).databases.length === 0 && (
                    <div className="text-gray-400 text-sm">No databases found</div>
                  )}
                </div>
              </div>

              {/* Organizations */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Building className="w-5 h-5 text-gray-700" />
                  <h4 className="font-semibold text-gray-900">Organizations</h4>
                </div>
                <div className="space-y-2">
                  {(tenantData?.tenant || selectedTenant).organizations && (tenantData?.tenant || selectedTenant).organizations!.length > 0 ? (
                    (tenantData?.tenant || selectedTenant).organizations!.map((org) => (
                      <div key={org.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">{org.name}</span>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                                org.status === 'created'
                                  ? 'bg-green-100 text-green-800'
                                  : org.status === 'failed'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {org.status === 'created' ? (
                                  <>
                                    <CheckCircle className="w-3 h-3" />
                                    Created
                                  </>
                                ) : org.status === 'failed' ? (
                                  <>
                                    <XCircle className="w-3 h-3" />
                                    Failed
                                  </>
                                ) : (
                                  <>
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    Pending
                                  </>
                                )}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Workspace: {org.workspaceName} • ID: {org.workspaceId.slice(0, 8)}...
                            </div>
                            {org.keycloakOrganizationId && (
                              <div className="text-xs text-gray-500 mt-1">
                                Keycloak ID: {org.keycloakOrganizationId}
                              </div>
                            )}
                          </div>
                          {org.status === 'failed' && (
                            <button
                              onClick={() => retryOrgMutation.mutate({ realmId: selectedTenant.realmId, workspaceId: org.workspaceId })}
                              disabled={retryOrgMutation.isPending}
                              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {retryOrgMutation.isPending ? (
                                <>
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  Retrying...
                                </>
                              ) : (
                                <>
                                  <RefreshCw className="w-3 h-3" />
                                  Retry
                                </>
                              )}
                            </button>
                          )}
                        </div>
                        {org.errorMessage && (
                          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <div className="text-xs font-medium text-red-800">Error</div>
                                <div className="text-xs text-red-700 mt-1 break-all">{org.errorMessage}</div>
                                {org.retryCount > 0 && (
                                  <div className="text-xs text-red-600 mt-1">Retry count: {org.retryCount}</div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-400 text-sm">No organizations found</div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-semibold text-gray-900 mb-3">Management Actions</h4>

                {/* Realm Actions */}
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm font-medium text-blue-900 mb-2">Realm Actions</div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setDeleteConfirmMode('realm')}
                      disabled={deleteRealmMutation.isPending}
                      className="flex items-center gap-1 px-3 py-1.5 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Server className="w-3 h-3" />
                      Delete Realm
                    </button>
                    <button
                      onClick={handleRecreateRealm}
                      disabled={recreateRealmMutation.isPending}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Recreate Realm
                    </button>
                  </div>
                </div>

                {/* Database Actions */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-900 mb-2">Database Actions</div>
                  <div className="space-y-2">
                    {(tenantData?.tenant || selectedTenant).databases.map((db, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                        <div>
                          <div className="text-sm font-medium">{db.workspaceName}</div>
                          <div className="text-xs text-gray-500 font-mono">{db.database}</div>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleRecreateDatabase(db.workspaceId)}
                            disabled={recreateDatabaseMutation.isPending && recreateState.database === db.workspaceId}
                            className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="Recreate database"
                          >
                            <RotateCcw className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleMigrateDatabase(db.workspaceId)}
                            disabled={migrateDatabaseMutation.isPending}
                            className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="Run migrations"
                          >
                            {migrateDatabaseMutation.isPending && recreateState.database === db.workspaceId ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <RefreshCw className="w-3 h-3" />
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setDatabaseToDelete(db.workspaceId);
                              setDeleteConfirmMode('database');
                            }}
                            disabled={deleteDatabaseMutation.isPending}
                            className="flex items-center gap-1 px-2 py-1 bg-red-600 text-white text-xs font-medium rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="Delete database"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <div className="text-sm font-bold text-red-900">Danger Zone</div>
                  </div>
                  <p className="text-xs text-red-700 mb-3">These actions are permanent and cannot be undone.</p>
                  <button
                    onClick={() => setDeleteConfirmMode('tenant')}
                    disabled={deleteTenantMutation.isPending}
                    className="flex items-center gap-2 w-full px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Everything
                  </button>
                </div>
              </div>

              {/* Metadata */}
              <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
                <div>Provisioned: {new Date((tenantData?.tenant || selectedTenant).provisionedAt).toLocaleString()}</div>
                {(tenantData?.tenant || selectedTenant).realmId && <div>Realm ID: {(tenantData?.tenant || selectedTenant).realmId}</div>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteConfirmMode !== null}
        type={deleteConfirmMode}
        tenantName={selectedTenant?.realmId || ''}
        tenantDisplayName={selectedTenant?.displayName}
        confirmedName={deleteConfirmInput}
        onConfirm={handleDeleteConfirm}
        onInputChange={setDeleteConfirmInput}
        onCancel={() => {
          setDeleteConfirmMode(null);
          setDeleteConfirmInput('');
          setDatabaseToDelete(null);
        }}
        isExecuting={deleteTenantMutation.isPending || deleteRealmMutation.isPending || deleteDatabaseMutation.isPending}
        databaseInfo={selectedTenant && deleteConfirmMode === 'tenant' ? {
          count: (tenantData?.tenant || selectedTenant).databases.length,
          databases: (tenantData?.tenant || selectedTenant).databases.map(db => ({ workspaceName: db.workspaceName, database: db.database })),
        } : selectedTenant && deleteConfirmMode === 'database' && databaseToDelete ? {
          count: 1,
          databases: (tenantData?.tenant || selectedTenant).databases.filter(db => db.workspaceId === databaseToDelete).map(db => ({ workspaceName: db.workspaceName, database: db.database })),
        } : undefined}
      />

      {/* Password Rotation Modal */}
      {showPasswordModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowPasswordModal(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Rotate Database Credentials</h3>
              <p className="text-sm text-gray-500 mt-1">
                Change the password for database user
              </p>
            </div>

            <div className="p-6 space-y-4">
              {/* Workspace info */}
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="text-sm font-medium text-blue-900">{selectedWorkspaceName}</div>
                <div className="text-xs text-blue-700 mt-1">
                  User: <span className="font-mono">{selectedDbUser}</span>
                </div>
              </div>

              {/* Password mode selection */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Password Option
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setPasswordMode('generate')}
                    className={`flex-1 p-3 rounded-lg border-2 text-left transition-colors ${
                      passwordMode === 'generate'
                        ? 'border-blue-500 bg-blue-50 text-blue-900'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <div className="font-medium">Auto-generate</div>
                    <div className="text-xs mt-1 opacity-75">Generate a secure random password</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPasswordMode('custom')}
                    className={`flex-1 p-3 rounded-lg border-2 text-left transition-colors ${
                      passwordMode === 'custom'
                        ? 'border-blue-500 bg-blue-50 text-blue-900'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <div className="font-medium">Custom password</div>
                    <div className="text-xs mt-1 opacity-75">Enter your own password</div>
                  </button>
                </div>
              </div>

              {/* Custom password input */}
              {passwordMode === 'custom' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={customPassword}
                    onChange={(e) => setCustomPassword(e.target.value)}
                    placeholder="Enter new password (min 8 characters)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    minLength={8}
                  />
                  <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
                </div>
              )}

              {/* Success message */}
              {rotateCredentialsMutation.isSuccess && generatedPassword && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-green-800 mb-2">
                    <CheckCircle className="w-4 h-4" />
                    <span className="font-medium">Password rotated successfully!</span>
                  </div>
                  <div className="text-sm text-green-700">
                    <div className="mb-1">New password:</div>
                    <div className="font-mono bg-white p-2 rounded border border-green-300 select-all">
                      {generatedPassword}
                    </div>
                    <div className="text-xs mt-2 text-yellow-700">
                      ⚠️ Save this password now. You won't be able to see it again.
                    </div>
                  </div>
                </div>
              )}

              {/* Error message */}
              {rotateCredentialsMutation.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-red-800">
                    <XCircle className="w-4 h-4" />
                    <span className="font-medium">Failed to rotate credentials</span>
                  </div>
                  <div className="text-sm text-red-700 mt-1">
                    {(rotateCredentialsMutation.error as Error).message}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 p-6 pt-0">
              <button
                onClick={handlePasswordRotationSubmit}
                disabled={rotateCredentialsMutation.isPending || (passwordMode === 'custom' && customPassword.length < 8)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {rotateCredentialsMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Rotating...
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4" />
                    Rotate Password
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordMode('generate');
                  setCustomPassword('');
                  setGeneratedPassword(null);
                }}
                disabled={rotateCredentialsMutation.isPending}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
