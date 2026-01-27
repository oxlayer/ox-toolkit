// ============================================================================
// DOMAIN TYPES
// ============================================================================

export type TodoId = string;
export type ProjectId = string;
export type SectionId = string;

export type Priority = 1 | 2 | 3 | 4; // P1 = High, P4 = Low

export type TodoStatus = 'inbox' | 'today' | 'upcoming' | 'completed' | 'deleted';

// ============================================================================
// ACTOR TYPES (from progressive identity system)
// ============================================================================

export type ActorType = 'anonymous' | 'user';

export interface AnonymousActor {
  actor_type: 'anonymous';
  actor_id: string;    // Session or device ID
  session_id: string;
  channel: 'web' | 'voice';
}

export interface UserActor {
  actor_type: 'user';
  actor_id: string;    // User ID from Keycloak
  sub: string;         // Keycloak subject
  email?: string;
  name?: string;
}

export type Actor = AnonymousActor | UserActor;

// ============================================================================
// TODO TYPES
// ============================================================================

export interface Todo {
  id: TodoId;
  title: string;
  description?: string;
  completed: boolean;
  priority: Priority;
  dueDate?: string;     // ISO date string
  projectId?: ProjectId;
  sectionId?: SectionId;
  createdAt: string;    // ISO timestamp
  updatedAt: string;    // ISO timestamp
  completedAt?: string; // ISO timestamp
  order?: number;       // For manual sorting
  // WhatsApp-like sync status
  syncStatus?: 'local' | 'queued' | 'sending' | 'acknowledged' | 'confirmed' | 'failed';
}

export interface CreateTodoInput {
  title: string;
  description?: string;
  priority?: Priority;
  dueDate?: string;
  projectId?: ProjectId;
  sectionId?: SectionId;
}

export interface UpdateTodoInput {
  title?: string;
  description?: string;
  completed?: boolean;
  priority?: Priority;
  dueDate?: string;
  projectId?: ProjectId;
  sectionId?: SectionId;
}

// ============================================================================
// PROJECT TYPES
// ============================================================================

export interface Project {
  id: ProjectId;
  name: string;
  color?: string;
  icon?: string;
  isInbox: boolean;     // True for default Inbox project
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectInput {
  name: string;
  color?: string;
  icon?: string;
}

export interface UpdateProjectInput {
  name?: string;
  color?: string;
  icon?: string;
}

// ============================================================================
// SECTION TYPES
// ============================================================================

export interface Section {
  id: SectionId;
  projectId: ProjectId;
  name: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSectionInput {
  projectId: ProjectId;
  name: string;
}

export interface UpdateSectionInput {
  name?: string;
  order?: number;
}

// ============================================================================
// VIEW TYPES
// ============================================================================

export type ViewType = 'inbox' | 'today' | 'upcoming' | 'project' | 'section';

export interface ViewFilter {
  type: ViewType;
  projectId?: ProjectId;
  sectionId?: SectionId;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T> {
  data: T;
  meta?: {
    total?: number;
    page?: number;
    pageSize?: number;
  };
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}

// ============================================================================
// VOICE COMMAND TYPES
// ============================================================================

export interface VoiceCommand {
  type: 'create' | 'complete' | 'delete' | 'update';
  todo?: CreateTodoInput;
  todoId?: TodoId;
}

export interface ParsedVoiceInput {
  command: VoiceCommand;
  confidence: number;
  rawText: string;
}

// ============================================================================
// FILTER & SORT TYPES
// ============================================================================

export type TodoSortBy = 'dueDate' | 'priority' | 'created' | 'custom';

export interface TodoFilter {
  status?: TodoStatus;
  priority?: Priority;
  projectId?: ProjectId;
  sectionId?: SectionId;
  searchQuery?: string;
}
