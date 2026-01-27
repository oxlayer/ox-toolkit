import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { todosApi, todoQueryKeys } from '@/lib/api/todos';
import { useAuth } from '@/lib/auth';
import type { Todo, CreateTodoInput, UpdateTodoInput, TodoFilter } from '@/types';

// ============================================================================
// QUERY HOOKS
// ============================================================================

/**
 * Fetch todos with optional filtering
 * Only fetches from server when authenticated
 */
export function useTodos(filter?: TodoFilter) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: todoQueryKeys.list(filter),
    queryFn: () => todosApi.getAll(filter),
    enabled: isAuthenticated, // Only fetch from server when logged in
    staleTime: 1000 * 60, // 1 minute
  });
}

/**
 * Fetch a single todo by ID
 * Only fetches from server when authenticated
 */
export function useTodo(id: string) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: todoQueryKeys.detail(id),
    queryFn: () => todosApi.getById(id),
    enabled: !!id && isAuthenticated, // Only fetch when logged in
  });
}

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Create a new todo
 */
export function useCreateTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTodoInput) => {
      console.log('[useCreateTodo] mutationFn called with:', input);
      return todosApi.create(input);
    },

    onMutate: async (newTodo) => {
      console.log('[useCreateTodo] onMutate called with:', newTodo);
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: todoQueryKeys.lists() });

      // Snapshot previous value
      const previousTodos = queryClient.getQueryData(todoQueryKeys.list());

      // Optimistically update
      queryClient.setQueryData(
        todoQueryKeys.list(),
        (old: unknown) => {
          const oldArray = Array.isArray(old) ? old : [];
          console.log('[useCreateTodo] onMutate: old data:', old, 'as array:', oldArray);
          return [
            {
              id: `temp-${Date.now()}`,
              title: newTodo.title,
              description: newTodo.description,
              completed: false,
              priority: newTodo.priority || 4,
              dueDate: newTodo.dueDate,
              projectId: newTodo.projectId,
              sectionId: newTodo.sectionId,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            ...oldArray,
          ];
        }
      );

      return { previousTodos };
    },

    onError: (error, _variables, context) => {
      console.error('[useCreateTodo] onError called:', error);
      // Rollback on error
      if (context?.previousTodos) {
        queryClient.setQueryData(todoQueryKeys.list(), context.previousTodos);
      }
    },

    onSuccess: (data) => {
      console.log('[useCreateTodo] onSuccess called with:', data);
    },

    onSettled: () => {
      console.log('[useCreateTodo] onSettled called');
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: todoQueryKeys.lists() });
    },
  });
}

/**
 * Update a todo
 */
export function useUpdateTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTodoInput }) =>
      todosApi.update(id, input),

    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: todoQueryKeys.lists() });

      const previousTodos = queryClient.getQueryData(todoQueryKeys.list());

      // Optimistically update
      queryClient.setQueryData(
        todoQueryKeys.list(),
        (old: Todo[] = []) =>
          old.map((todo) =>
            todo.id === id ? { ...todo, ...input, updatedAt: new Date().toISOString() } : todo
          )
      );

      return { previousTodos };
    },

    onError: (_error, _variables, context) => {
      if (context?.previousTodos) {
        queryClient.setQueryData(todoQueryKeys.list(), context.previousTodos);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: todoQueryKeys.lists() });
    },
  });
}

/**
 * Toggle todo completion
 */
export function useToggleTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      todosApi.toggleComplete(id, completed),

    onMutate: async ({ id, completed }) => {
      await queryClient.cancelQueries({ queryKey: todoQueryKeys.lists() });

      const previousTodos = queryClient.getQueryData(todoQueryKeys.list());

      queryClient.setQueryData(
        todoQueryKeys.list(),
        (old: Todo[] = []) =>
          old.map((todo) =>
            todo.id === id
              ? {
                  ...todo,
                  completed,
                  completedAt: completed ? new Date().toISOString() : undefined,
                  updatedAt: new Date().toISOString(),
                }
              : todo
          )
      );

      return { previousTodos };
    },

    onError: (_error, _variables, context) => {
      if (context?.previousTodos) {
        queryClient.setQueryData(todoQueryKeys.list(), context.previousTodos);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: todoQueryKeys.lists() });
    },
  });
}

/**
 * Delete a todo
 */
export function useDeleteTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => todosApi.delete(id),

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: todoQueryKeys.lists() });

      const previousTodos = queryClient.getQueryData(todoQueryKeys.list());

      queryClient.setQueryData(
        todoQueryKeys.list(),
        (old: Todo[] = []) => old.filter((todo) => todo.id !== id)
      );

      return { previousTodos };
    },

    onError: (_error, _variables, context) => {
      if (context?.previousTodos) {
        queryClient.setQueryData(todoQueryKeys.list(), context.previousTodos);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: todoQueryKeys.lists() });
    },
  });
}

/**
 * Bulk update todos
 */
export function useBulkUpdateTodos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ids, input }: { ids: string[]; input: UpdateTodoInput }) =>
      todosApi.bulkUpdate(ids, input),

    onMutate: async ({ ids, input }) => {
      await queryClient.cancelQueries({ queryKey: todoQueryKeys.lists() });

      const previousTodos = queryClient.getQueryData(todoQueryKeys.list());

      queryClient.setQueryData(
        todoQueryKeys.list(),
        (old: Todo[] = []) =>
          old.map((todo) =>
            ids.includes(todo.id)
              ? { ...todo, ...input, updatedAt: new Date().toISOString() }
              : todo
          )
      );

      return { previousTodos };
    },

    onError: (_error, _variables, context) => {
      if (context?.previousTodos) {
        queryClient.setQueryData(todoQueryKeys.list(), context.previousTodos);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: todoQueryKeys.lists() });
    },
  });
}

/**
 * Clear completed todos
 */
export function useClearCompleted() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => todosApi.clearCompleted(),

    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: todoQueryKeys.lists() });

      const previousTodos = queryClient.getQueryData(todoQueryKeys.list());

      queryClient.setQueryData(
        todoQueryKeys.list(),
        (old: Todo[] = []) => old.filter((todo) => !todo.completed)
      );

      return { previousTodos };
    },

    onError: (_error, _variables, context) => {
      if (context?.previousTodos) {
        queryClient.setQueryData(todoQueryKeys.list(), context.previousTodos);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: todoQueryKeys.lists() });
    },
  });
}
