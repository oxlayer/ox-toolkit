import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import PageHeader from "@/components/PageHeader";
import { Eye, X, Send, Clock, CheckCircle, XCircle, AlertCircle, FileText } from "lucide-react";
import type { WhatsAppCampaign } from "@/types/admin";
import WhatsAppCampaignDetailsDialog from "./WhatsAppCampaignDetailsDialog";

type StatusFilter = "all" | "draft" | "scheduled" | "sending" | "completed" | "failed";
type TypeFilter = "all" | "whatsapp" | "email";
type PeriodFilter = "all" | "last_30" | "last_60" | "last_90";

export default function Campaigns() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("all");
  const [examFilter, setExamFilter] = useState<string>("all");
  const [selectedCampaign, setSelectedCampaign] = useState<WhatsAppCampaign | null>(null);
  const [campaignDetailsOpen, setCampaignDetailsOpen] = useState(false);

  const {
    filteredWhatsAppCampaigns,
    filteredExams,
    currentWorkspace,
  } = useWorkspace();

  // Helper function to check if campaign is within date range
  const isWithinDateRange = (campaign: WhatsAppCampaign, days: number) => {
    const now = new Date();
    const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return campaign.createdAt >= cutoffDate;
  };

  // Enrich campaigns with exam info
  const enrichedCampaigns = useMemo(() => {
    return filteredWhatsAppCampaigns.map((campaign) => {
      const exam = filteredExams.find((e) => e.id === campaign.examId);
      return {
        ...campaign,
        examName: exam?.examName || "N/A",
      };
    });
  }, [filteredWhatsAppCampaigns, filteredExams]);

  const filteredCampaignsList = useMemo(() => {
    return enrichedCampaigns.filter((campaign) => {
      // Search filter
      const matchesSearch =
        campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.examName.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;

      // Status filter
      if (statusFilter !== "all" && campaign.status !== statusFilter) {
        return false;
      }

      // Period filter
      if (periodFilter !== "all") {
        const days =
          periodFilter === "last_30"
            ? 30
            : periodFilter === "last_60"
            ? 60
            : 90;
        if (!isWithinDateRange(campaign, days)) return false;
      }

      // Exam filter
      if (examFilter !== "all" && campaign.examId !== examFilter) {
        return false;
      }

      return true;
    });
  }, [enrichedCampaigns, searchTerm, statusFilter, periodFilter, examFilter]);

  const clearFilters = () => {
    setStatusFilter("all");
    setTypeFilter("all");
    setPeriodFilter("all");
    setExamFilter("all");
    setSearchTerm("");
  };

  const hasActiveFilters =
    statusFilter !== "all" ||
    typeFilter !== "all" ||
    periodFilter !== "all" ||
    examFilter !== "all" ||
    searchTerm !== "";

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  const formatScheduledDate = (date: Date | null) => {
    if (!date) return "-";
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  const getStatusBadge = (status: WhatsAppCampaign["status"]) => {
    const variants = {
      draft: "bg-gray-100 text-gray-800",
      scheduled: "bg-blue-100 text-blue-800",
      sending: "bg-yellow-100 text-yellow-800",
      completed: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
    };

    const labels = {
      draft: "Rascunho",
      scheduled: "Agendada",
      sending: "Enviando",
      completed: "Concluída",
      failed: "Falhou",
    };

    const icons = {
      draft: FileText,
      scheduled: Clock,
      sending: Send,
      completed: CheckCircle,
      failed: XCircle,
    };

    const Icon = icons[status];

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${variants[status]}`}
      >
        <Icon className="w-3 h-3" />
        {labels[status]}
      </span>
    );
  };

  const calculateSuccessRate = (campaign: WhatsAppCampaign) => {
    if (campaign.sentCount === 0) return 0;
    return Math.round((campaign.sentCount / campaign.totalRecipients) * 100);
  };

  const handleViewCampaign = (campaign: WhatsAppCampaign) => {
    setSelectedCampaign(campaign);
    setCampaignDetailsOpen(true);
  };

  return (
    <div className="min-h-full p-8 md:p-10 lg:p-12 pb-20">
      <PageHeader title="Campanhas" />

      <p className="text-gray-600 mb-6 mt-2">
        Gerencie todas as campanhas de envio cadastradas no sistema.
      </p>
      {currentWorkspace && (
        <p className="text-sm text-amber-600 font-medium mb-4">
          Workspace: {currentWorkspace.name}
        </p>
      )}

      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-4 border-b space-y-4">
          {/* Search row */}
          <div className="flex flex-wrap items-center gap-4">
            <Input
              placeholder="Buscar campanhas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-xs"
            />
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-gray-600 hover:text-gray-900"
              >
                <X className="w-4 h-4 mr-1" />
                Limpar filtros
              </Button>
            )}
          </div>

          {/* Filters row */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">
                Status:
              </label>
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as StatusFilter)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="scheduled">Agendada</SelectItem>
                  <SelectItem value="sending">Enviando</SelectItem>
                  <SelectItem value="completed">Concluída</SelectItem>
                  <SelectItem value="failed">Falhou</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Tipo:</label>
              <Select
                value={typeFilter}
                onValueChange={(value) => setTypeFilter(value as TypeFilter)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="email">E-mail</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Period Filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">
                Período:
              </label>
              <Select
                value={periodFilter}
                onValueChange={(value) => setPeriodFilter(value as PeriodFilter)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="last_30">Últimos 30 dias</SelectItem>
                  <SelectItem value="last_60">Últimos 60 dias</SelectItem>
                  <SelectItem value="last_90">Últimos 90 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Exam Filter */}
            {filteredExams.length > 0 && (
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Exame:
                </label>
                <Select value={examFilter} onValueChange={setExamFilter}>
                  <SelectTrigger className="w-56">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {filteredExams.map((exam) => (
                      <SelectItem key={exam.id} value={exam.id}>
                        {exam.examName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome da Campanha</TableHead>
              <TableHead>Exame</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Agendamento</TableHead>
              <TableHead>Destinatários</TableHead>
              <TableHead>Taxa de Sucesso</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCampaignsList.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center text-gray-500"
                >
                  Nenhuma campanha encontrada
                </TableCell>
              </TableRow>
            ) : (
              filteredCampaignsList.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell className="font-medium">
                    {campaign.name}
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {campaign.examName}
                  </TableCell>
                  <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                  <TableCell className="text-gray-600">
                    {formatScheduledDate(campaign.scheduledDate)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">
                        {campaign.sentCount}/{campaign.totalRecipients}
                      </span>
                      {campaign.failedCount > 0 && (
                        <span className="text-xs text-red-600">
                          ({campaign.failedCount} falhas)
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        calculateSuccessRate(campaign) >= 90
                          ? "bg-green-100 text-green-800"
                          : calculateSuccessRate(campaign) >= 70
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {calculateSuccessRate(campaign)}%
                    </span>
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {formatDate(campaign.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewCampaign(campaign)}
                      className="cursor-pointer hover:bg-amber-300 hover:text-black"
                      title="Ver Detalhes"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        Total: {filteredCampaignsList.length} campanha(s)
      </div>

      {/* Campaign Details Dialog */}
      <WhatsAppCampaignDetailsDialog
        open={campaignDetailsOpen}
        onOpenChange={setCampaignDetailsOpen}
        campaign={selectedCampaign}
      />
    </div>
  );
}
