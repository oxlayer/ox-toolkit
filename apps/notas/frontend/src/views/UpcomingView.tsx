import { useOfflineTodos } from '@/hooks/use-offline-data';
import { TodoList } from '@/components/todos';
import { format, isToday, isTomorrow, isThisWeek, parseISO, addWeeks, startOfWeek, endOfWeek } from 'date-fns';
import { useState } from 'react';

export function UpcomingView() {
  const { todos = [], isLoading } = useOfflineTodos();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['today']));

  // Ensure todos is always an array
  const todosArray = Array.isArray(todos) ? todos : [];

  // Helper to check if date is in next week
  const isNextWeek = (date: Date) => {
    const now = new Date();
    const nextWeekStart = addWeeks(startOfWeek(now, { weekStartsOn: 0 }), 1);
    const nextWeekEnd = endOfWeek(nextWeekStart, { weekStartsOn: 0 });
    return date >= nextWeekStart && date <= nextWeekEnd;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  // Group todos by date
  const groupedTodos: Record<string, typeof todosArray> = {};

  todosArray.forEach((todo) => {
    if (!todo.dueDate || todo.completed) return;

    const date = parseISO(todo.dueDate);

    let section: string;
    if (isToday(date)) {
      section = 'today';
    } else if (isTomorrow(date)) {
      section = 'tomorrow';
    } else if (isThisWeek(date)) {
      section = 'thisWeek';
    } else if (isNextWeek(date)) {
      section = 'nextWeek';
    } else {
      section = 'later';
    }

    if (!groupedTodos[section]) {
      groupedTodos[section] = [];
    }
    groupedTodos[section].push(todo);
  });

  const sectionConfig = [
    { id: 'today', label: 'Today', showDate: () => format(new Date(), 'EEE, MMM d') },
    { id: 'tomorrow', label: 'Tomorrow', showDate: () => format(new Date(Date.now() + 86400000), 'EEE, MMM d') },
    { id: 'thisWeek', label: 'This Week', showDate: () => {
      const endOfWeek = new Date();
      endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()));
      return `Until ${format(endOfWeek, 'MMM d')}`;
    }},
    { id: 'nextWeek', label: 'Next Week', showDate: () => {
      const startOfNextWeek = new Date();
      startOfNextWeek.setDate(startOfNextWeek.getDate() + (7 - startOfNextWeek.getDay() + 1));
      const endOfNextWeek = new Date(startOfNextWeek);
      endOfNextWeek.setDate(endOfNextWeek.getDate() + 6);
      return `${format(startOfNextWeek, 'MMM d')} - ${format(endOfNextWeek, 'MMM d')}`;
    }},
    { id: 'later', label: 'Later', showDate: () => '' },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Upcoming</h2>
        <p className="text-muted-foreground">
          Plan ahead and see what's coming
        </p>
      </div>

      <div className="space-y-4">
        {sectionConfig.map((section) => {
          const todos = groupedTodos[section.id] || [];
          if (todos.length === 0 && section.id === 'later') return null;

          const isExpanded = expandedSections.has(section.id);

          return (
            <div key={section.id} className="border rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium">{section.label}</span>
                  {section.showDate() && (
                    <span className="text-sm text-muted-foreground">
                      {section.showDate()}
                    </span>
                  )}
                  {todos.length > 0 && (
                    <span className="text-xs bg-muted-foreground/20 px-2 py-0.5 rounded-full">
                      {todos.length}
                    </span>
                  )}
                </div>
                <svg
                  className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isExpanded && todos.length > 0 && (
                <div className="p-2">
                  <TodoList todos={todos} showCompleted={false} />
                </div>
              )}

              {isExpanded && todos.length === 0 && section.id !== 'later' && (
                <div className="p-8 text-center text-muted-foreground">
                  No tasks scheduled
                </div>
              )}
            </div>
          );
        })}

        {Object.keys(groupedTodos).length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No upcoming tasks</p>
            <p className="text-sm mt-1">Add due dates to your tasks to see them here</p>
          </div>
        )}
      </div>
    </div>
  );
}
