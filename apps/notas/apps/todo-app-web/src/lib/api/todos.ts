import { api } from './client';
import type {
  Todo,
  CreateTodoInput,
  UpdateTodoInput,
  TodoFilter,
} from '@/types';

// ============================================================================
// TYPES
// ============================================================================

// Backend API response format
interface BackendTodoResponse {
  id: string;
  title: string;
  description: string | null;
  status: 'pending' | 'completed' | 'deleted';
  userId: string;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface BackendListResponse<T> {
  success: boolean;
  todos: T[];
}

interface BackendSingleResponse<T> {
  success: boolean;
  todo: T;
}

// ============================================================================
// TRANSFORMERS
// ============================================================================

function transformBackendTodo(backendTodo: BackendTodoResponse): Todo {
  return {
    id: backendTodo.id,
    title: backendTodo.title,
    description: backendTodo.description || undefined,
    completed: backendTodo.status === 'completed',
    priority: 4, // Backend doesn't return priority, default to 4 (low)
    dueDate: backendTodo.dueDate || undefined,
    createdAt: backendTodo.createdAt,
    updatedAt: backendTodo.updatedAt,
    completedAt: backendTodo.completedAt || undefined,
  };
}

// ============================================================================
// TODO API
// ============================================================================

export const todosApi = {
  /**
   * Get all todos with optional filtering
   */
  getAll: async (filter?: TodoFilter) => {
    const result = await api.get<BackendListResponse<BackendTodoResponse>>(`/todos${buildQueryString(filter)}`);
    if (!result || !result.todos) return [];
    console.log('[todosApi.getAll] Raw backend response:', result);
    const transformed = result.todos.map(transformBackendTodo);
    console.log('[todosApi.getAll] Transformed todos:', transformed);
    return transformed;
  },

  /**
   * Get a single todo by ID
   */
  getById: async (id: string) => {
    const result = await api.get<BackendSingleResponse<BackendTodoResponse>>(`/todos/${id}`);
    if (!result || !result.todo) throw new Error('Todo not found');
    return transformBackendTodo(result.todo);
  },

  /**
   * Create a new todo
   */
  create: async (input: CreateTodoInput) => {
    console.log('[todosApi.create] Called with input:', input);
    const result = await api.post<BackendSingleResponse<BackendTodoResponse>>('/todos', input);
    if (!result || !result.todo) throw new Error('Failed to create todo');
    console.log('[todosApi.create] Backend response:', result);
    return transformBackendTodo(result.todo);
  },

  /**
   * Update a todo
   */
  update: async (id: string, input: UpdateTodoInput) => {
    const result = await api.patch<BackendSingleResponse<BackendTodoResponse>>(`/todos/${id}`, input);
    if (!result || !result.todo) throw new Error('Failed to update todo');
    return transformBackendTodo(result.todo);
  },

  /**
   * Delete a todo
   */
  delete: (id: string) =>
    api.delete<void>(`/todos/${id}`),

  /**
   * Toggle todo completion
   */
  toggleComplete: async (id: string, completed: boolean) => {
    const result = await api.patch<BackendSingleResponse<BackendTodoResponse>>(`/todos/${id}`, { completed });
    if (!result || !result.todo) throw new Error('Failed to update todo');
    return transformBackendTodo(result.todo);
  },

  /**
   * Bulk update todos
   */
  bulkUpdate: async (ids: string[], input: UpdateTodoInput) => {
    const result = await api.patch<BackendListResponse<BackendTodoResponse>>('/todos/bulk', { ids, ...input });
    if (!result || !result.todos) return [];
    return result.todos.map(transformBackendTodo);
  },

  /**
   * Clear completed todos
   */
  clearCompleted: () =>
    api.delete<void>('/todos/completed'),
};

// ============================================================================
// QUERY KEYS
// ============================================================================

export const todoQueryKeys = {
  all: ['todos'] as const,
  lists: () => [...todoQueryKeys.all, 'list'] as const,
  list: (filter?: TodoFilter) => [...todoQueryKeys.lists(), filter] as const,
  details: () => [...todoQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...todoQueryKeys.details(), id] as const,
};

// ============================================================================
// UTILS
// ============================================================================

function buildQueryString(filter?: TodoFilter): string {
  if (!filter) return '';

  const params = new URLSearchParams();

  if (filter.status) params.append('status', filter.status);
  if (filter.priority) params.append('priority', filter.priority.toString());
  if (filter.projectId) params.append('projectId', filter.projectId);
  if (filter.sectionId) params.append('sectionId', filter.sectionId);
  if (filter.searchQuery) params.append('search', filter.searchQuery);

  const query = params.toString();
  return query ? `?${query}` : '';
}
