import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
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
import { Eye, Plus, Pencil, Trash2, Copy, X } from "lucide-react";
import type { Exam } from "@/types/admin";
import CreateExamDialog from "./CreateExamDialog";
import EditExamDialog from "./EditExamDialog";
import DeleteExamDialog from "./DeleteExamDialog";
import CloneExamDialog from "./CloneExamDialog";

type StatusFilter = "all" | "in_progress" | "completed" | "failed" | "invited";
type PeriodFilter = "all" | "last_30" | "last_60" | "last_90";

export default function Exams() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("all");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const navigate = useNavigate();
  const {
    filteredExams,
    currentWorkspace,
    getQuestionsByExamId,
    getExamCandidatesByExamId,
    filteredTags,
  } = useWorkspace();

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cloneDialogOpen, setCloneDialogOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);

  const examsWithDetails = useMemo(() => {
    return filteredExams.map((exam) => {
      const questions = getQuestionsByExamId(exam.id);
      const candidates = getExamCandidatesByExamId(exam.id);
      return {
        ...exam,
        questionCount: questions.length,
        candidateCount: candidates.length,
        candidates,
      };
    });
  }, [filteredExams, getQuestionsByExamId, getExamCandidatesByExamId]);

  // Helper function to check if exam is within date range
  const isWithinDateRange = (exam: Exam, days: number) => {
    const now = new Date();
    const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return exam.createdAt >= cutoffDate;
  };

  // Helper function to check if exam has candidates with specific status
  const hasCandidatesWithStatus = (examId: string, status: StatusFilter) => {
    const candidates = getExamCandidatesByExamId(examId);
    if (status === "all") return candidates.length > 0;
    return candidates.some((c) => c.status === status);
  };

  // Helper function to check if exam has specific tag
  const hasTag = (exam: Exam, tagId: string) => {
    if (tagFilter === "all") return true;
    return exam.tags.includes(tagId);
  };

  const filteredExamsList = useMemo(() => {
    return examsWithDetails.filter((exam) => {
      // Search filter
      const matchesSearch =
        exam.examName.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;

      // Period filter
      if (periodFilter !== "all") {
        const days = periodFilter === "last_30" ? 30 : periodFilter === "last_60" ? 60 : 90;
        if (!isWithinDateRange(exam, days)) return false;
      }

      // Status filter - check if exam has candidates with the selected status
      if (statusFilter !== "all") {
        if (!hasCandidatesWithStatus(exam.id, statusFilter)) return false;
      }

      // Tag filter
      if (!hasTag(exam, tagFilter)) return false;

      return true;
    });
  }, [examsWithDetails, searchTerm, periodFilter, statusFilter, tagFilter, getExamCandidatesByExamId]);

  const clearFilters = () => {
    setStatusFilter("all");
    setPeriodFilter("all");
    setTagFilter("all");
    setSearchTerm("");
  };

  const hasActiveFilters = statusFilter !== "all" || periodFilter !== "all" || tagFilter !== "all" || searchTerm !== "";

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  const handleEdit = (exam: Exam) => {
    setSelectedExam(exam);
    setEditDialogOpen(true);
  };

  const handleDelete = (exam: Exam) => {
    setSelectedExam(exam);
    setDeleteDialogOpen(true);
  };

  const handleClone = (exam: Exam) => {
    setSelectedExam(exam);
    setCloneDialogOpen(true);
  };

  return (
    <div className="min-h-full p-8 md:p-10 lg:p-12 pb-20">
      <div className="flex items-center justify-between">
        <PageHeader title="Exames" />
        <Button
          onClick={() => setCreateDialogOpen(true)}
          className="bg-amber-500 hover:bg-amber-600 cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-2" />
          Criar Exame
        </Button>
      </div>

      <div className="mb-6 mt-2">
        <p className="text-gray-600">
          Gerencie todos os exames cadastrados no workspace.
        </p>
        {currentWorkspace && (
          <p className="text-sm text-amber-600 font-medium mt-1">
            Workspace: {currentWorkspace.name}
          </p>
        )}
      </div>

      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-4 border-b space-y-4">
          {/* Search row */}
          <div className="flex flex-wrap items-center gap-4">
            <Input
              placeholder="Buscar exames..."
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
              <label className="text-sm font-medium text-gray-700">Status:</label>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="in_progress">Em andamento</SelectItem>
                  <SelectItem value="completed">Concluída</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Period Filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Período:</label>
              <Select value={periodFilter} onValueChange={(value) => setPeriodFilter(value as PeriodFilter)}>
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

            {/* Tags Filter */}
            {filteredTags.length > 0 && (
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Tags:</label>
                <Select value={tagFilter} onValueChange={setTagFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {filteredTags.map((tag) => (
                      <SelectItem key={tag.id} value={tag.id}>
                        {tag.key}: {tag.value}
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
              <TableHead>Nome do Exame</TableHead>
              <TableHead>Perguntas</TableHead>
              <TableHead>Candidatos</TableHead>
              <TableHead>Duração (min)</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredExamsList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-500">
                  Nenhum exame encontrado neste workspace
                </TableCell>
              </TableRow>
            ) : (
              filteredExamsList.map((exam) => (
                <TableRow key={exam.id}>
                  <TableCell className="font-medium">
                    {exam.examName}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${exam.questionCount > 0
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-600"
                        }`}
                    >
                      {exam.questionCount} pergunta(s)
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${exam.candidateCount > 0
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-600"
                        }`}
                    >
                      {exam.candidateCount} candidato(s)
                    </span>
                  </TableCell>
                  <TableCell>{exam.durationMinutes}</TableCell>
                  <TableCell className="text-gray-600">
                    {formatDate(exam.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        className="cursor-pointer hover:bg-amber-300 hover:text-black"
                        size="sm"
                        onClick={() => navigate(`/exames/${exam.id}`)}
                        title="Ver Detalhes"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        className="cursor-pointer hover:bg-blue-100 hover:text-blue-700"
                        size="sm"
                        onClick={() => handleEdit(exam)}
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        className="cursor-pointer hover:bg-purple-100 hover:text-purple-700"
                        size="sm"
                        onClick={() => handleClone(exam)}
                        title="Clonar"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        className="cursor-pointer hover:bg-red-100 hover:text-red-700"
                        size="sm"
                        onClick={() => handleDelete(exam)}
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

      <div className="mt-4 text-sm text-gray-600">
        Total: {filteredExamsList.length} exame(s)
      </div>

      {/* Dialogs */}
      <CreateExamDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      <EditExamDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        exam={selectedExam}
      />

      <DeleteExamDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        exam={selectedExam}
      />

      <CloneExamDialog
        open={cloneDialogOpen}
        onOpenChange={setCloneDialogOpen}
        exam={selectedExam}
      />
    </div>
  );
}
