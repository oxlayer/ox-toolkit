import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { WhatsAppCampaign } from "@/types/admin";
import {
  MessageSquare,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
} from "lucide-react";

interface WhatsAppCampaignDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign: WhatsAppCampaign | null;
}

export default function WhatsAppCampaignDetailsDialog({
  open,
  onOpenChange,
  campaign,
}: WhatsAppCampaignDetailsDialogProps) {
  const formatDate = (date: Date | null) => {
    if (!date) return "-";
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  const getCampaignStatusLabel = (status: string) => {
    switch (status) {
      case "draft":
        return "Rascunho";
      case "scheduled":
        return "Agendado";
      case "sending":
        return "Enviando";
      case "completed":
        return "Concluído";
      case "failed":
        return "Falhou";
      default:
        return status;
    }
  };

  const getCampaignStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "sending":
        return "bg-yellow-100 text-amber-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const stats = useMemo(() => {
    if (!campaign) return null;
    const successRate =
      campaign.totalRecipients > 0
        ? ((campaign.sentCount / campaign.totalRecipients) * 100).toFixed(1)
        : "0";
    const failureRate =
      campaign.totalRecipients > 0
        ? ((campaign.failedCount / campaign.totalRecipients) * 100).toFixed(1)
        : "0";
    const pendingCount = campaign.totalRecipients - campaign.sentCount - campaign.failedCount;

    return {
      successRate,
      failureRate,
      pendingCount,
    };
  }, [campaign]);

  if (!campaign) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            {campaign.name}
          </DialogTitle>
          <DialogDescription>
            Detalhes e estatísticas da campanha WhatsApp
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Status:</span>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${getCampaignStatusColor(
                campaign.status
              )}`}
            >
              {getCampaignStatusLabel(campaign.status)}
            </span>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-medium text-gray-700">
                    Total Destinatários
                  </span>
                </div>
                <div className="text-2xl font-bold text-amber-600">
                  {campaign.totalRecipients}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-gray-700">
                    Enviadas com Sucesso
                  </span>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {campaign.sentCount}
                </div>
                <p className="text-xs text-gray-600">{stats?.successRate}%</p>
              </CardContent>
            </Card>

            <Card className="bg-red-50 border-red-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium text-gray-700">
                    Falhas
                  </span>
                </div>
                <div className="text-2xl font-bold text-red-600">
                  {campaign.failedCount}
                </div>
                <p className="text-xs text-gray-600">{stats?.failureRate}%</p>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">
                    Pendentes
                  </span>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {stats?.pendingCount || 0}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Campaign Details */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-gray-900">Configuração da Campanha</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Template:</span>
                <span className="ml-2 font-medium">{campaign.template}</span>
              </div>
              <div>
                <span className="text-gray-600">Criado em:</span>
                <span className="ml-2 font-medium">{formatDate(campaign.createdAt)}</span>
              </div>
              <div>
                <span className="text-gray-600">Agendado para:</span>
                <span className="ml-2 font-medium">
                  {campaign.scheduledDate ? formatDate(campaign.scheduledDate) : "Envio imediato"}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Enviado em:</span>
                <span className="ml-2 font-medium">{formatDate(campaign.sentAt)}</span>
              </div>
            </div>
          </div>

          {/* Variables */}
          {campaign.variables && campaign.variables.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Variáveis do Template</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                {campaign.variables.map((variable, index) => (
                  <div key={index} className="flex">
                    <span className="text-gray-600 w-24">Var {index + 1}:</span>
                    <span className="font-medium">{variable.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Test Users */}
          {campaign.testUsers && campaign.testUsers.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">
                Usuários de Teste ({campaign.testUsers.length})
              </h3>
              <div className="space-y-2">
                {campaign.testUsers.map((user, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center text-sm bg-white p-2 rounded"
                  >
                    <span className="font-medium">{user.userName}</span>
                    <span className="text-gray-600">{user.phoneNumber}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recipients Table Placeholder */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Destinatários</h3>
            <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>O log detalhado de destinatários estará disponível após o envio.</p>
              <p className="text-sm mt-1">
                Total de destinatários no CSV: {campaign.totalRecipients}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={() => onOpenChange(false)}>Fechar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
