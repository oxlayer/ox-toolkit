// Dados mockados de usuários para o dashboard

export interface MockUser {
  id: string;
  name: string;
  phone: string;
  cpf: string;
  email?: string;
}

export const mockUsers: MockUser[] = [
  {
    id: "880e8400-e29b-41d4-a716-446655440000",
    name: "Carlos Silva",
    phone: "+5511999999999",
    cpf: "123.456.789-00",
    email: "carlos.silva@email.com",
  },
  {
    id: "880e8400-e29b-41d4-a716-446655440001",
    name: "Ana Santos",
    phone: "+5511888888888",
    cpf: "234.567.890-11",
    email: "ana.santos@email.com",
  },
  {
    id: "880e8400-e29b-41d4-a716-446655440002",
    name: "Roberto Lima",
    phone: "+5511777777777",
    cpf: "345.678.901-22",
    email: "roberto.lima@email.com",
  },
  {
    id: "880e8400-e29b-41d4-a716-446655440003",
    name: "Mariana Costa",
    phone: "+5511666666666",
    cpf: "456.789.012-33",
    email: "mariana.costa@email.com",
  },
  {
    id: "880e8400-e29b-41d4-a716-446655440004",
    name: "Pedro Oliveira",
    phone: "+5511555555555",
    cpf: "567.890.123-44",
    email: "pedro.oliveira@email.com",
  },
];

