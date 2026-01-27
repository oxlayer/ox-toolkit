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
import type { WhatsAppCampaign } from "@/types/admin";
import { AlertTriangle } from "lucide-react";

interface DeleteWhatsAppCampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign: WhatsAppCampaign | null;
}

export default function DeleteWhatsAppCampaignDialog({
  open,
  onOpenChange,
  campaign,
}: DeleteWhatsAppCampaignDialogProps) {
  const { deleteWhatsAppCampaign } = useWorkspace();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = () => {
    if (!campaign) return;

    setIsDeleting(true);
    // Simulate async deletion
    setTimeout(() => {
      deleteWhatsAppCampaign(campaign.id);
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
            Excluir Campanha
          </DialogTitle>
          <DialogDescription>
            Tem certeza que deseja excluir esta campanha WhatsApp?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {campaign && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="font-medium text-gray-900">{campaign.name}</p>
              <p className="text-sm text-gray-600 mt-1">
                {campaign.totalRecipients} destinatário(s) • {campaign.sentCount} enviada(s)
              </p>
            </div>
          )}
          <p className="text-sm text-gray-600 mt-4">
            Esta ação não pode ser desfeita. A campanha e todos os seus dados serão removidos permanentemente.
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
            {isDeleting ? "Excluindo..." : "Excluir Campanha"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
