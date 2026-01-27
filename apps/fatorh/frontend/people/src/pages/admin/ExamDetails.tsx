import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useAnswers, useEvaluations } from "@/lib/api";
import type { Question, WhatsAppCampaign } from "@/types/admin";
import {
  Users,
  Star,
  ArrowLeft,
  FileText,
  TrendingUp,
  Eye,
  Plus,
  Pencil,
  Trash2,
  Clock,
  MessageSquare,
  Send,
  CheckCircle2,
  XCircle,
  AlertCircle,
  UserMinus,
  RefreshCw,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

import EditExamDialog from "./EditExamDialog";
import QuestionDialog from "./QuestionDialog";
import DeleteQuestionDialog from "./DeleteQuestionDialog";
import CreateWhatsAppCampaignDialog from "./CreateWhatsAppCampaignDialog";
import WhatsAppCampaignDetailsDialog from "./WhatsAppCampaignDetailsDialog";
import DeleteWhatsAppCampaignDialog from "./DeleteWhatsAppCampaignDialog";
import AddCandidateDialog from "./AddCandidateDialog";

interface CandidateStats {
  user: { id: string; name: string; email?: string; cpf?: string };
  score: number;
  status: "completed" | "partial" | "failed" | "in_progress" | "invited";
  interviewDate: Date | null;
  totalAnswers: number;
  failureReason?: string | null;
  examCandidateId?: string;
}

export default function ExamDetails() {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const {
    filteredExams,
    getQuestionsByExamId,
    getWhatsAppCampaignsByExamId,
    getExamCandidatesByExamId,
    removeExamCandidate,
  } = useWorkspace();

  // API hooks for answers and evaluation results
  const { list: listAnswers } = useAnswers();
  const { listResults: listEvaluationResults } = useEvaluations();

  // Fetch answers and evaluation results for this exam
  const { data: answersData, isLoading: isLoadingAnswers } = listAnswers({ examId: examId || "" });
  const { data: evaluationData, isLoading: isLoadingEvaluations } = listEvaluationResults({ examId: examId || "" });

  // Dialog states
  const [editExamDialogOpen, setEditExamDialogOpen] = useState(false);
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [deleteQuestionDialogOpen, setDeleteQuestionDialogOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [createCampaignDialogOpen, setCreateCampaignDialogOpen] = useState(false);
  const [campaignDetailsDialogOpen, setCampaignDetailsDialogOpen] = useState(false);
  const [deleteCampaignDialogOpen, setDeleteCampaignDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<WhatsAppCampaign | null>(null);
  const [addCandidateDialogOpen, setAddCandidateDialogOpen] = useState(false);
  const [resetCandidateDialogOpen, setResetCandidateDialogOpen] = useState(false);
  const [selectedCandidateForReset, setSelectedCandidateForReset] = useState<CandidateStats | null>(null);

  // Candidate filter states
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterMinScore, setFilterMinScore] = useState<string>("");
  const [filterMaxScore, setFilterMaxScore] = useState<string>("");
  const [filterStartDate, setFilterStartDate] = useState<string>("");
  const [filterEndDate, setFilterEndDate] = useState<string>("");

  // Campaign type filter
  const [campaignTypeFilter, setCampaignTypeFilter] = useState<"all" | "whatsapp" | "email">("all");

  const exam = useMemo(() => {
    return filteredExams.find((e) => e.id === examId);
  }, [examId, filteredExams]);

  const questions = useMemo(() => {
    if (!exam) return [];
    return getQuestionsByExamId(exam.id);
  }, [exam, getQuestionsByExamId]);

  const campaigns = useMemo(() => {
    if (!exam) return [];
    return getWhatsAppCampaignsByExamId(exam.id);
  }, [exam, getWhatsAppCampaignsByExamId]);

  // Estatísticas do exame
  const stats = useMemo(() => {
    if (!exam || !answersData || !evaluationData) {
      return {
        totalCandidates: 0,
        averageScore: 0,
        completionRate: 0,
        totalQuestions: 0,
      };
    }

    const examAnswers = answersData.answers;
    const examResults = evaluationData.results;
    const uniqueCandidates = new Set(examAnswers.map((a) => a.candidateId));
    const completedResults = examResults.filter(
      (r) => r.completionStatus === "completed"
    );

    const averageScore =
      completedResults.length > 0
        ? completedResults.reduce(
          (acc, r) => acc + (r.overallScore || 0),
          0
        ) / completedResults.length
        : 0;

    const completionRate =
      uniqueCandidates.size > 0
        ? (completedResults.length / uniqueCandidates.size) * 100
        : 0;

    return {
      totalCandidates: uniqueCandidates.size,
      averageScore,
      completionRate,
      totalQuestions: questions.length,
    };
  }, [exam, questions, answersData, evaluationData]);

  const campaignStats = useMemo(() => {
    return {
      totalRecipients: campaigns.reduce((acc, c) => acc + c.totalRecipients, 0),
      sentCount: campaigns.reduce((acc, c) => acc + c.sentCount, 0),
      failedCount: campaigns.reduce((acc, c) => acc + c.failedCount, 0),
      completedCampaigns: campaigns.filter((c) => c.status === "completed").length,
      inProgressCampaigns: campaigns.filter((c) => ["scheduled", "sending"].includes(c.status)).length,
    };
  }, [campaigns]);

  // Candidatos do exame (combinando examCandidates e usuários com respostas)
  const candidates = useMemo<CandidateStats[]>(() => {
    if (!exam || !answersData || !evaluationData) return [];

    const examAnswers = answersData.answers;
    const examResults = evaluationData.results;

    // Get candidates from ExamCandidate table
    const examCandidates = getExamCandidatesByExamId(exam.id);
    const candidateUserIds = new Set(examCandidates.map((c) => c.userId));

    // Get candidate IDs from actual answers (using candidateId instead of userId)
    const answeredCandidateIds = new Set(examAnswers.map((a) => a.candidateId));

    // Combine both sets
    const allCandidateIds = new Set([...candidateUserIds, ...answeredCandidateIds]);

    return Array.from(allCandidateIds)
      .map((candidateId) => {
        // TODO: Implement users/candidates API endpoint to get actual user data
        const user = { id: candidateId, name: `Candidate ${candidateId}`, email: undefined, cpf: undefined };
        if (!user) return null;

        const userAnswers = examAnswers.filter((a) => a.candidateId === candidateId);
        const userResult = examResults.find((r) => r.candidateId === candidateId);
        const examCandidate = examCandidates.find((c) => c.userId === candidateId);

        const sortedAnswers = [...userAnswers].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        const lastAnswer = sortedAnswers[0];

        // Determine status based on candidate record and answers
        let status: CandidateStats["status"] = "invited" as any;
        if (userResult) {
          status = userResult.completionStatus as CandidateStats["status"];
        } else if (userAnswers.length > 0) {
          status = "in_progress";
        } else if (examCandidate) {
          status = examCandidate.status as CandidateStats["status"];
        }

        return {
          user,
          score: userResult ? (userResult.overallScore || 0) : 0,
          status,
          interviewDate: lastAnswer ? new Date(lastAnswer.createdAt) : null,
          totalAnswers: userAnswers.length,
          failureReason: userResult?.failureReason,
          examCandidateId: examCandidate?.id,
        };
      })
      .filter((item): item is CandidateStats => item !== null);
  }, [exam, answersData, evaluationData, getExamCandidatesByExamId]);

  // Filtered candidates based on filter states
  const filteredCandidates = useMemo<CandidateStats[]>(() => {
    return candidates.filter((candidate) => {
      // Filter by status
      if (filterStatus !== "all" && candidate.status !== filterStatus) {
        return false;
      }

      // Filter by minimum score
      if (filterMinScore !== "" && candidate.score < parseFloat(filterMinScore)) {
        return false;
      }

      // Filter by maximum score
      if (filterMaxScore !== "" && candidate.score > parseFloat(filterMaxScore)) {
        return false;
      }

      // Filter by interview date range
      if (filterStartDate !== "" && candidate.interviewDate) {
        const startDate = new Date(filterStartDate);
        startDate.setHours(0, 0, 0, 0);
        if (candidate.interviewDate < startDate) {
          return false;
        }
      }

      if (filterEndDate !== "" && candidate.interviewDate) {
        const endDate = new Date(filterEndDate);
        endDate.setHours(23, 59, 59, 999);
        if (candidate.interviewDate > endDate) {
          return false;
        }
      }

      // If no interview date and date filter is active, exclude
      if ((filterStartDate !== "" || filterEndDate !== "") && !candidate.interviewDate) {
        return false;
      }

      return true;
    });
  }, [candidates, filterStatus, filterMinScore, filterMaxScore, filterStartDate, filterEndDate]);

  const handleRemoveCandidate = (userId: string) => {
    const examCandidate = getExamCandidatesByExamId(examId || "").find(
      (c) => c.userId === userId
    );
    if (examCandidate) {
      removeExamCandidate(examCandidate.id);
    }
  };

  const handleResetCandidate = (candidate: CandidateStats) => {
    setSelectedCandidateForReset(candidate);
    setResetCandidateDialogOpen(true);
  };

  const handleConfirmReset = () => {
    if (selectedCandidateForReset?.examCandidateId) {
      // Remove the candidate record to reset their status
      removeExamCandidate(selectedCandidateForReset.examCandidateId);
      setResetCandidateDialogOpen(false);
      setSelectedCandidateForReset(null);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(date));
  };

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "Concluído";
      case "partial":
        return "Em andamento";
      case "failed":
        return "Falhou";
      case "in_progress":
        return "Em andamento";
      case "invited":
        return "Convidado";
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "partial":
        return "bg-yellow-100 text-amber-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "invited":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getWeightLabel = (weight: string) => {
    switch (weight) {
      case "high":
        return "Alto";
      case "medium":
        return "Médio";
      case "low":
        return "Baixo";
      default:
        return weight;
    }
  };

  const getWeightColor = (weight: string) => {
    switch (weight) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-amber-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "technical":
        return "Técnica";
      case "behavioral":
        return "Comportamental";
      case "situational":
        return "Situacional";
      default:
        return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "technical":
        return "bg-blue-100 text-blue-800";
      case "behavioral":
        return "bg-purple-100 text-purple-800";
      case "situational":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
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

  const getCampaignStatusIcon = (status: string) => {
    switch (status) {
      case "draft":
        return <FileText className="w-4 h-4" />;
      case "scheduled":
        return <Clock className="w-4 h-4" />;
      case "sending":
        return <Send className="w-4 h-4" />;
      case "completed":
        return <CheckCircle2 className="w-4 h-4" />;
      case "failed":
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const handleAddQuestion = () => {
    setSelectedQuestion(null);
    setQuestionDialogOpen(true);
  };

  const handleEditQuestion = (question: Question) => {
    setSelectedQuestion(question);
    setQuestionDialogOpen(true);
  };

  const handleDeleteQuestion = (question: Question) => {
    setSelectedQuestion(question);
    setDeleteQuestionDialogOpen(true);
  };

  const handleMoveQuestionUp = async (question: Question) => {
    const currentIndex = questions.findIndex(q => q.id === question.id);
    if (currentIndex <= 0) return; // Already at the top

    const previousQuestion = questions[currentIndex - 1];

    // Swap orders
    await updateQuestion(question.id, { order: previousQuestion.order });
    await updateQuestion(previousQuestion.id, { order: question.order });
  };

  const handleMoveQuestionDown = async (question: Question) => {
    const currentIndex = questions.findIndex(q => q.id === question.id);
    if (currentIndex >= questions.length - 1) return; // Already at the bottom

    const nextQuestion = questions[currentIndex + 1];

    // Swap orders
    await updateQuestion(question.id, { order: nextQuestion.order });
    await updateQuestion(nextQuestion.id, { order: question.order });
  };

  const handleViewCampaign = (campaign: WhatsAppCampaign) => {
    setSelectedCampaign(campaign);
    setCampaignDetailsDialogOpen(true);
  };

  const handleDeleteCampaign = (campaign: WhatsAppCampaign) => {
    setSelectedCampaign(campaign);
    setDeleteCampaignDialogOpen(true);
  };

  if (!exam) {
    return (
      <div className="min-h-full p-8 md:p-10 lg:p-12 pb-20">
        <div className="text-center">
          <p className="text-gray-600">Exame não encontrado</p>
          <Button onClick={() => navigate("/exames")} className="mt-4">
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full p-8 md:p-10 lg:p-12 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/exames")}
          className="p-2 cursor-pointer hover:bg-amber-300 hover:text-black"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{exam.examName}</h1>
        </div>
        <Button
          onClick={() => setEditExamDialogOpen(true)}
          className="bg-amber-500 hover:bg-amber-600 cursor-pointer"
        >
          <Pencil className="w-4 h-4 mr-2" />
          Editar Exame
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="info" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="info">Informações</TabsTrigger>
          <TabsTrigger value="questions">Questões</TabsTrigger>
          <TabsTrigger value="candidates">Candidatos</TabsTrigger>
          <TabsTrigger value="campaigns">
            Campanhas
            {campaigns.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-xs">
                {campaigns.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Aba Informações */}
        <TabsContent value="info">
          {/* Informações básicas */}
          <div className="bg-white rounded-lg border shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Informações do Exame
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Nome do Exame</p>
                <p className="font-medium">{exam.examName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Duração</p>
                <p className="font-medium">{exam.durationMinutes} minutos</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Data de Criação</p>
                <p className="font-medium">{formatDateTime(exam.createdAt)}</p>
              </div>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-amber-50 border-amber-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-yellow-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Total de Candidatos
                  </h3>
                </div>
                <div className="text-4xl font-bold text-amber-600">
                  {stats.totalCandidates}
                </div>
                <p className="text-sm text-gray-600">
                  Candidatos que realizaram o exame
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-5 h-5 text-amber-400" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Média de Score
                  </h3>
                </div>
                <div className="text-4xl font-bold text-amber-400">
                  {stats.averageScore.toFixed(1)}
                </div>
                <p className="text-sm text-gray-600">Pontuação média geral</p>
              </CardContent>
            </Card>

            <Card className="bg-white border shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-amber-400" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Taxa de Conclusão
                  </h3>
                </div>
                <div className="text-4xl font-bold text-amber-400">
                  {stats.completionRate.toFixed(0)}%
                </div>
                <p className="text-sm text-gray-600">
                  Candidatos que concluíram
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-5 h-5 text-amber-400" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Total de Questões
                  </h3>
                </div>
                <div className="text-4xl font-bold text-amber-400">
                  {stats.totalQuestions}
                </div>
                <p className="text-sm text-gray-600">Questões cadastradas</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Aba Questões */}
        <TabsContent value="questions">
          <div className="bg-white rounded-lg border shadow-sm">
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Questões do Exame
                </h2>
                <p className="text-sm text-gray-600">
                  {questions.length} questão(ões) cadastrada(s)
                </p>
              </div>
              <Button
                onClick={handleAddQuestion}
                className="bg-amber-500 hover:bg-amber-600 cursor-pointer"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Pergunta
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">#</TableHead>
                  <TableHead>Questão</TableHead>
                  <TableHead className="w-32">Peso</TableHead>
                  <TableHead className="w-40">Tipo</TableHead>
                  <TableHead className="w-36">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {questions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-500">
                      Nenhuma questão cadastrada para este exame
                    </TableCell>
                  </TableRow>
                ) : (
                  questions.map((question) => (
                    <TableRow key={question.id}>
                      <TableCell className="font-medium">
                        {question.order}
                      </TableCell>
                      <TableCell className="max-w-md">
                        <p className="line-clamp-2">{question.text}</p>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getWeightColor(
                            question.weight
                          )}`}
                        >
                          {getWeightLabel(question.weight)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(
                            question.type
                          )}`}
                        >
                          {getTypeLabel(question.type)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            className="cursor-pointer hover:bg-gray-100 hover:text-gray-700"
                            size="sm"
                            onClick={() => handleMoveQuestionUp(question)}
                            title="Mover para cima"
                            disabled={questions.findIndex(q => q.id === question.id) === 0}
                          >
                            <ChevronUp className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            className="cursor-pointer hover:bg-gray-100 hover:text-gray-700"
                            size="sm"
                            onClick={() => handleMoveQuestionDown(question)}
                            title="Mover para baixo"
                            disabled={questions.findIndex(q => q.id === question.id) === questions.length - 1}
                          >
                            <ChevronDown className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            className="cursor-pointer hover:bg-blue-100 hover:text-blue-700"
                            size="sm"
                            onClick={() => handleEditQuestion(question)}
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            className="cursor-pointer hover:bg-red-100 hover:text-red-700"
                            size="sm"
                            onClick={() => handleDeleteQuestion(question)}
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Aba Candidatos */}
        <TabsContent value="candidates">
          <div className="bg-white rounded-lg border shadow-sm">
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Candidatos
                </h2>
                <p className="text-sm text-gray-600">
                  {candidates.length} candidato(s) neste exame
                  {filteredCandidates.length !== candidates.length && ` • ${filteredCandidates.length} filtrado(s)`}
                </p>
              </div>
              <Button
                onClick={() => setAddCandidateDialogOpen(true)}
                className="bg-amber-500 hover:bg-amber-600 cursor-pointer"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Candidato
              </Button>
            </div>

            {/* Filters */}
            <div className="p-4 border-b bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Status Filter */}
                <div>
                  <Label className="text-sm">Filtrar por Status</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Status</SelectItem>
                      <SelectItem value="completed">Concluído</SelectItem>
                      <SelectItem value="in_progress">Em Progresso</SelectItem>
                      <SelectItem value="partial">Em Andamento</SelectItem>
                      <SelectItem value="invited">Convidado</SelectItem>
                      <SelectItem value="failed">Falhou</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Min Score Filter */}
                <div>
                  <Label className="text-sm">Score Mínimo</Label>
                  <Input
                    type="number"
                    placeholder="Ex: 0"
                    min="0"
                    max="100"
                    step="0.1"
                    value={filterMinScore}
                    onChange={(e) => setFilterMinScore(e.target.value)}
                    className="mt-1"
                  />
                </div>

                {/* Max Score Filter */}
                <div>
                  <Label className="text-sm">Score Máximo</Label>
                  <Input
                    type="number"
                    placeholder="Ex: 100"
                    min="0"
                    max="100"
                    step="0.1"
                    value={filterMaxScore}
                    onChange={(e) => setFilterMaxScore(e.target.value)}
                    className="mt-1"
                  />
                </div>

                {/* Clear Filters Button */}
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFilterStatus("all");
                      setFilterMinScore("");
                      setFilterMaxScore("");
                      setFilterStartDate("");
                      setFilterEndDate("");
                    }}
                    className="w-full"
                  >
                    Limpar Filtros
                  </Button>
                </div>
              </div>

              {/* Date Range Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <Label className="text-sm">Data de Início</Label>
                  <Input
                    type="date"
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm">Data de Fim</Label>
                  <Input
                    type="date"
                    value={filterEndDate}
                    onChange={(e) => setFilterEndDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data da Entrevista</TableHead>
                  <TableHead>Erro</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCandidates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500">
                      {candidates.length === 0
                        ? "Nenhum candidato neste exame. Adicione candidatos para começar."
                        : "Nenhum candidato encontrado com os filtros aplicados."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCandidates.map((candidate) => {
                    const examCandidate = getExamCandidatesByExamId(exam.id).find(
                      (c) => c.userId === candidate.user.id
                    );
                    const canRemove = candidate.status === "invited" && examCandidate;
                    const canReset = candidate.status === "failed" && candidate.examCandidateId;

                    return (
                      <TableRow key={candidate.user.id}>
                        <TableCell className="font-medium flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-400" />
                          {candidate.user.name}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                            <span className="font-semibold">
                              {candidate.score.toFixed(1)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              candidate.status
                            )}`}
                          >
                            {getStatusLabel(candidate.status)}
                          </span>
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {candidate.interviewDate
                            ? formatDate(candidate.interviewDate)
                            : "-"}
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {candidate.status === "failed" && candidate.failureReason ? (
                            <div className="flex items-center gap-1 text-red-600">
                              <AlertCircle className="w-4 h-4" />
                              <span className="text-sm">{candidate.failureReason}</span>
                            </div>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {candidate.totalAnswers > 0 && (
                              <Button
                                variant="ghost"
                                className="cursor-pointer hover:bg-amber-300 hover:text-black"
                                size="sm"
                                onClick={() => {
                                  navigate(`/exames/${exam.id}/users/${candidate.user.id}`);
                                }}
                                title="Ver detalhes"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            )}
                            {canReset && (
                              <Button
                                variant="ghost"
                                className="cursor-pointer hover:bg-blue-100 hover:text-blue-700"
                                size="sm"
                                onClick={() => handleResetCandidate(candidate)}
                                title="Resetar e reenviar"
                              >
                                <RefreshCw className="w-4 h-4" />
                              </Button>
                            )}
                            {canRemove && (
                              <Button
                                variant="ghost"
                                className="cursor-pointer hover:bg-red-100 hover:text-red-600"
                                size="sm"
                                onClick={() => handleRemoveCandidate(candidate.user.id)}
                                title="Remover candidato"
                              >
                                <UserMinus className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Aba Campanhas */}
        <TabsContent value="campaigns">
          {/* KPIs das Campanhas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card className="bg-amber-50 border-amber-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-5 h-5 text-yellow-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Total de Campanhas
                  </h3>
                </div>
                <div className="text-4xl font-bold text-amber-600">
                  {campaigns.length}
                </div>
                <p className="text-sm text-gray-600">
                  Campanhas cadastradas
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-amber-400" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Total de Destinatários
                  </h3>
                </div>
                <div className="text-4xl font-bold text-amber-400">
                  {campaignStats.totalRecipients}
                </div>
                <p className="text-sm text-gray-600">
                  Mensagens a enviar/enviadas
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Mensagens Enviadas
                  </h3>
                </div>
                <div className="text-4xl font-bold text-green-500">
                  {campaignStats.sentCount}
                </div>
                <p className="text-sm text-gray-600">
                  {campaignStats.totalRecipients > 0
                    ? `${((campaignStats.sentCount / campaignStats.totalRecipients) * 100).toFixed(1)}%`
                    : "0%"} de sucesso
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-amber-400" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Campanhas em Andamento
                  </h3>
                </div>
                <div className="text-4xl font-bold text-amber-400">
                  {campaignStats.inProgressCampaigns}
                </div>
                <p className="text-sm text-gray-600">
                  {campaignStats.completedCampaigns} concluída(s)
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Lista de Campanhas */}
          <div className="bg-white rounded-lg border shadow-sm">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Campanhas
                  </h2>
                  <p className="text-sm text-gray-600">
                    {campaigns.length} campanha(s) cadastrada(s)
                  </p>
                </div>
                <Button
                  onClick={() => setCreateCampaignDialogOpen(true)}
                  className="bg-amber-500 hover:bg-amber-600 cursor-pointer"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Campanha
                </Button>
              </div>

              {/* Campaign Type Filter */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Tipo de Campanha:
                </label>
                <Select
                  value={campaignTypeFilter}
                  onValueChange={(value) => setCampaignTypeFilter(value as "all" | "whatsapp" | "email")}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Todos os tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="email">E-mail</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome da Campanha</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Destinatários</TableHead>
                  <TableHead>Enviadas</TableHead>
                  <TableHead>Data de Criação</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500">
                      Nenhuma campanha cadastrada para este exame
                    </TableCell>
                  </TableRow>
                ) : (
                  campaigns.map((campaign) => (
                    <TableRow key={campaign.id}>
                      <TableCell className="font-medium">{campaign.name}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${getCampaignStatusColor(
                            campaign.status
                          )}`}
                        >
                          {getCampaignStatusIcon(campaign.status)}
                          {getCampaignStatusLabel(campaign.status)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{campaign.totalRecipients}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-green-600 font-medium">
                            {campaign.sentCount}
                          </span>
                          {campaign.failedCount > 0 && (
                            <span className="text-red-600">
                              ({campaign.failedCount} falhas)
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {formatDate(campaign.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            className="cursor-pointer hover:bg-blue-100 hover:text-blue-700"
                            size="sm"
                            onClick={() => handleViewCampaign(campaign)}
                            title="Ver Detalhes"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            className="cursor-pointer hover:bg-red-100 hover:text-red-700"
                            size="sm"
                            onClick={() => handleDeleteCampaign(campaign)}
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <EditExamDialog
        open={editExamDialogOpen}
        onOpenChange={setEditExamDialogOpen}
        exam={exam}
      />

      <QuestionDialog
        open={questionDialogOpen}
        onOpenChange={setQuestionDialogOpen}
        examId={exam.id}
        question={selectedQuestion}
      />

      <DeleteQuestionDialog
        open={deleteQuestionDialogOpen}
        onOpenChange={setDeleteQuestionDialogOpen}
        question={selectedQuestion}
      />

      <CreateWhatsAppCampaignDialog
        open={createCampaignDialogOpen}
        onOpenChange={setCreateCampaignDialogOpen}
        examId={exam.id}
      />

      <WhatsAppCampaignDetailsDialog
        open={campaignDetailsDialogOpen}
        onOpenChange={setCampaignDetailsDialogOpen}
        campaign={selectedCampaign}
      />

      <DeleteWhatsAppCampaignDialog
        open={deleteCampaignDialogOpen}
        onOpenChange={setDeleteCampaignDialogOpen}
        campaign={selectedCampaign}
      />

      <AddCandidateDialog
        open={addCandidateDialogOpen}
        onOpenChange={setAddCandidateDialogOpen}
        examId={exam.id}
      />

      {/* Reset Candidate Dialog */}
      <Dialog open={resetCandidateDialogOpen} onOpenChange={setResetCandidateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resetar Candidato</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja resetar este candidato? Isso removerá o registro atual
              e permitirá que você reenvie o template/convide novamente.
            </DialogDescription>
          </DialogHeader>
          {selectedCandidateForReset && (
            <div className="py-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">{selectedCandidateForReset.user.name}</span>
                </div>
                <div className="text-sm text-gray-600 ml-6">
                  <div>Status atual: <span className="font-medium">{getStatusLabel(selectedCandidateForReset.status)}</span></div>
                  {selectedCandidateForReset.failureReason && (
                    <div className="text-red-600 mt-1">
                      Erro: {selectedCandidateForReset.failureReason}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setResetCandidateDialogOpen(false);
                setSelectedCandidateForReset(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmReset}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Resetar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
