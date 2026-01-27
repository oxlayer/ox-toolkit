import { useState } from 'react';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import { Checkbox, Input, SyncStatusIndicator } from '@/components/ui';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Trash2 } from 'lucide-react';
import type { Todo } from '@/types';
import { cn } from '@/lib/utils';

interface TodoItemProps {
  todo: Todo;
  projectName?: string;
  projectColor?: string;
  onToggle: (todo: Todo) => void;
  onUpdate: (id: string, updates: Partial<Todo>) => void;
  onDelete: (id: string) => void;
}

export function TodoItem({ todo, projectName, projectColor, onToggle, onUpdate, onDelete }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);

  const handleSaveEdit = () => {
    if (editTitle.trim() && editTitle !== todo.title) {
      onUpdate(todo.id, { title: editTitle.trim() });
    }
    setIsEditing(false);
    setEditTitle(todo.title);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditTitle(todo.title);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);

    if (isToday(date)) {
      return 'Today';
    }

    if (isTomorrow(date)) {
      return 'Tomorrow';
    }

    if (isPast(date)) {
      return `Overdue · ${format(date, 'MMM d')}`;
    }

    return format(date, 'EEE, MMM d');
  };

  const isOverdue = todo.dueDate && isPast(new Date(todo.dueDate)) && !todo.completed;
  const syncStatus = todo.syncStatus || 'local';

  return (
    <div className={cn(
      'todo-item group flex items-start gap-3 py-3 border-b border-gray-100 hover:bg-gray-50/50 transition-colors',
      todo.completed && 'todo-item-completed opacity-60'
    )}>
      <Checkbox
        checked={todo.completed}
        onCheckedChange={(checked) => onToggle({ ...todo, completed: checked })}
        className="shrink-0 mt-0.5 rounded-full w-5 h-5 border-gray-300 data-[state=checked]:bg-gray-400 data-[state=checked]:border-gray-400"
      />

      <div className="flex-1 min-w-0 grid gap-1">
        {isEditing ? (
          <Input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleSaveEdit}
            onKeyDown={handleKeyDown}
            className="h-7 text-sm"
            autoFocus
          />
        ) : (
          <div className="flex items-start justify-between gap-4">
            <div className="grid gap-1">
              <span
                className={cn(
                  'text-[15px] font-medium text-gray-700 leading-none',
                  todo.completed && 'line-through text-gray-400',
                  isOverdue && 'text-red-500'
                )}
              >
                {todo.title}
              </span>

              {todo.description && (
                <span className="text-xs text-gray-500 truncate">
                  {todo.description}
                </span>
              )}

              <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
                {todo.dueDate && (
                  <span className={cn(
                    'flex items-center gap-1',
                    isOverdue ? 'text-red-500' : (isToday(new Date(todo.dueDate)) ? 'text-green-600' : 'text-gray-500')
                  )}>
                    <Calendar className="h-3 w-3" />
                    {formatDate(todo.dueDate)}
                  </span>
                )}
              </div>
            </div>

            {projectName && (
              <div className="flex items-center gap-1 text-xs text-gray-500 whitespace-nowrap">
                <span>{projectName}</span>
                <span style={{ color: projectColor || '#ccc' }}>#</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity self-start -mt-1">
        {/* Sync status indicator - always visible, even when not hovering */}
        <div className="opacity-50 group-hover:opacity-100 transition-opacity">
          <SyncStatusIndicator status={syncStatus} size="sm" />
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-gray-400 hover:text-gray-600"
          onClick={() => setIsEditing(!isEditing)}
        >
          <Clock className="h-3 w-3" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-gray-400 hover:text-red-500"
          onClick={() => onDelete(todo.id)}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
