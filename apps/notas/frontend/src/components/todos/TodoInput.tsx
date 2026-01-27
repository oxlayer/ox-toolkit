import { useState, useRef } from 'react';
import { Plus, Calendar, Flag, Clock, MoreHorizontal, AlertCircle, Mic, Lock } from 'lucide-react';

import { useIntentCreateTodo } from '@/hooks/use-intent-mutations';
import { useWorkspace } from '@/lib/workspace';
import { useAuth, useAuthRequired } from '@/lib/auth';
import { useVoiceInput } from '@/lib/voice/speech-recognition';
import type { Priority, CreateTodoInput } from '@/types';
import { cn } from '@/lib/utils';


interface TodoInputProps {
  projectId?: string;
  sectionId?: string;
  placeholder?: string;
  defaultExpanded?: boolean;
}

export function TodoInput({ projectId, sectionId, placeholder = 'Nome da tarefa', defaultExpanded = false }: TodoInputProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState<string>('');
  const [priority, setPriority] = useState<Priority>(4);
  const inputRef = useRef<HTMLInputElement>(null);

  const createTodo = useIntentCreateTodo();
  const { currentWorkspace } = useWorkspace();
  const { isAuthenticated } = useAuth();
  const { requireAuth } = useAuthRequired();

  // Voice input integration with auth check
  const handleVoiceCommand = (parsed: any) => {
    if (parsed.command.type === 'create' && parsed.command.todo) {
      const todoInput: CreateTodoInput = {
        ...parsed.command.todo,
        projectId,
        sectionId,
      };

      createTodo.mutate(todoInput);
    }
  };

  const voice = useVoiceInput({
    onCommand: handleVoiceCommand,
  });

  const handleVoiceButtonClick = () => {
    if (!isAuthenticated) {
      requireAuth('voice');
      return;
    }
    if (voice.isListening) {
      voice.stop();
    } else {
      voice.start();
    }
  };

  const handleSubmit = () => {
    console.log('[TodoInput] handleSubmit called', { title, description, dueDate, priority, projectId, sectionId });
    if (!title.trim()) return;

    const todoInput: CreateTodoInput = {
      title: title.trim(),
      description: description.trim() || undefined,
      dueDate: dueDate || undefined,
      priority,
      projectId,
      sectionId,
    };

    console.log('[TodoInput] Calling createTodo.mutate with:', todoInput);
    createTodo.mutate(todoInput, {
      onSuccess: (data) => {
        console.log('[TodoInput] createTodo onSuccess', data);
        // Reset form but keep expanded if needed, or close? Usually keeps open for rapid entry
        setTitle('');
        setDescription('');
        setDueDate('');
        setPriority(4);
        inputRef.current?.focus();
      },
      onError: (error) => {
        console.error('[TodoInput] createTodo onError', error);
      },
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleCancel = () => {
    setIsExpanded(false);
    setTitle('');
    setDescription('');
    setDueDate('');
    setPriority(4);
  };

  if (!isExpanded) {
    return (
      <button
        onClick={() => {
          if (currentWorkspace) {
            setIsExpanded(true);
          }
        }}
        disabled={!currentWorkspace}
        className={cn(
          "group flex items-center gap-2 font-medium px-2 py-1 transition-colors w-full text-left",
          currentWorkspace
            ? "text-gray-500 hover:text-red-500"
            : "text-gray-400 cursor-not-allowed"
        )}
      >
        <div className={cn(
          "flex items-center justify-center p-1 rounded-full",
          currentWorkspace
            ? "text-red-500 group-hover:bg-red-50"
            : "text-gray-400"
        )}>
          <Plus className="h-5 w-5" />
        </div>
        <span className="text-[15px]">
          {currentWorkspace ? 'Adicionar tarefa' : 'Crie um workspace primeiro'}
        </span>
      </button>
    );
  }

  // Get today's date in YYYY-MM-DD format for min attribute
  const today = new Date().toISOString().split('T')[0];

  // Show workspace required message if no workspace
  if (!currentWorkspace) {
    return (
      <div className="border border-dashed border-gray-300 rounded-[10px] bg-gray-50 p-6 text-center">
        <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-3" />
        <p className="text-sm text-gray-600 mb-1">Nenhum workspace selecionado</p>
        <p className="text-xs text-gray-500">Crie um workspace para começar a adicionar tarefas</p>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-[10px] shadow-sm bg-white overflow-hidden">
      <div className="p-3">
        <input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full text-[15px] font-medium placeholder:text-gray-400 border-none outline-none bg-transparent"
          autoFocus
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descrição"
          className="w-full text-[13px] text-gray-600 placeholder:text-gray-400 border-none outline-none bg-transparent mt-2 resize-none h-auto min-h-[40px]"
          rows={2}
        />

        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <button className="flex items-center gap-1.5 px-2 py-1 rounded border border-gray-200 text-gray-500 text-[13px] hover:bg-gray-50 transition-colors">
            <Calendar className="w-3.5 h-3.5" />
            {dueDate ? new Date(dueDate).toLocaleDateString() : 'Data de vencimento'}
            {/* Hidden date input trigger hack */}
            <input
              type="date"
              className="absolute opacity-0 w-8 h-8 cursor-pointer"
              onChange={(e) => setDueDate(e.target.value)}
              min={today}
            />
          </button>

          <div className="relative">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded border border-gray-200 text-gray-500 text-[13px] hover:bg-gray-50 transition-colors cursor-pointer">
              <Flag className={cn("w-3.5 h-3.5", priority === 1 ? "fill-red-500 text-red-500" : "")} />
              <select
                value={priority.toString()}
                onChange={(e) => setPriority(Number(e.target.value) as Priority)}
                className="border-none p-0 h-auto text-[13px] text-gray-500 bg-transparent shadow-none focus-visible:ring-0 w-auto cursor-pointer"
              >
                <option value="4">Prioridade 4</option>
                <option value="3">Prioridade 3</option>
                <option value="2">Prioridade 2</option>
                <option value="1">Prioridade 1</option>
              </select>
            </div>
          </div>

          <button className="flex items-center gap-1.5 px-2 py-1 rounded border border-gray-200 text-gray-500 text-[13px] hover:bg-gray-50 transition-colors">
            <Clock className="w-3.5 h-3.5" />
            Lembretes
          </button>
          <button
            onClick={handleVoiceButtonClick}
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded border text-[13px] transition-colors",
              voice.isListening
                ? "border-red-300 bg-red-50 text-red-600 animate-pulse"
                : "border-gray-200 text-gray-500 hover:bg-gray-50"
            )}
            title={isAuthenticated ? "Voice input" : "Sign in to use voice input"}
          >
            <Mic className="w-3.5 h-3.5" />
            {voice.isListening ? 'Listening...' : 'Voice'}
            {!isAuthenticated && (
              <Lock className="w-3 h-3 text-gray-400" />
            )}
          </button>
          <button className="flex items-center justify-center w-7 h-7 rounded text-gray-400 hover:bg-gray-100 transition-colors ml-auto">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between px-3 py-3 border-t border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-2">
          {/* Project selector mock - just context */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded text-gray-500 hover:bg-gray-200/50 cursor-pointer transition-colors">
            <div className="w-2.5 h-2.5 rounded-full bg-gray-400" />
            <span className="text-[13px] font-medium">Entrada</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCancel}
            className="px-3 py-1.5 text-[13px] font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-[5px] transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!title.trim() || createTodo.isPending}
            className="px-3 py-1.5 text-[13px] font-semibold text-white bg-red-400 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-[5px] transition-colors"
          >
            Adicionar tarefa
          </button>
        </div>
      </div>
    </div>
  );
}
