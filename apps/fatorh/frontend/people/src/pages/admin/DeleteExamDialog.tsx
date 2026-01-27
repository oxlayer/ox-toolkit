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
import type { Exam } from "@/types/admin";
import { AlertTriangle } from "lucide-react";

interface DeleteExamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exam: Exam | null;
}

export default function DeleteExamDialog({
  open,
  onOpenChange,
  exam,
}: DeleteExamDialogProps) {
  const { deleteExam, getQuestionsByExamId } = useWorkspace();

  if (!exam) return null;

  const questions = getQuestionsByExamId(exam.id);

  const handleDelete = () => {
    deleteExam(exam.id);
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
            <DialogTitle>Excluir Exame</DialogTitle>
          </div>
          <DialogDescription className="text-left">
            Tem certeza que deseja excluir o exame{" "}
            <span className="font-semibold text-gray-900">"{exam.examName}"</span>?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">
              <strong>Esta ação não pode ser desfeita.</strong>
            </p>
            <ul className="text-sm text-red-700 mt-2 space-y-1">
              <li>• O exame será permanentemente removido</li>
              {questions.length > 0 && (
                <li>
                  • {questions.length} pergunta(s) associada(s) também serão
                  excluída(s)
                </li>
              )}
            </ul>
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
            Excluir Exame
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

