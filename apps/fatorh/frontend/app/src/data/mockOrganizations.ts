import type { Organization, Workspace, OrganizationMember } from "@/types/organization";

// IDs dos workspaces para uso em outros arquivos
export const WORKSPACE_IDS = {
  TRAINEE_NESTLE: "ws-001-trainee-nestle",
  ESTAGIO_GLOBEX: "ws-002-estagio-globex",
  JOVEM_APRENDIZ_ITAU: "ws-003-jovem-aprendiz-itau",
};

// Organização principal
export const mockOrganizations: Organization[] = [
  {
    id: "org-001-acme",
    name: "Acme",
    createdAt: new Date("2024-01-01T10:00:00Z"),
  },
];

// Workspaces da organização
export const mockWorkspaces: Workspace[] = [
  {
    id: WORKSPACE_IDS.TRAINEE_NESTLE,
    organizationId: mockOrganizations[0].id,
    name: "Trainee Nestlé 2025",
    description: "Programa de Trainee da Nestlé para 2025",
    createdAt: new Date("2024-01-10T10:00:00Z"),
  },
  {
    id: WORKSPACE_IDS.ESTAGIO_GLOBEX,
    organizationId: mockOrganizations[0].id,
    name: "Programa de Estágio Globex 2026",
    description: "Programa de Estágio da Globex para 2026",
    createdAt: new Date("2024-02-15T14:00:00Z"),
  },
  {
    id: WORKSPACE_IDS.JOVEM_APRENDIZ_ITAU,
    organizationId: mockOrganizations[0].id,
    name: "Jovem Aprendiz Itaú",
    description: "Programa Jovem Aprendiz do Itaú",
    createdAt: new Date("2024-03-01T09:00:00Z"),
  },
];

// Membros da organização (usuário mock)
export const mockOrganizationMembers: OrganizationMember[] = [
  {
    userId: "user-001-robert",
    organizationId: mockOrganizations[0].id,
    role: "owner",
  },
];

// Mapeamento de empresas para workspaces
// Cada workspace pode ter múltiplas empresas (clientes/parceiros)
export const workspaceCompanies: Record<string, string[]> = {
  [WORKSPACE_IDS.TRAINEE_NESTLE]: [
    "550e8400-e29b-41d4-a716-446655440000", // TechCorp Solutions
    "550e8400-e29b-41d4-a716-446655440001", // InnovaTech
  ],
  [WORKSPACE_IDS.ESTAGIO_GLOBEX]: [
    "550e8400-e29b-41d4-a716-446655440002", // Digital Solutions BR
  ],
  [WORKSPACE_IDS.JOVEM_APRENDIZ_ITAU]: [
    "550e8400-e29b-41d4-a716-446655440003", // Cloud Systems
  ],
};

// Função helper para obter empresas de um workspace
export const getCompaniesByWorkspace = (workspaceId: string): string[] => {
  return workspaceCompanies[workspaceId] || [];
};

// Função helper para obter workspaces de uma organização
export const getWorkspacesByOrganization = (organizationId: string): Workspace[] => {
  return mockWorkspaces.filter((ws) => ws.organizationId === organizationId);
};
