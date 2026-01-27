import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Users,
  Clock,
  Star,
  CheckCircle,
  ArrowLeft,
  Edit,
  Eye
} from "lucide-react";
import EditCompanyDialog from "./EditCompanyDialog";
import type { Company } from "@/types/admin";

interface UserStats {
  name: string;
  email: string;
  totalAnswers: number;
  averageScore: number;
  averageCSAT: number;
  status: "completed" | "partial" | "failed" | "in_progress";
  lastInterviewDate: Date | null;
  examName: string;
}

export default function CompanyDetails() {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [editCompanyOpen, setEditCompanyOpen] = useState(false);

  // TODO: Implement companies API endpoint
  const company: Company | null = null;

  const stats = {
    totalInterviews: 0,
    totalHoursSaved: 0,
    averageCSAT: 0,
    averageScore: 0,
  };

  const usersWithStats: UserStats[] = [];

  const filteredUsers = usersWithStats.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(date));
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "Entrevista concluída";
      case "partial":
        return "Em andamento";
      case "failed":
        return "Pré-eliminado";
      case "in_progress":
        return "Acabou a entrevista";
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
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (!company) {
    return (
      <div className="min-h-full p-8 md:p-10 lg:p-12 pb-20">
        <div className="text-center">
          <p className="text-gray-600">Empresa não encontrada</p>
          <Button onClick={() => navigate("/pessoas")} className="mt-4">
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  const hasData = stats.totalInterviews > 0;

  return (
    <div className="min-h-full p-8 md:p-10 lg:p-12 pb-20">
      <div className="flex items-center gap-4 mb-6">

        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/pessoas")}
          className="p-2 cursor-pointer hover:bg-amber-300 hover:text-black"
        >
          <ArrowLeft className="w-5 h-5" />

        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
        </div>


        <Button className="bg-amber-300 hover:bg-amber-400 cursor-pointer text-black" onClick={() => setEditCompanyOpen(true)}>
          <Edit className="w-4 h-4 mr-2" />
          Editar Empresa
        </Button>
      </div>

      {/* Cards de Resumo (KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        {/* Card 1: Total de Entrevistas */}
        <Card className="bg-amber-50 border-amber-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-yellow-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Total de entrevistas
                  </h3>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  Candidatos avaliados
                </p>
                <div className="text-4xl font-bold text-amber-600">
                  {stats.totalInterviews}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Horas Economizadas */}
        <Card className="bg-white border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-amber-400" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Horas economizadas
                  </h3>
                </div>
                <div className="text-4xl font-bold text-amber-400 mb-2">
                  {stats.totalHoursSaved.toFixed(1)}h
                </div>
                <p className="text-sm text-gray-600">
                  = {Math.round(stats.totalHoursSaved / 8)} dias úteis
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: CSAT Médio */}
        <Card className="bg-white border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-5 h-5 text-amber-400" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    CSAT Médio
                  </h3>
                </div>
                <div className="text-4xl font-bold text-amber-400 mb-2">
                  {stats.averageCSAT.toFixed(1)}/5
                </div>
                <p className="text-sm text-gray-600">
                  Satisfação dos candidatos
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Pontuação Média */}
        <Card className="bg-white border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-amber-400" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Pontuação média
                  </h3>
                </div>
                <div className="text-4xl font-bold text-amber-400 mb-2">
                  {stats.averageScore.toFixed(1)}
                </div>
                <p className="text-sm text-gray-600">
                  Qualidade dos talentos
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <EditCompanyDialog
          open={editCompanyOpen}
          onOpenChange={setEditCompanyOpen}
          company={company}
          onSave={(data) => {
            console.log("Empresa editada:", data);
            // Aqui você pode adicionar a lógica para atualizar a empresa
            setEditCompanyOpen(false);
            setSelectedCompany(null);
          }}
        />
      </div>

      {/* Tabela de Usuários */}
      {hasData ? (
        <>
          <div className="bg-white rounded-lg border shadow-sm">
            <div className="p-4 border-b">
              <Input
                placeholder="Buscar talentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-xs"
              />
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome do talento</TableHead>
                  <TableHead>Pontuação</TableHead>
                  <TableHead>CSAT</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data da entrevista</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500">
                      Nenhum talento encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((item, index) => (
                    <TableRow key={`${item.email}-${index}`}>
                      <TableCell className="font-medium flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        {item.name}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                          <span className="font-semibold">
                            {item.averageScore.toFixed(1)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                          <span>{item.averageCSAT.toFixed(1)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            item.status
                          )}`}
                        >
                          {getStatusLabel(item.status)}
                        </span>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {item.lastInterviewDate
                          ? formatDate(item.lastInterviewDate)
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          className="cursor-pointer hover:bg-amber-300 hover:text-black "
                          size="sm"
                        >
                          Ver entrevista
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
            Total: {filteredUsers.length} talento(s)
          </div>
        </>
      ) : (
        <div className="bg-white rounded-lg border shadow-sm p-8 text-center">
          <p className="text-gray-600 mb-4">
            Esta empresa ainda não possui exames ou entrevistas cadastradas.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              // Aqui você pode adicionar lógica para criar um exame
              console.log("Criar exame para empresa:", company.id);
            }}
          >
            Criar Primeiro Exame
          </Button>
        </div>
      )}



    </div>
  );
}

