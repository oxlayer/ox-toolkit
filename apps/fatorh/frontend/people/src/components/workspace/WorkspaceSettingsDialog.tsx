import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Plus, Settings, Trash2, Edit2, Check, X } from "lucide-react";
import type { Workspace } from "@/types/organization";

interface WorkspaceSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddWorkspace: () => void;
}

export default function WorkspaceSettingsDialog({
  open,
  onOpenChange,
  onAddWorkspace,
}: WorkspaceSettingsDialogProps) {
  const { workspaces, currentWorkspace, setCurrentWorkspace, deleteWorkspace, updateWorkspace } = useWorkspace();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const handleStartEdit = (workspace: Workspace) => {
    setEditingId(workspace.id);
    setEditName(workspace.name);
  };

  const handleSaveEdit = (workspaceId: string) => {
    if (editName.trim()) {
      updateWorkspace(workspaceId, { name: editName.trim() });
    }
    setEditingId(null);
    setEditName("");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };

  const handleDelete = (workspaceId: string) => {
    if (workspaces.length > 1) {
      deleteWorkspace(workspaceId);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Gerenciar Workspaces
          </DialogTitle>
          <DialogDescription>
            Gerencie os workspaces da sua organização. Cada workspace representa um programa ou campanha.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Lista de Workspaces */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {workspaces.map((workspace) => (
              <div
                key={workspace.id}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  currentWorkspace?.id === workspace.id
                    ? "border-amber-400 bg-amber-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                {/* Indicador de selecionado */}
                <div
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    currentWorkspace?.id === workspace.id
                      ? "bg-amber-400"
                      : "bg-gray-300"
                  }`}
                />

                {/* Nome editável */}
                {editingId === workspace.id ? (
                  <div className="flex-1 flex items-center gap-2">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-8"
                      autoFocus
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleSaveEdit(workspace.id)}
                      className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleCancelEdit}
                      className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => {
                        setCurrentWorkspace(workspace.id);
                      }}
                    >
                      <p className="font-medium text-gray-900">{workspace.name}</p>
                      {workspace.description && (
                        <p className="text-xs text-gray-500 truncate">
                          {workspace.description}
                        </p>
                      )}
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleStartEdit(workspace)}
                        className="h-8 w-8 p-0 text-gray-500 hover:text-amber-600 hover:bg-amber-50"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      {workspaces.length > 1 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(workspace.id)}
                          className="h-8 w-8 p-0 text-gray-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Botão Adicionar */}
          <Button
            onClick={() => {
              onOpenChange(false);
              onAddWorkspace();
            }}
            className="w-full mt-4 bg-amber-400 hover:bg-amber-500 text-black"
          >
            <Plus className="w-4 h-4 mr-2" />
            Criar Novo Workspace
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
