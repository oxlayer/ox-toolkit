import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";

interface AddWorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { name: string; description: string; domainAliases: string[]; rootManagerEmail: string }) => void;
}

export default function AddWorkspaceDialog({
  open,
  onOpenChange,
  onSave,
}: AddWorkspaceDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [domainAliases, setDomainAliases] = useState<string[]>([]);
  const [newDomainAlias, setNewDomainAlias] = useState("");
  const [rootManagerEmail, setRootManagerEmail] = useState("");

  const handleAddDomainAlias = () => {
    const trimmed = newDomainAlias.trim();
    if (trimmed && !domainAliases.includes(trimmed)) {
      setDomainAliases([...domainAliases, trimmed]);
      setNewDomainAlias("");
    }
  };

  const handleRemoveDomainAlias = (alias: string) => {
    setDomainAliases(domainAliases.filter((a) => a !== alias));
  };

  const handleSave = () => {
    if (name.trim()) {
      onSave({
        name: name.trim(),
        description: description.trim(),
        domainAliases,
        rootManagerEmail: rootManagerEmail.trim(),
      });
      setName("");
      setDescription("");
      setDomainAliases([]);
      setNewDomainAlias("");
      setRootManagerEmail("");
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    setName("");
    setDescription("");
    setDomainAliases([]);
    setNewDomainAlias("");
    setRootManagerEmail("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Novo Workspace</DialogTitle>
          <DialogDescription>
            Um workspace representa uma organização. O nome deve ser em minúsculas, sem caracteres especiais (hífens e espaços permitidos).
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="ws-name">Nome do Workspace *</Label>
            <Input
              id="ws-name"
              value={name}
              onChange={(e) => setName(e.target.value.toLowerCase())}
              placeholder="Ex: minha-empresa"
              pattern="^[a-z0-9][a-z0-9\s-]*[a-z0-9]$"
              title="Use apenas letras minúsculas, números, hífens e espaços"
            />
            <p className="text-xs text-gray-500">
              Use apenas letras minúsculas, números, hífens e espaços
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ws-description">Descrição</Label>
            <Textarea
              id="ws-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o workspace..."
              rows={2}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="root-manager-email">Email do Gestor *</Label>
            <Input
              id="root-manager-email"
              type="email"
              value={rootManagerEmail}
              onChange={(e) => setRootManagerEmail(e.target.value)}
              placeholder="gestor@empresa.com.br"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label>Aliases de Domínio</Label>
            <div className="flex gap-2">
              <Input
                value={newDomainAlias}
                onChange={(e) => setNewDomainAlias(e.target.value)}
                placeholder="empresa.com.br"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddDomainAlias();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleAddDomainAlias}
                disabled={!newDomainAlias.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {domainAliases.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {domainAliases.map((alias) => (
                  <div
                    key={alias}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm"
                  >
                    {alias}
                    <button
                      type="button"
                      onClick={() => handleRemoveDomainAlias(alias)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!name.trim() || !rootManagerEmail.trim()}
            className="bg-amber-400 hover:bg-amber-500 text-black"
          >
            Criar Workspace
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
