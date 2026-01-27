import { useOfflineTodos } from '@/hooks/use-offline-data';
import { TodoInput, TodoList } from '@/components/todos';

export function InboxView() {
  const { todos = [], isLoading } = useOfflineTodos();

  // Ensure todos is always an array
  const todosArray = Array.isArray(todos) ? todos : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Inbox</h2>
        <p className="text-muted-foreground">
          Capture tasks quickly and organize them later
        </p>
      </div>

      <div className="space-y-4">
        <TodoInput placeholder="Add a task to inbox..." />

        <div className="border-t pt-4">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">
            Tasks
          </h3>
          <TodoList
            todos={todosArray.filter((t) => !t.completed)}
            showCompleted={false}
          />
        </div>

        {todosArray.filter((t) => t.completed).length > 0 && (
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">
              Completed
            </h3>
            <TodoList todos={todosArray.filter((t) => t.completed)} />
          </div>
        )}
      </div>
    </div>
  );
}
