/**
 * Workspace Repository Interface
 */

export interface Workspace {
  id: string;
  name: string;
  description: string | null;
  organizationId: string | null; // Optional - workspaces can be at realm level
  // Provisioning fields for multi-tenancy
  realmId?: string | null;
  databaseName?: string | null;
  domainAliases?: string[] | null;
  rootManagerEmail?: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface CreateWorkspaceInput {
  id: string;
  name: string;
  description: string | null;
  organizationId: string | null; // Optional - workspaces can be at realm level
  // Provisioning fields (optional)
  realmId?: string | null;
  domainAliases?: string[] | null;
  rootManagerEmail?: string | null;
}

export interface UpdateWorkspaceInput {
  name?: string;
  description?: string | null;
}

export interface ListWorkspaceFilters {
  organizationId?: string;
  limit?: number;
  offset?: number;
}

export interface IWorkspaceRepository {
  create(input: CreateWorkspaceInput): Promise<Workspace>;
  findById(id: string): Promise<Workspace | null>;
  list(filters: ListWorkspaceFilters): Promise<{ workspaces: Workspace[]; total: number }>;
  update(id: string, input: UpdateWorkspaceInput): Promise<Workspace>;
  softDelete(id: string): Promise<void>;
}
