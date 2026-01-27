import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import type { Question } from "@/types/admin";
import { AlertTriangle } from "lucide-react";

interface DeleteQuestionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  question: Question | null;
}

export default function DeleteQuestionDialog({
  open,
  onOpenChange,
  question,
}: DeleteQuestionDialogProps) {
  const { deleteQuestion } = useWorkspace();

  if (!question) return null;

  const handleDelete = () => {
    deleteQuestion(question.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-100 rounded-full">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <DialogTitle>Excluir Pergunta</DialogTitle>
          </div>
          <DialogDescription className="text-left">
            Tem certeza que deseja excluir esta pergunta?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-gray-50 border rounded-lg p-3">
            <p className="text-sm text-gray-700 line-clamp-3">{question.text}</p>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
            <p className="text-sm text-red-800">
              <strong>Esta ação não pode ser desfeita.</strong> A pergunta será
              permanentemente removida do exame.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Excluir Pergunta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

