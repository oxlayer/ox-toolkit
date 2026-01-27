import { useOfflineTodos } from '@/hooks/use-offline-data';
import { useIntentToggleTodo, useIntentDeleteTodo, useIntentUpdateTodo } from '@/hooks/use-intent-mutations';
import { useOfflineProjects } from '@/hooks/use-offline-data';
import { TodoItem } from '@/components/todos/TodoItem';
import { Button } from '@/components/ui/button';
import { isToday } from 'date-fns';
import { SlidersHorizontal, Plus } from 'lucide-react';

export function TodayView() {
  const { todos = [], isLoading: isLoadingTodos } = useOfflineTodos();
  const { projects = [], isLoading: isLoadingProjects } = useOfflineProjects();
  const toggleTodo = useIntentToggleTodo();
  const deleteTodo = useIntentDeleteTodo();
  const updateTodo = useIntentUpdateTodo();

  const isLoading = isLoadingTodos || isLoadingProjects;

  // Ensure todos is always an array
  const todosArray = Array.isArray(todos) ? todos : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const todayTodos = todosArray.filter((todo) => {
    // Show overdue too? usually yes for Today view or separate them.
    // The design just shows "Hoje".
    // Let's include today and overdue.
    if (!todo.dueDate) return false;
    const date = new Date(todo.dueDate);
    // basic check for today or overdue
    return isToday(date) || date < new Date();
  });

  // Helper to get project info
  const getProjectInfo = (projectId?: string) => {
    if (!projectId) return undefined;
    return projects.find(p => p.id === projectId);
  };

  return (
    <div className="max-w-4xl mx-auto p-8 pt-6">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">Hoje</h2>
        <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-900">
          <SlidersHorizontal className="w-4 h-4 mr-2" />
          Visualizar
        </Button>
      </div>

      <div className="space-y-8">

        {/* Meus projetos Section */}
        <div>
          <h3 className="text-sm font-bold text-gray-900 mb-4 ml-1">Meus projetos</h3>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 overflow-hidden">
            {todayTodos.length > 0 ? (
              todayTodos.map(todo => {
                const project = getProjectInfo(todo.projectId);
                return (
                  <TodoItem
                    key={todo.id}
                    todo={todo}
                    projectName={project?.name}
                    projectColor={project?.color}
                    onToggle={(todo) => toggleTodo.mutate(todo)}
                    onUpdate={(id, updates) => updateTodo.mutate({ id, updates })}
                    onDelete={(id) => deleteTodo.mutate(id)}
                  />
                );
              })
            ) : (
              <div className="p-8 text-center text-gray-400 text-sm">
                Nenhuma tarefa para hoje.
              </div>
            )}
            {/* Add Task Button inside the list */}
            <button className="w-full text-left px-4 py-3 text-red-500 hover:bg-gray-50 font-medium text-[15px] flex items-center gap-2 transition-colors">
              <Plus className="w-5 h-5" />
              Adicionar tarefa
            </button>
          </div>
        </div>

        {/* Team Section (Mock for visuals) */}
        <div>
          <h3 className="text-sm font-bold text-gray-900 mb-4 ml-1">Equipe</h3>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 overflow-hidden">
            {/* Mock Task */}
            <div className="todo-item group flex items-start gap-3 py-3 px-3 border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
              <div className="shrink-0 mt-0.5 rounded-full w-5 h-5 border-2 border-blue-500 cursor-pointer"></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-[15px] font-medium text-gray-700 leading-none">Planejar sessões de pesquisas do usuário</span>
                    <div className="mt-1 flex items-center gap-3 text-xs text-gray-500 font-medium">
                      <span className="flex items-center gap-1 text-green-600">
                        14h00
                      </span>
                      <span className="flex items-center gap-1">
                        Calendário
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500 whitespace-nowrap">
                    <span>Website Update</span>
                    <span style={{ color: '#8b5cf6' }}>#</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
