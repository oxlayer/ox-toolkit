import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import type { Exam } from "@/types/admin";
import { Copy, FileText } from "lucide-react";

interface CloneExamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exam: Exam | null;
}

export default function CloneExamDialog({
  open,
  onOpenChange,
  exam,
}: CloneExamDialogProps) {
  const { cloneExam, getQuestionsByExamId, currentWorkspace } = useWorkspace();

  const [newName, setNewName] = useState("");

  const questionCount = exam ? getQuestionsByExamId(exam.id).length : 0;

  // Set initial values when dialog opens
  useEffect(() => {
    if (open && exam) {
      setNewName(`${exam.examName} (Cópia)`);
    }
  }, [open, exam]);

  const handleClose = () => {
    setNewName("");
    onOpenChange(false);
  };

  const handleClone = async () => {
    if (!exam || !newName.trim() || !currentWorkspace) return;

    await cloneExam(exam.id, newName.trim(), currentWorkspace.id);
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="w-5 h-5 text-amber-500" />
            Clonar Exame
          </DialogTitle>
          <DialogDescription>
            Criar uma cópia do exame com todas as questões.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Info do exame original */}
          <div className="bg-gray-50 rounded-lg p-3 border">
            <p className="text-sm text-gray-500 mb-1">Exame Original</p>
            <p className="font-medium">{exam?.examName}</p>
            <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
              <FileText className="w-4 h-4" />
              <span>{questionCount} questão(ões)</span>
              <span className="text-gray-400">•</span>
              <span>{exam?.durationMinutes} min</span>
            </div>
          </div>

          {/* Nome do novo exame */}
          <div className="space-y-2">
            <Label htmlFor="newName">Nome do Novo Exame *</Label>
            <Input
              id="newName"
              placeholder="Digite o nome do novo exame"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>

          {/* Workspace info */}
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <p className="text-sm text-blue-800">
              O exame será criado no workspace atual: <strong>{currentWorkspace?.name}</strong>
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleClone}
            disabled={!newName.trim() || !currentWorkspace}
            className="bg-amber-500 hover:bg-amber-600"
          >
            <Copy className="w-4 h-4 mr-2" />
            Clonar Exame
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
