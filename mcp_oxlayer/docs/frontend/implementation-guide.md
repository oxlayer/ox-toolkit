# OxLayer Frontend Implementation Guide

Complete guide to building OxLayer-compliant frontend applications using React, Tailwind CSS, React Query, and @oxlayer/capabilities-web-state for offline-first sync.

## Overview

This guide documents the frontend patterns used across OxLayer projects, including:

- **React Setup**: Component architecture with Radix UI primitives
- **Tailwind CSS**: v3/v4 with design tokens and dark mode
- **React Query**: Server state management with offline mutations
- **Capabilities-Web**: Intent-first sync engine with SQLite WASM
- **State Management**: Legend State observables for local state
- **API Patterns**: Type-safe client with auth integration

## Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19 | UI framework |
| TypeScript | 5.7+ | Type safety |
| Tailwind CSS | 3.4-4.0 | Styling |
| Radix UI | latest | Unstyled component primitives |
| React Query | 5.x | Server state management |
| @tanstack/react-query | 5.x | Data fetching and caching |
| @oxlayer/capabilities-web-state | latest | Offline-first sync engine |
| Legend State | latest | Reactive state management |
| date-fns | latest | Date utilities |
| Lucide React | latest | Icons |

## Project Structure

```
src/
├── components/
│   ├── ui/              # Reusable UI components (Button, Input, etc.)
│   ├── layout/          # Layout components (MainLayout, Sidebar)
│   └── [feature]/       # Feature-specific components
├── lib/
│   ├── api/             # API client and endpoints
│   ├── auth/            # Authentication utilities
│   ├── sync/            # Sync engine integration
│   ├── storage/         # Storage abstraction
│   └── utils.ts         # Utility functions (cn, formatters)
├── hooks/
│   ├── use-offline-*    # Offline mutation hooks
│   └── use-[feature].ts # Feature-specific hooks
├── views/               # Main view components
├── types/               # TypeScript definitions
└── main.tsx             # Application entry point
```

## 1. Component Patterns

### 1.1 Utility Function: `cn()`

All components use the `cn()` utility for merging Tailwind classes with proper precedence.

```typescript
// src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

**Usage:**
```tsx
import { cn } from '@/lib/utils';

<div className={cn(
  "base-class",
  condition && "conditional-class",
  className // props override defaults
)} />
```

### 1.2 Component Pattern with Variants

Use `class-variance-authority` (CVA) for component variants:

```tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // Base classes - always applied
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 outline-none",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive: "bg-destructive text-white shadow-xs hover:bg-destructive/90",
        outline: "border bg-background shadow-xs hover:bg-accent",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3",
        lg: "h-10 rounded-md px-6",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

interface ButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      data-slot="button" // For data-slot identification
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
```

**Usage:**
```tsx
<Button variant="destructive" size="sm">Delete</Button>
<Button variant="outline" size="icon"><Icon /></Button>
```

### 1.3 Component Composition Pattern

Feature components compose UI components with business logic:

```tsx
// src/components/todos/TodoItem.tsx
import { useState } from 'react';
import { Checkbox, Input } from '@/components/ui';
import { Button } from '@/components/ui/button';
import { Calendar, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Todo } from '@/types';

interface TodoItemProps {
  todo: Todo;
  projectName?: string;
  projectColor?: string;
  onToggle: (todo: Todo) => void;
  onUpdate: (id: string, updates: Partial<Todo>) => void;
  onDelete: (id: string) => void;
}

export function TodoItem({ todo, projectName, onToggle, onUpdate, onDelete }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);

  const handleSaveEdit = () => {
    if (editTitle.trim() && editTitle !== todo.title) {
      onUpdate(todo.id, { title: editTitle.trim() });
    }
    setIsEditing(false);
  };

  return (
    <div className={cn(
      'group flex items-start gap-3 py-3 border-b hover:bg-gray-50/50',
      todo.completed && 'opacity-60'
    )}>
      <Checkbox
        checked={todo.completed}
        onCheckedChange={(checked) => onToggle({ ...todo, completed: checked })}
        className="shrink-0 mt-0.5"
      />

      <div className="flex-1 min-w-0">
        {isEditing ? (
          <Input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleSaveEdit}
            className="h-7 text-sm"
            autoFocus
          />
        ) : (
          <span className={cn(
            'text-[15px] font-medium',
            todo.completed && 'line-through'
          )}>
            {todo.title}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
        <Button variant="ghost" size="icon" onClick={() => setIsEditing(!isEditing)}>
          <Edit className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onDelete(todo.id)}>
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
```

### 1.4 Compound Components

For complex components, use the compound pattern:

```tsx
// src/components/ui/list.tsx
const List = React.forwardRef<HTMLUListElement, React.HTMLAttributes<HTMLUListElement>>(
  ({ className, ...props }, ref) => (
    <ul ref={ref} className={cn("space-y-1", className)} {...props} />
  )
);

const ListItem = React.forwardRef<HTMLLIElement, React.HTMLAttributes<HTMLLIElement>>(
  ({ className, ...props }, ref) => (
    <li ref={ref} className={cn("px-3 py-2", className)} {...props} />
  )
);

export { List, ListItem };
```

## 2. Tailwind CSS Configuration

### 2.1 Design Tokens with CSS Variables

```css
/* src/index.css */
:root {
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  --primary: 240 5.9% 10%;
  --primary-foreground: 0 0% 98%;
  --secondary: 240 4.8% 95.9%;
  --accent: 240 4.8% 95.9%;
  --destructive: 0 84.2% 60.2%;
  --border: 240 5.9% 90%;
  --radius: 0.5rem;
}

.dark {
  --background: 240 10% 3.9%;
  --foreground: 0 0% 98%;
  --primary: 0 0% 98%;
  --primary-foreground: 240 5.9% 10%;
}
```

### 2.2 Tailwind Config

```js
// tailwind.config.js
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        // ... more tokens
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
```

### 2.3 Dark Mode Implementation

```tsx
// src/components/theme-provider.tsx
const ThemeProvider = ({ children, defaultTheme = 'system' }) => {
  const [theme, setTheme] = useState(defaultTheme);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
};
```

## 3. API Patterns

### 3.1 Type-Safe API Client

```tsx
// src/lib/api/client.tsx
interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: HeadersInit;
  signal?: AbortSignal;
}

class ApiError extends Error {
  statusCode: number;
  data?: unknown;
  constructor(statusCode: number, message: string, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.data = data;
  }
}

let tokenProvider: (() => Promise<string | null>) | null = null;

export function setAuthTokenProvider(provider: (() => Promise<string | null>) | null) {
  tokenProvider = provider;
}

async function apiRequest<T>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {}, signal } = options;
  const token = tokenProvider ? await tokenProvider() : null;

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  };

  if (token) {
    requestHeaders['Authorization'] = `Bearer ${token}`;
  }

  const url = `${import.meta.env.VITE_PUBLIC_API_BASE_URL}/api${endpoint}`;

  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });

  if (response.status === 204) return undefined as T;

  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(response.status, data.message || data.error || 'An error occurred', data);
  }

  return data;
}

export const api = {
  get: <T,>(endpoint: string, options?: Omit<ApiRequestOptions, 'method'>) =>
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),
  post: <T,>(endpoint: string, body: unknown, options?: Omit<ApiRequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(endpoint, { ...options, method: 'POST', body }),
  patch: <T,>(endpoint: string, body: unknown, options?: Omit<ApiRequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(endpoint, { ...options, method: 'PATCH', body }),
  delete: <T,>(endpoint: string, options?: Omit<ApiRequestOptions, 'method'>) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),
};
```

### 3.2 API Endpoint Modules

```tsx
// src/lib/api/todos.ts
import { api } from './client';
import type { Todo, CreateTodoInput, UpdateTodoInput, TodoFilter } from '@/types';

export const todoQueryKeys = {
  all: ['todos'] as const,
  lists: () => [...todoQueryKeys.all, 'list'] as const,
  list: (filter?: TodoFilter) => [...todoQueryKeys.lists(), filter] as const,
  detail: (id: string) => [...todoQueryKeys.all, id] as const,
};

export const todosApi = {
  getAll: (filter?: TodoFilter) => api.get<Todo[]>('/todos', { params: filter }),
  get: (id: string) => api.get<Todo>(`/todos/${id}`),
  create: (input: CreateTodoInput) => api.post<Todo>('/todos', input),
  update: (id: string, input: UpdateTodoInput) => api.patch<Todo>(`/todos/${id}`, input),
  delete: (id: string) => api.delete(`/todos/${id}`),
};
```

### 3.3 API Provider for Auth Integration

```tsx
// src/lib/api/client.tsx (continued)
import { useAuth } from '@/lib/auth';

export function ApiProvider({ children }: { children: ReactNode }) {
  const { getAuthToken } = useAuth();
  const getAuthTokenRef = useRef(getAuthToken);

  // Keep ref updated without triggering effect
  getAuthTokenRef.current = getAuthToken;

  useEffect(() => {
    const tokenProvider = async () => await getAuthTokenRef.current();
    setAuthTokenProvider(tokenProvider);
    return () => setAuthTokenProvider(null);
  }, []);

  return <>{children}</>;
}

// Wrap app with provider
<ApiProvider>
  <App />
</ApiProvider>
```

## 4. React Query Patterns

### 4.1 Query Client Setup

```tsx
// src/main.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);
```

### 4.2 Data Fetching Hooks

```tsx
// src/hooks/use-todos.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { todosApi, todoQueryKeys } from '@/lib/api/todos';
import type { TodoFilter } from '@/types';

export function useTodos(filter?: TodoFilter) {
  return useQuery({
    queryKey: todoQueryKeys.list(filter),
    queryFn: () => todosApi.getAll(filter),
  });
}

export function useTodo(id: string) {
  return useQuery({
    queryKey: todoQueryKeys.detail(id),
    queryFn: () => todosApi.get(id),
    enabled: !!id,
  });
}
```

### 4.3 Mutation Hooks with Optimistic Updates

```tsx
// src/hooks/use-todo-mutations.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { todosApi, todoQueryKeys } from '@/lib/api/todos';
import type { Todo, CreateTodoInput, UpdateTodoInput } from '@/types';

export function useCreateTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTodoInput) => todosApi.create(input),
    onSuccess: (newTodo) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: todoQueryKeys.lists() });

      // Or optimistically update
      queryClient.setQueryData(
        todoQueryKeys.lists(),
        (old: Todo[] = []) => [...old, newTodo]
      );
    },
  });
}

export function useUpdateTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateTodoInput }) =>
      todosApi.update(id, updates),
    onMutate: async ({ id, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: todoQueryKeys.detail(id) });

      // Snapshot previous value
      const previousTodo = queryClient.getQueryData<Todo>(todoQueryKeys.detail(id));

      // Optimistically update
      queryClient.setQueryData<Todo>(
        todoQueryKeys.detail(id),
        (old) => ({ ...old, ...updates })
      );

      return { previousTodo };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      queryClient.setQueryData(
        todoQueryKeys.detail(variables.id),
        context?.previousTodo
      );
    },
  });
}

export function useDeleteTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => todosApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: todoQueryKeys.lists() });
    },
  });
}
```

## 5. Offline-First with Capabilities-Web

### 5.1 Sync Engine Setup

```tsx
// src/lib/sync/api-adapters.ts
import {
  registerApiAdapter,
  unregisterApiAdapter,
  type ApiAdapter,
} from '@oxlayer/capabilities-web-state';
import { todosApi } from '@/lib/api/todos';
import type { CreateTodoInput, UpdateTodoInput } from '@/types';

const todoTaskAdapter: ApiAdapter = {
  create: async (payload) => {
    const result = await todosApi.create(payload as CreateTodoInput);
    return { id: result.id, data: result };
  },
  update: async (id, payload) => {
    const result = await todosApi.update(id, payload as UpdateTodoInput);
    return { data: result };
  },
  delete: async (id) => {
    await todosApi.delete(id);
  },
};

export function registerTodoApiAdapters() {
  registerApiAdapter('todo', 'task', todoTaskAdapter);
}
```

### 5.2 Offline Mutation Hooks

```tsx
// src/hooks/use-offline-mutations.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { useWorkspace } from '@/lib/workspace';
import { todosApi, todoQueryKeys } from '@/lib/api/todos';
import type { Todo, CreateTodoInput, UpdateTodoInput } from '@/types';

function getWorkspaceData(workspaceId: string) {
  const dataKey = `workspace_${workspaceId}`;
  const dataStr = localStorage.getItem(dataKey);
  return dataStr ? JSON.parse(dataStr) : { todos: [], projects: [] };
}

function saveWorkspaceData(workspaceId: string, data: unknown) {
  localStorage.setItem(`workspace_${workspaceId}`, JSON.stringify(data));
}

function generateLocalId(prefix: string): string {
  return `local_${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

export function useOfflineCreateTodo() {
  const { isAuthenticated } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateTodoInput) => {
      if (isAuthenticated && currentWorkspace?.isServer) {
        // Server: Use API
        return await todosApi.create(input);
      } else {
        // Local: Update localStorage
        const workspaceId = currentWorkspace?.id || 'default';
        const data = getWorkspaceData(workspaceId);

        const newTodo: Todo = {
          id: generateLocalId('todo'),
          title: input.title,
          completed: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          workspaceId,
          isLocalOnly: true,
          syncStatus: 'local',
        };

        data.todos.push(newTodo);
        saveWorkspaceData(workspaceId, data);

        return newTodo;
      }
    },
    onSuccess: () => {
      if (isAuthenticated) {
        queryClient.invalidateQueries({ queryKey: todoQueryKeys.lists() });
      }
    },
  });
}
```

### 5.3 Sync Status Indicator Component

```tsx
// src/components/ui/sync-status-indicator.tsx
import { Loader2, Check, AlertCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

type SyncStatus = 'local' | 'queued' | 'sending' | 'acknowledged' | 'confirmed' | 'failed';

interface SyncStatusIndicatorProps {
  status: SyncStatus;
  size?: 'sm' | 'md';
}

const statusIcons = {
  local: Clock,
  queued: Clock,
  sending: Loader2,
  acknowledged: Check,
  confirmed: Check,
  failed: AlertCircle,
};

const statusColors = {
  local: 'text-gray-400',
  queued: 'text-yellow-500',
  sending: 'text-blue-500 animate-spin',
  acknowledged: 'text-green-500',
  confirmed: 'text-green-600',
  failed: 'text-red-500',
};

export function SyncStatusIndicator({ status, size = 'md' }: SyncStatusIndicatorProps) {
  const Icon = statusIcons[status];

  return (
    <div className={cn(
      "flex items-center justify-center",
      statusColors[status],
      size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'
    )}>
      <Icon className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />
    </div>
  );
}
```

## 6. Layout Patterns

### 6.1 Main Layout Component

```tsx
// src/components/layout/MainLayout.tsx
import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { PanelLeft, ChevronRight, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  renderContent: (view: string, project: { id: string } | null) => React.ReactNode;
}

const VIEW_TITLES: Record<string, string> = {
  inbox: 'Entrada',
  today: 'Hoje',
  upcoming: 'Em breve',
  settings: 'Configurações',
};

function getBreadcrumb(view: string, project: { id: string } | null) {
  const crumbs = [
    { label: 'My Projects', icon: <Home className="h-4 w-4" /> },
  ];

  if (project) {
    crumbs.push({ label: 'Project' });
  } else if (VIEW_TITLES[view]) {
    crumbs.push({ label: VIEW_TITLES[view] });
  }

  return crumbs;
}

export function MainLayout({ renderContent }: MainLayoutProps) {
  const [currentView, setCurrentView] = useState('inbox');
  const [currentProject, setCurrentProject] = useState<{ id: string } | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleViewChange = (view: string, project?: { id: string } | null) => {
    setCurrentView(view);
    setCurrentProject(project ?? null);
    setMobileSidebarOpen(false);
  };

  const breadcrumb = getBreadcrumb(currentView, currentProject);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "inset-y-0 left-0 z-50 transition-all duration-300",
          "fixed lg:relative",
          !mobileSidebarOpen && "-translate-x-full lg:translate-x-0",
          mobileSidebarOpen && "translate-x-0",
          sidebarCollapsed && "lg:-translate-x-full lg:fixed"
        )}
      >
        <Sidebar
          currentView={currentView}
          onViewChange={handleViewChange}
          sidebarCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </aside>

      {/* Main content */}
      <main className={cn(
        "flex-1 flex flex-col min-w-0 w-full transition-all duration-300",
        !sidebarCollapsed && "lg:ml-[280px]"
      )}>
        {/* Header */}
        <header className="flex items-center gap-3 px-4 py-3 border-b">
          {sidebarCollapsed && (
            <Button variant="ghost" size="icon" onClick={() => setSidebarCollapsed(false)}>
              <PanelLeft className="h-5 w-5" />
            </Button>
          )}
          <nav className="flex items-center gap-2 text-sm">
            {breadcrumb.map((crumb, index) => (
              <div key={index} className="flex items-center gap-2">
                {index > 0 && <ChevronRight className="h-4 w-4 text-gray-400" />}
                <span className={cn(
                  "flex items-center gap-1.5",
                  index === breadcrumb.length - 1 && "font-medium"
                )}>
                  {crumb.icon}
                  {crumb.label}
                </span>
              </div>
            ))}
          </nav>
        </header>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto">
          {renderContent(currentView, currentProject)}
        </div>
      </main>
    </div>
  );
}
```

## 7. TypeScript Patterns

### 7.1 Type Exports

```typescript
// src/types/todos.ts
export interface Todo {
  id: string;
  title: string;
  description?: string | null;
  completed: boolean;
  priority: number;
  dueDate?: string | null;
  createdAt: string;
  updatedAt: string;
  workspaceId: string;
  projectId?: string | null;
  sectionId?: string | null;
  syncStatus?: 'local' | 'queued' | 'sending' | 'acknowledged' | 'confirmed' | 'failed';
}

export interface CreateTodoInput {
  title: string;
  description?: string;
  priority?: number;
  dueDate?: string;
  projectId?: string;
  sectionId?: string;
}

export interface UpdateTodoInput {
  title?: string;
  description?: string;
  completed?: boolean;
  priority?: number;
  dueDate?: string;
  projectId?: string;
  sectionId?: string;
}

export interface TodoFilter {
  completed?: boolean;
  projectId?: string;
  sectionId?: string;
  dueDate?: string;
}
```

### 7.2 Component Props Pattern

```tsx
import type { ComponentProps } from 'react';

// Extend native element props
interface ButtonProps extends ComponentProps<'button'> {
  variant?: 'default' | 'destructive' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

// Or use pattern with forwardRef
type ButtonProps = React.ComponentProps<'button'> & {
  variant?: 'default' | 'destructive';
};
```

## 8. Best Practices

### 8.1 Component Guidelines

1. **Use `forwardRef` for UI components** to enable ref passing
2. **Use `data-slot` attribute** for component identification
3. **Always include `className` prop** for customization
4. **Spread native props** with `...props` after defining specific props
5. **Use `cn()` utility** for all class merging

### 8.2 State Management Guidelines

1. **Server State**: Use React Query for API data
2. **Local State**: Use `useState` for component-local state
3. **Global State**: Use React Context for auth, theme, workspace
4. **Offline State**: Use capabilities-web state management
5. **Form State**: Use React Hook Form or controlled inputs

### 8.3 Performance Guidelines

1. **Use `React.memo`** for components that re-render unnecessarily
2. **Debounce search inputs** to reduce API calls
3. **Use `useCallback` and `useMemo`** for expensive computations
4. **Virtualize long lists** with react-window or similar
5. **Code split routes** for faster initial load

### 8.4 Error Handling

```tsx
// Error boundaries
class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}

// Query error handling
const { data, error, isLoading } = useTodos();
if (error) return <ErrorMessage error={error} />;
```

## 9. Complete Example: Todo App Component

```tsx
// src/views/inbox-view.tsx
import { useTodos, useCreateTodo, useUpdateTodo, useDeleteTodo } from '@/hooks/use-todo-mutations';
import { TodoItem } from '@/components/todos/TodoItem';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus } from 'lucide-react';
import { useState } from 'react';

export function InboxView() {
  const [newTitle, setNewTitle] = useState('');
  const { data: todos = [], isLoading } = useTodos({ completed: false });
  const createTodo = useCreateTodo();
  const updateTodo = useUpdateTodo();
  const deleteTodo = useDeleteTodo();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTitle.trim()) {
      createTodo.mutate({ title: newTitle.trim() });
      setNewTitle('');
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto p-4">
      <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
        <Checkbox checked={false} disabled className="mt-1" />
        <Input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add a task..."
          className="flex-1"
        />
        <Button type="submit" size="icon" disabled={!newTitle.trim()}>
          <Plus className="h-4 w-4" />
        </Button>
      </form>

      <div className="space-y-1">
        {todos.map((todo) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            onToggle={(t) => updateTodo.mutate({ id: t.id, updates: { completed: t.completed } })}
            onUpdate={(id, updates) => updateTodo.mutate({ id, updates })}
            onDelete={(id) => deleteTodo.mutate(id)}
          />
        ))}
      </div>
    </div>
  );
}
```

## 10. Dependencies Reference

```json
{
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@tanstack/react-query": "^5.0.0",
    "@oxlayer/capabilities-web-state": "latest",
    "@legendapp/state": "latest",
    "tailwindcss": "4.1.18",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0",
    "class-variance-authority": "^0.7.0",
    "@radix-ui/react-slot": "^1.0.0",
    "date-fns": "^3.0.0",
    "lucide-react": "0.562.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "typescript": "^5.7.0",
    "vite": "^5.0.0",
    "tailwindcss": "4.1.18"
  }
}
```

## See Also

- [Frontend Guide](./frontend-guide.md) - Component-specific patterns
- [Web Capabilities Guide](./web-capabilities-guide.md) - Sync engine documentation
- [Backend DDD Pattern](../backend/oxlayer-ddd-pattern.md) - Backend architecture
