import { useState } from 'react';
import { Plus, Trash2, Check, X, GripVertical } from 'lucide-react';
import { useOfflineProjects } from '@/hooks/use-offline-data';
import { useIntentCreateProject, useIntentDeleteProject } from '@/hooks/use-intent-mutations';
import { Button } from '@/components/ui/button';
import type { Project } from '@/types';

// Default color for new projects created from sidebar
const DEFAULT_PROJECT_COLOR = '#3b82f6'; // blue

interface ProjectsListProps {
  onProjectSelect?: (project: Project) => void;
  selectedProjectId?: string;
}

export function ProjectsList({ onProjectSelect, selectedProjectId }: ProjectsListProps) {
  const { projects, isLoading } = useOfflineProjects();
  const createProject = useIntentCreateProject();
  const deleteProject = useIntentDeleteProject();

  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  const handleCreate = async () => {
    if (!newProjectName.trim()) return;

    createProject.mutate(
      {
        name: newProjectName.trim(),
        color: DEFAULT_PROJECT_COLOR,
      },
      {
        onSuccess: () => {
          setNewProjectName('');
          setIsCreating(false);
        },
      }
    );
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this project? Todos will be moved to Inbox.')) {
      deleteProject.mutate(id);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreate();
    } else if (e.key === 'Escape') {
      setIsCreating(false);
      setNewProjectName('');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-1">
        <div className="h-8 bg-muted/50 rounded animate-pulse" />
        <div className="h-8 bg-muted/50 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {projects?.map((project) => {
        // Check for isInbox property (may not exist on ProjectEntity)
        if ('isInbox' in project && project.isInbox) return null; // Don't show Inbox in projects list

        const isSelected = selectedProjectId === project.id;

        return (
          <div
            key={project.id}
            className="group"
          >
            <div
              role="button"
              tabIndex={0}
              onClick={() => onProjectSelect?.(project as Project)}
              className={`sidebar-item w-full ${isSelected ? 'sidebar-item-active' : ''}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onProjectSelect?.(project as Project);
                }
              }}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground/50" />
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: project.color || '#6b7280' }}
              />
              <span className="flex-1 text-left truncate">{project.name}</span>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(project.id);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        );
      })}

      {/* Create new project - simplified with just name input */}
      {isCreating ? (
        <div className="flex items-center gap-2 px-2 py-1 mt-1">
          <div className="w-4 h-4" />
          <input
            type="text"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Project name..."
            className="flex-1 bg-transparent border-b border-primary outline-none text-sm"
            autoFocus
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleCreate}
          >
            <Check className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => {
              setIsCreating(false);
              setNewProjectName('');
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start mt-1 text-muted-foreground"
          onClick={() => setIsCreating(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add project
        </Button>
      )}
    </div>
  );
}
