import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import type { Question, NewQuestion } from "@/types/admin";

interface QuestionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  examId: string;
  question?: Question | null; // Se fornecido, é edição; senão, é criação
}

export default function QuestionDialog({
  open,
  onOpenChange,
  examId,
  question,
}: QuestionDialogProps) {
  const { addQuestion, updateQuestion } = useWorkspace();

  const [text, setText] = useState("");
  const [type, setType] = useState<"technical" | "behavioral" | "situational">(
    "technical"
  );
  const [weight, setWeight] = useState<"high" | "medium" | "low">("medium");

  const isEditing = !!question;

  // Load question data when editing
  useEffect(() => {
    if (open) {
      if (question) {
        setText(question.text);
        setType(question.type);
        setWeight(question.weight);
      } else {
        setText("");
        setType("technical");
        setWeight("medium");
      }
    }
  }, [open, question]);

  const resetForm = () => {
    setText("");
    setType("technical");
    setWeight("medium");
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleSubmit = () => {
    if (!text.trim()) return;

    if (isEditing && question) {
      updateQuestion(question.id, {
        text: text.trim(),
        type,
        weight,
      });
    } else {
      const newQuestion: NewQuestion = {
        examId,
        text: text.trim(),
        type,
        weight,
      };
      addQuestion(newQuestion);
    }

    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Pergunta" : "Nova Pergunta"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="questionText">Texto da Pergunta *</Label>
            <Textarea
              id="questionText"
              placeholder="Digite o texto da pergunta..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={type}
                onValueChange={(v) =>
                  setType(v as "technical" | "behavioral" | "situational")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technical">Técnica</SelectItem>
                  <SelectItem value="behavioral">Comportamental</SelectItem>
                  <SelectItem value="situational">Situacional</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Peso</Label>
              <Select
                value={weight}
                onValueChange={(v) => setWeight(v as "high" | "medium" | "low")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">Alto</SelectItem>
                  <SelectItem value="medium">Médio</SelectItem>
                  <SelectItem value="low">Baixo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!text.trim()}
            className="bg-amber-500 hover:bg-amber-600"
          >
            {isEditing ? "Salvar Alterações" : "Adicionar Pergunta"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

