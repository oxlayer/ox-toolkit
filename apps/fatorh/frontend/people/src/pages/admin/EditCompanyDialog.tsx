import { useState, useEffect } from "react";
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
import type { Company } from "@/types/admin";

interface EditCompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: Company | null;
  onSave: (data: { id: string; name: string; description: string }) => void;
}

export default function EditCompanyDialog({
  open,
  onOpenChange,
  company,
  onSave,
}: EditCompanyDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  // Preencher os campos quando a empresa mudar ou o dialog abrir
  useEffect(() => {
    if (company && open) {
      setName(company.name || "");
      setDescription(company.description || "");
    }
  }, [company, open]);

  const handleSave = () => {
    if (name.trim() && company) {
      onSave({
        id: company.id,
        name: name.trim(),
        description: description.trim(),
      });
      onOpenChange(false);
    }
  };

  return (
    <Dialog  open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] close-on-outside-click">
        <DialogHeader>
          <DialogTitle>Editar Empresa</DialogTitle>
          <DialogDescription>
            Atualize os dados da empresa abaixo.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="edit-name">Nome da Empresa *</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: TechCorp Solutions"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-description">Descrição</Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva a empresa..."
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="cursor-pointer" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!name.trim() || !company}
            className="bg-amber-300 cursor-pointer hover:bg-amber-400 text-black"
          >
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

