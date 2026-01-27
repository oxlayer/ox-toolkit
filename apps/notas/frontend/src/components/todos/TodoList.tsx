import { useIntentToggleTodo, useIntentDeleteTodo } from '@/hooks/use-intent-mutations';
import { TodoItem } from './TodoItem';
import type { Todo } from '@/types';

interface TodoListProps {
  todos: Todo[];
  showCompleted?: boolean;
}

export function TodoList({ todos, showCompleted = true }: TodoListProps) {
  const toggleTodo = useIntentToggleTodo();
  const deleteTodo = useIntentDeleteTodo();

  if (todos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold mb-1">No tasks yet</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Add a task above or use voice input to get started.
        </p>
      </div>
    );
  }

  const sortedTodos = [...todos].sort((a, b) => {
    // Sort by completion status first
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }

    // Then by priority
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }

    // Then by due date
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }

    // Then by creation date
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  const visibleTodos = showCompleted
    ? sortedTodos
    : sortedTodos.filter((t) => !t.completed);

  return (
    <div className="space-y-1">
      {visibleTodos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggle={(todo) => toggleTodo.mutate(todo)}
          onUpdate={() => {
            // Implement update if needed
          }}
          onDelete={(id) => deleteTodo.mutate(id)}
        />
      ))}
    </div>
  );
}
