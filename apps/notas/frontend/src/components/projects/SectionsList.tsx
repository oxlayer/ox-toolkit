import { useState } from 'react';
import { Plus, Trash2, Check, X, GripVertical } from 'lucide-react';
import { useSections } from '@/hooks/use-projects';
import { useCreateSection, useUpdateSection, useDeleteSection } from '@/hooks/use-projects';
import { Button } from '@/components/ui/button';
import type { Section } from '@/types';

interface SectionsListProps {
  projectId: string;
  onSectionSelect?: (section: Section) => void;
  selectedSectionId?: string;
}

export function SectionsList({ projectId, onSectionSelect, selectedSectionId }: SectionsListProps) {
  const { data: sections, isLoading } = useSections(projectId);
  const createSection = useCreateSection();
  const updateSection = useUpdateSection();
  const deleteSection = useDeleteSection();

  const [isCreating, setIsCreating] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleCreate = async () => {
    console.log('[SectionsList] handleCreate called', { newSectionName, projectId });
    if (!newSectionName.trim()) return;

    createSection.mutate(
      {
        projectId,
        name: newSectionName.trim(),
      },
      {
        onSuccess: (data) => {
          console.log('[SectionsList] Section created successfully', data);
          setNewSectionName('');
          setIsCreating(false);
        },
        onError: (error) => {
          console.error('[SectionsList] Failed to create section:', error);
          alert('Failed to create section: ' + (error as Error).message);
          setIsCreating(false);
        },
      }
    );
  };

  const handleStartEdit = (section: Section) => {
    setEditingId(section.id);
    setEditName(section.name);
  };

  const handleSaveEdit = (id: string) => {
    if (!editName.trim()) return;

    updateSection.mutate(
      {
        id,
        input: {
          name: editName.trim(),
        },
      },
      {
        onSuccess: () => {
          setEditingId(null);
          setEditName('');
        },
      }
    );
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this section? Todos will be moved to the main project view.')) {
      deleteSection.mutate({ id, projectId });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') {
      action();
    } else if (e.key === 'Escape') {
      if (isCreating) {
        setIsCreating(false);
        setNewSectionName('');
      } else {
        handleCancelEdit();
      }
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-1 ml-4">
        <div className="h-7 bg-muted/50 rounded animate-pulse" />
        <div className="h-7 bg-muted/50 rounded animate-pulse" />
      </div>
    );
  }

  if (!sections || sections.length === 0) {
    return (
      <div className="ml-4">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground"
          onClick={() => setIsCreating(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add section
        </Button>
      </div>
    );
  }

  return (
    <div className="ml-4 space-y-1">
      {sections.map((section) => {
        const isEditing = editingId === section.id;
        const isSelected = selectedSectionId === section.id;

        return (
          <div key={section.id} className="group">
            {isEditing ? (
              <div className="flex items-center gap-2 px-2 py-1">
                <GripVertical className="h-4 w-4 text-muted-foreground/50" />
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, () => handleSaveEdit(section.id))}
                  className="flex-1 bg-transparent border-b border-primary outline-none text-sm"
                  autoFocus
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleSaveEdit(section.id)}
                >
                  <Check className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={handleCancelEdit}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <button
                onClick={() => onSectionSelect?.(section)}
                className={`sidebar-item w-full text-sm ${isSelected ? 'sidebar-item-active' : ''}`}
                onDoubleClick={() => handleStartEdit(section)}
              >
                <GripVertical className="h-4 w-4 text-muted-foreground/50" />
                <span className="w-2 h-2 rounded-full bg-muted-foreground/30 shrink-0" />
                <span className="flex-1 text-left truncate">{section.name}</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartEdit(section);
                    }}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(section.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </button>
            )}
          </div>
        );
      })}

      {/* Create new section */}
      {isCreating ? (
        <div className="flex items-center gap-2 px-2 py-1 mt-1">
          <div className="w-4 h-4" />
          <input
            type="text"
            value={newSectionName}
            onChange={(e) => setNewSectionName(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, handleCreate)}
            placeholder="Section name..."
            className="flex-1 bg-transparent border-b border-primary outline-none text-sm"
            autoFocus
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleCreate}
            disabled={createSection.isPending}
          >
            <Check className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => {
              setIsCreating(false);
              setNewSectionName('');
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground text-sm"
          onClick={() => setIsCreating(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add section
        </Button>
      )}
    </div>
  );
}
