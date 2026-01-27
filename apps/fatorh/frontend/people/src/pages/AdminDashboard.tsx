import { useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import {
  Users,
  TrendingUp,
  MessageSquare,
  FileText,
  Calendar,
} from "lucide-react";

type PeriodFilter = "7d" | "30d" | "90d" | "year" | "all";

export default function AdminDashboard() {
  const [period, setPeriod] = useState<PeriodFilter>("all");
  const [selectedExamId, setSelectedExamId] = useState<string>("all");
  const {
    currentWorkspace,
    filteredExams,
    filteredAnswers,
    filteredEvaluationResults,
  } = useWorkspace();

  // Função para filtrar dados por período
  const getDateFilter = (period: PeriodFilter): Date | null => {
    const now = new Date();
    switch (period) {
      case "7d":
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case "30d":
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case "90d":
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      case "year":
        return new Date(now.getFullYear(), 0, 1);
      case "all":
      default:
        return null;
    }
  };

  // Calcular estatísticas agregadas com filtro de período, exame e workspace
  const stats = useMemo(() => {
    const dateFilter = getDateFilter(period);

    // Filter by exam first
    const examFilteredAnswers = selectedExamId !== "all"
      ? filteredAnswers.filter((a) => a.examId === selectedExamId)
      : filteredAnswers;

    const examFilteredResults = selectedExamId !== "all"
      ? filteredEvaluationResults.filter((r) => r.examId === selectedExamId)
      : filteredEvaluationResults;

    // Then filter by period
    const periodFilteredAnswers = dateFilter
      ? examFilteredAnswers.filter((a) => new Date(a.createdAt) >= dateFilter)
      : examFilteredAnswers;

    const periodFilteredResults = dateFilter
      ? examFilteredResults.filter(
        (r) => new Date(r.createdAt) >= dateFilter
      )
      : examFilteredResults;

    const totalAnswers = periodFilteredAnswers.length;
    const totalHoursSaved = periodFilteredAnswers.reduce((acc, answer) => {
      return acc + parseFloat(answer.duration) / 60;
    }, 0);

    const completedResults = periodFilteredResults.filter(
      (r) => r.completionStatus === "completed"
    );
    const averageNPS =
      completedResults.length > 0
        ? completedResults.reduce(
          (acc, r) => acc + parseFloat(r.overallScore),
          0
        ) / completedResults.length
        : 0;

    const npsComments = [
      "Bastante intuitivo e bem formulado",
      "Excelente experiência de uso",
      "Interface clara e objetiva",
    ];

    const totalExams = filteredExams.length;

    return {
      totalAnswers,
      totalHoursSaved,
      averageNPS,
      npsComments,
      totalExams,
    };
  }, [
    period,
    selectedExamId,
    filteredAnswers,
    filteredEvaluationResults,
    filteredExams,
  ]);

  // Dados para gráfico de respostas por período
  const chartData = useMemo(() => {
    const dateFilter = getDateFilter(period);

    // Filter by exam first
    const examFilteredAnswers = selectedExamId !== "all"
      ? filteredAnswers.filter((a) => a.examId === selectedExamId)
      : filteredAnswers;

    const periodFilteredAnswers = dateFilter
      ? examFilteredAnswers.filter((a) => new Date(a.createdAt) >= dateFilter)
      : examFilteredAnswers;

    // Agrupar respostas por data (simplificado)
    const answersByDate: { [key: string]: number } = {};
    periodFilteredAnswers.forEach((answer) => {
      const dateKey = new Date(answer.createdAt).toLocaleDateString("pt-BR");
      answersByDate[dateKey] = (answersByDate[dateKey] || 0) + 1;
    });

    // Converter para array e ordenar
    const sortedData = Object.entries(answersByDate)
      .map(([date, count]) => ({ date, count }))
      .sort(
        (a, b) =>
          new Date(a.date.split("/").reverse().join("-")).getTime() -
          new Date(b.date.split("/").reverse().join("-")).getTime()
      );

    return sortedData;
  }, [period, selectedExamId, filteredAnswers]);

  // Dados para gráfico de distribuição de scores
  const scoreDistribution = useMemo(() => {
    const dateFilter = getDateFilter(period);

    // Filter by exam first
    const examFilteredResults = selectedExamId !== "all"
      ? filteredEvaluationResults.filter((r) => r.examId === selectedExamId)
      : filteredEvaluationResults;

    const periodFilteredResults = dateFilter
      ? examFilteredResults.filter(
        (r) => new Date(r.createdAt) >= dateFilter
      )
      : examFilteredResults;

    const completedResults = periodFilteredResults.filter(
      (r) => r.completionStatus === "completed"
    );

    // Distribuição de scores (0-2, 2-4, 4-6, 6-8, 8-10)
    const distribution = [
      { range: "0-2", count: 0 },
      { range: "2-4", count: 0 },
      { range: "4-6", count: 0 },
      { range: "6-8", count: 0 },
      { range: "8-10", count: 0 },
    ];

    completedResults.forEach((result) => {
      const score = parseFloat(result.overallScore);
      if (score < 2) distribution[0].count++;
      else if (score < 4) distribution[1].count++;
      else if (score < 6) distribution[2].count++;
      else if (score < 8) distribution[3].count++;
      else distribution[4].count++;
    });

    const maxCount = Math.max(...distribution.map((d) => d.count), 1);
    return distribution.map((d) => ({
      ...d,
      percentage: (d.count / maxCount) * 100,
    }));
  }, [period, selectedExamId, filteredEvaluationResults]);

  return (
    <div className="min-h-full p-8 md:p-10 lg:p-12 pb-20">
      <PageHeader title="Dashboard" />

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 mt-2">
        <div>
          <p className="text-gray-600">
            Visão geral do sistema com métricas e indicadores de desempenho.
          </p>
          {currentWorkspace && (
            <p className="text-sm text-amber-600 font-medium mt-1">
              Workspace: {currentWorkspace.name}
            </p>
          )}
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-4">
          {/* Filtro de período */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <Select
              value={period}
              onValueChange={(value) => setPeriod(value as PeriodFilter)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Selecione o período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Últimos 7 dias</SelectItem>
                <SelectItem value="30d">Últimos 30 dias</SelectItem>
                <SelectItem value="90d">Últimos 90 dias</SelectItem>
                <SelectItem value="year">Este ano</SelectItem>
                <SelectItem value="all">Todos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filtro de exame */}
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-500" />
            <Select
              value={selectedExamId}
              onValueChange={(value) => setSelectedExamId(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Todos os exames" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os exames</SelectItem>
                {filteredExams.map((exam) => (
                  <SelectItem key={exam.id} value={exam.id}>
                    {exam.examName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {/* Card 1: Respostas */}
        <Card className="bg-white border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-amber-400" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Respostas
                  </h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Total de respostas realizadas
                </p>
                <div className="text-4xl font-bold text-amber-400 mb-2">
                  {stats.totalAnswers}
                </div>
                <p className="text-sm text-green-600">
                  {Math.round(stats.totalHoursSaved)} horas economizadas
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: NPS */}
        <Card className="bg-white border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-amber-400" />
                  <h3 className="text-lg font-semibold text-gray-900">NPS</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Avaliação realizada pelos participantes
                </p>
                <div className="text-4xl font-bold text-amber-400 mb-2">
                  {stats.averageNPS.toFixed(2)} / 10
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="text-sm text-gray-600">Promotores</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Comentários NPS */}
        <Card className="bg-white border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-5 h-5 text-amber-400" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Comentários NPS
                  </h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  {stats.npsComments[0]}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Exames */}
        <Card className="bg-white border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-5 h-5 text-amber-400" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Exames
                  </h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Total de exames no workspace
                </p>
                <div className="text-4xl font-bold text-amber-400 mb-2">
                  {stats.totalExams}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Respostas por Período */}
        <Card className="bg-white border shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Respostas por Período
            </h3>
            {chartData.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-gray-500">
                Nenhum dado disponível para o período selecionado
              </div>
            ) : (
              <div className="h-40 flex items-end gap-2">
                {chartData.map((item, index) => {
                  const maxCount = Math.max(...chartData.map((d) => d.count), 1);
                  const height = (item.count / maxCount) * 100;
                  return (
                    <div
                      key={index}
                      className="flex-1 flex flex-col items-center gap-1"
                    >
                      <span className="text-xs text-gray-600 font-medium">
                        {item.count}
                      </span>
                      <div
                        className="w-full bg-amber-400 rounded-t transition-all duration-300 hover:bg-amber-500"
                        style={{ height: `${Math.max(height, 5)}%` }}
                        title={`${item.date}: ${item.count} respostas`}
                      />
                      <span className="text-xs text-gray-500 truncate w-full text-center">
                        {item.date.slice(0, 5)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gráfico de Distribuição de Scores */}
        <Card className="bg-white border shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Distribuição de Scores
            </h3>
            <div className="space-y-3">
              {scoreDistribution.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-12">
                    {item.range}
                  </span>
                  <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all duration-300"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-8 text-right">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-4 text-center">
              Distribuição das pontuações dos candidatos (escala 0-10)
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
