import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import type { Template } from "@/types/admin";
import { AlertTriangle, MessageCircle, Mail } from "lucide-react";

interface DeleteTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: Template | null;
}

export default function DeleteTemplateDialog({
  open,
  onOpenChange,
  template,
}: DeleteTemplateDialogProps) {
  const { deleteTemplate } = useWorkspace();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = () => {
    if (!template) return;

    setIsDeleting(true);
    // Simulate async deletion
    setTimeout(() => {
      deleteTemplate(template.id);
      setIsDeleting(false);
      onOpenChange(false);
    }, 500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Excluir Template
          </DialogTitle>
          <DialogDescription>
            Tem certeza que deseja excluir este template?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {template && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                {template.type === "whatsapp" ? (
                  <MessageCircle className="w-4 h-4 text-gray-600" />
                ) : (
                  <Mail className="w-4 h-4 text-gray-600" />
                )}
                <span className="text-xs text-gray-500 uppercase">
                  {template.type === "whatsapp" ? "WhatsApp" : "Email"}
                </span>
              </div>
              <p className="font-medium text-gray-900">{template.name}</p>
              <p className="text-sm text-gray-600 mt-1">{template.title}</p>
              {template.variables.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {template.variables.map((variable, index) => (
                    <span
                      key={index}
                      className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-mono"
                    >
                      {variable}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
          <p className="text-sm text-gray-600 mt-4">
            Esta ação não pode ser desfeita. O template e todas as suas configurações serão removidos permanentemente.
          </p>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Excluindo..." : "Excluir Template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
