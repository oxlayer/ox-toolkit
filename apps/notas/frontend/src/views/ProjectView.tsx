import { useState } from 'react';
import { useOfflineProject } from '@/hooks/use-offline-data';
import { useOfflineTodos } from '@/hooks/use-offline-data';
import { useIntentUpdateProject } from '@/hooks/use-intent-mutations';
import { TodoList } from '@/components/todos/TodoList';
import { TodoInput } from '@/components/todos/TodoInput';
import { SectionsList } from '@/components/projects/SectionsList';
import { Button } from '@/components/ui/button';
import { ArrowLeft, UserPlus, SlidersHorizontal, MessageSquare, MoreHorizontal } from 'lucide-react';

const PROJECT_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
];

interface ProjectViewProps {
  projectId: string;
  sectionId?: string;
  onBack: () => void;
}

export function ProjectView({ projectId, sectionId, onBack }: ProjectViewProps) {
  const { project, isLoading: projectLoading } = useOfflineProject(projectId);
  const { todos, isLoading: todosLoading } = useOfflineTodos();
  const updateProject = useIntentUpdateProject();

  // Filter todos by project/section
  const filteredTodos = todos.filter(todo => {
    if (sectionId) {
      return todo.sectionId === sectionId;
    }
    return todo.projectId === projectId;
  });

  const [showCompleted, setShowCompleted] = useState(true);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const handleColorChange = (color: string) => {
    if (!project) return;
    updateProject.mutate({
      id: project.id,
      updates: { color },
    });
    setShowColorPicker(false);
  };

  if (projectLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading project...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-muted-foreground mb-4">Project not found</p>
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go back
        </Button>
      </div>
    );
  }

  const todosArray = Array.isArray(filteredTodos) ? filteredTodos : [];
  const completedCount = todosArray.filter((t) => t.completed).length;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      {/* Project header */}
      <div className="px-10 py-8 pb-2">
        {/* Breadcrumb / Top Actions */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <span className="hover:underline cursor-pointer">My Projects</span>
            <span>/</span>
          </div>

          <div className="flex items-center gap-2 text-gray-400">
            <Button variant="ghost" size="sm" className="text-gray-500 font-normal hover:bg-gray-100 flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              Share
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-500 font-normal hover:bg-gray-100 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4" />
              View
            </Button>
            <Button variant="ghost" size="icon" className="w-8 h-8 hover:bg-gray-100">
              <MessageSquare className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="w-8 h-8 hover:bg-gray-100">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Color indicator */}
          <div className="relative flex">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="w-6 h-6 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform"
              style={{ backgroundColor: project.color || '#6b7280' }}
              title="Change project color"
            />
            {showColorPicker && (
              <div className="absolute top-8 left-0 bg-white rounded-lg shadow-lg border p-2 flex gap-2 z-10">
                {PROJECT_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => handleColorChange(color)}
                    className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${project.color === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                      }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="flex-1">
            <h1 className="text-xl font-bold tracking-tight text-gray-900">{project.name}</h1>
          </div>
        </div>

        {/* Sections navigation */}
        {!sectionId && (
          <div className="mt-4">
            <SectionsList
              projectId={projectId}
              selectedSectionId={sectionId}
            />
          </div>
        )}
      </div>

      {/* Todos list */}
      <div className="flex-1 overflow-y-auto px-10">
        <div className="max-w-4xl mx-auto">
          {/* Add new todo */}
          <div className="mb-6">
            <TodoInput
              projectId={projectId}
              sectionId={sectionId}
              placeholder="Add a task..."
            />
          </div>

          {/* Todo list */}
          {todosLoading ? (
            <div className="space-y-2">
              <div className="h-10 bg-gray-50 rounded animate-pulse" />
              <div className="h-10 bg-gray-50 rounded animate-pulse" />
            </div>
          ) : todosArray.length > 0 ? (
            <>
              <TodoList
                todos={todosArray}
                showCompleted={showCompleted}
              />

              {/* Show completed toggle */}
              {completedCount > 0 && (
                <div className="mt-6 flex justify-start">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCompleted(!showCompleted)}
                    className="text-muted-foreground text-xs font-normal"
                  >
                    {showCompleted ? 'Hide' : 'Show'} completed ({completedCount})
                  </Button>
                </div>
              )}
            </>
          ) : (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-20 text-center">
              {/* <img src="/empty-state.png" alt="Empty Project" className="w-64 mb-6 opacity-90" /> */}
              <h3 className="text-gray-900 font-semibold mb-2">Start small (or dream big)...</h3>
              <p className="text-gray-500 text-sm max-w-xs">
                Track tasks, follow progress, and discuss details in one central, shared project.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
