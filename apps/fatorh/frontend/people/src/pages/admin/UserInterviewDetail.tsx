import { useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import {
  Users,
  MessageSquare,
  CheckCircle,
  ArrowLeft,
  Play,
  Star,
} from "lucide-react";

export default function UserInterviewDetail() {
  const { examId, userId } = useParams<{ examId: string; userId: string }>();
  const navigate = useNavigate();
  const { filteredExams, filteredAnswers, filteredEvaluationResults } = useWorkspace();

  const exam = useMemo(() => {
    return filteredExams.find((e) => e.id === examId);
  }, [examId, filteredExams]);

  // TODO: Implement users API endpoint
  const user = useMemo(() => {
    return { id: userId, name: "Usuário", email: "" };
  }, [userId]);

  const userAnswers = useMemo(() => {
    if (!userId || !examId) return [];
    return filteredAnswers
      .filter((a) => a.userId === userId && a.examId === examId)
      .map((answer) => {
        const answerExam = filteredExams.find((e) => e.id === answer.examId);
        return { ...answer, examName: answerExam?.examName || "N/A" };
      });
  }, [userId, examId, filteredExams, filteredAnswers]);

  const userResult = useMemo(() => {
    if (!userId || !examId) return null;
    return filteredEvaluationResults.find(
      (r) => r.userId === userId && r.examId === examId
    );
  }, [userId, examId]);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  const formatRelativeDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "hoje";
    if (days === 1) return "ontem";
    return `${days} dias atrás`;
  };

  if (!exam || !user) {
    return (
      <div className="min-h-full p-8 md:p-10 lg:p-12 pb-20">
        <div className="text-center">
          <p className="text-gray-600">Dados não encontrados</p>
          <Button onClick={() => navigate(-1)} className="mt-4">
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  const averageScore = userResult
    ? parseFloat(userResult.overallScore)
    : 0;
  const totalQuestions = userAnswers.length;
  const answeredQuestions = userResult
    ? parseInt(userResult.transcribedAnswers, 10)
    : 0;
  const status = userResult
    ? userResult.completionStatus === "completed"
      ? "Avaliação concluída"
      : "Em avaliação"
    : "Em andamento";

  // Mock de pergunta e resposta para demonstração
  const sampleAnswer = userAnswers[0];
  const sampleQuestion = "Olá! Tudo bem? Pode me contar um pouco sobre sua experiência profissional? Quais tecnologias você já trabalhou?";
  const sampleTranscription = userResult?.transcriptions?.[0]?.transcription ||
    "Oi! Tudo bem sim, obrigado. Então, eu tenho 5 anos de experiência como desenvolvedor full-stack. Comecei trabalhando com JavaScript, depois aprendi React e Node.js. Já trabalhei com PostgreSQL e MongoDB também. Minha experiência inclui duas startups e uma empresa de médio porte, onde desenvolvi principalmente e-commerce e sistemas de gestão. Gosto muito da área e sempre busco me manter atualizado.";
  const sampleScore = userResult?.analysisResults?.[0]?.score || 9.0;

  return (
    <div className="min-h-full p-8 md:p-10 lg:p-12 pb-20">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="p-2 cursor-pointer hover:bg-amber-300 hover:text-black"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          {/* <div className="text-sm text-gray-600 mb-1">
            {program.name} Respostas: Alinhamento inicial
          </div> */}
          <h1 className="text-2xl font-bold text-gray-900">{`Entrevista: ${user.name}`}</h1>
        </div>
      </div>

      {/* Cards de Resumo do Candidato */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        {/* Card 1: Talento */}
        <Card className="bg-yellow-50 border-yellow-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-amber-400" />
                  <h3 className="text-lg font-semibold text-gray-900">Talento</h3>
                </div>
                <div className="text-2xl font-bold text-amber-400 mb-1">
                  {user.name}
                </div>
                <p className="text-sm text-gray-600">Candidato entrevistado</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Perguntas Respondidas */}
        <Card className="bg-white border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-5 h-5 text-amber-400" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Perguntas respondidas
                  </h3>
                </div>
                <div className="text-4xl font-bold text-amber-400 mb-2">
                  {answeredQuestions}
                </div>
                <p className="text-sm text-gray-600">
                  Total de perguntas: {totalQuestions}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Pontuação Média */}
        <Card className="bg-white border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-5 h-5 text-amber-400" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Pontuação média
                  </h3>
                </div>
                <div className="text-4xl font-bold text-amber-400 mb-2">
                  {averageScore.toFixed(1)}
                </div>
                <p className="text-sm text-gray-600">Qualidade das respostas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Status da Entrevista */}
        <Card className="bg-white border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-amber-400" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Status da entrevista
                  </h3>
                </div>
                <div className="text-lg font-semibold text-amber-400 mb-2">
                  {status}
                </div>
                <p className="text-sm text-gray-600">Avaliação concluída</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detalhe da Pergunta e Resposta */}
      <Card className="bg-white border shadow-sm">
        <CardContent className="p-4">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              1 {sampleQuestion}
            </h3>

            {/* Player de Áudio */}
            <div className="flex items-center gap-4 mb-6 p-2 bg-gray-50 rounded-lg">
              <Button
                variant="outline"
                size="sm"
                className="bg-amber-300 text-black cursor-pointer hover:bg-amber-400"
              >
                <Play className="w-4 h-4 mr-2" />
                Reproduzir
              </Button>
              <div className="flex-1 h-2 bg-gray-200 rounded-full">
                <div className="h-full bg-amber-400 rounded-full w-1/4"></div>
              </div>
              <span className="text-sm text-gray-600">0:24</span>
              <span className="text-sm text-gray-500">
                {sampleAnswer
                  ? formatRelativeDate(sampleAnswer.createdAt)
                  : "ontem"} {sampleAnswer ? formatDate(sampleAnswer.createdAt).split(" ")[1] : "14:42"}
              </span>
              <span className="text-sm text-gray-500">1x</span>
            </div>

            {/* Score */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-sm text-gray-600">Peso alto</span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-amber-400">
                  {sampleScore.toFixed(1)} / 10
                </div>
              </div>
            </div>

            {/* Transcrição */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3 uppercase">
                TRANSCRIÇÃO
              </h4>
              <p className="text-gray-700 leading-relaxed">{sampleTranscription}</p>
            </div>

            {/* Avaliação da IA (Ocultável) */}
            <div className="mt-6 pt-6 border-t">
              <div className="flex items-center gap-2 mb-3">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <button className="text-sm text-gray-600 hover:text-gray-900">
                  Ocultar avaliação da IA
                </button>
              </div>
              {userResult?.analysisResults?.[0]?.feedback && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-700">
                    {userResult.analysisResults[0].feedback}
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

