export type OrganizationRole = 'owner' | 'admin' | 'consultor';

export type Organization = {
  id: string;
  name: string;
  createdAt: Date;
};

export type Workspace = {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  createdAt: Date;
};

export type OrganizationMember = {
  userId: string;
  organizationId: string;
  role: OrganizationRole;
};
