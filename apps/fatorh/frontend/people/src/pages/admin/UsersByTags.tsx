import { useState, useMemo } from "react";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Tag as TagIcon, Users, Filter } from "lucide-react";

export default function UsersByTags() {
  const {
    filteredTags,
    filteredExams,
    filteredExamCandidates,
    getTagKeys,
    getTagValuesByKey,
    getTagsByKeyAndValue,
  } = useWorkspace();

  const [selectedKey, setSelectedKey] = useState<string>("all");
  const [selectedValue, setSelectedValue] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Helper function to determine text color based on background
  const getContrastColor = (hexColor: string): string => {
    const color = hexColor.replace('#', '');
    const r = parseInt(color.substr(0, 2), 16);
    const g = parseInt(color.substr(2, 2), 16);
    const b = parseInt(color.substr(4, 2), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return yiq >= 128 ? '#000000' : '#ffffff';
  };

  // Get available values for selected key
  const availableValues = useMemo(() => {
    if (selectedKey === "all") return [];
    return getTagValuesByKey(selectedKey);
  }, [selectedKey, getTagValuesByKey]);

  // Get tag IDs that match the selected key and value
  const matchingTagIds = useMemo(() => {
    if (selectedKey === "all" || selectedValue === "all") {
      // If filtering by key only, get all tags with that key
      if (selectedKey !== "all") {
        const keyTags = filteredTags.filter(
          (tag) => tag.key && tag.key.toLowerCase() === selectedKey.toLowerCase()
        );
        return keyTags.map((t) => t.id);
      }
      return [];
    }
    // If filtering by both key and value
    const matchingTags = getTagsByKeyAndValue(selectedKey, selectedValue);
    return matchingTags.map((t) => t.id);
  }, [selectedKey, selectedValue, filteredTags, getTagsByKeyAndValue]);

  // Get exams with selected tags
  const examsWithTag = useMemo(() => {
    if (selectedKey === "all") return filteredExams;
    return filteredExams.filter((exam) =>
      (exam.tags || []).some((tagId) => matchingTagIds.includes(tagId))
    );
  }, [filteredExams, selectedKey, matchingTagIds]);

  // Get exam IDs
  const examIds = useMemo(() => examsWithTag.map((e) => e.id), [examsWithTag]);

  // Get users/candidates from exams with selected tag
  const usersFromExams = useMemo(() => {
    const candidates = filteredExamCandidates.filter((c) =>
      examIds.includes(c.examId)
    );

    // Group by exam
    const grouped = candidates.reduce((acc, candidate) => {
      if (!acc[candidate.examId]) {
        const exam = examsWithTag.find((e) => e.id === candidate.examId);
        acc[candidate.examId] = {
          examName: exam?.examName || "N/A",
          examTags: exam?.tags || [],
          users: [],
        };
      }
      acc[candidate.examId].users.push(candidate);
      return acc;
    }, {} as Record<string, { examName: string; examTags: string[]; users: typeof filteredExamCandidates }>);

    return Object.entries(grouped).map(([examId, data]) => ({
      examId,
      ...data,
    }));
  }, [filteredExamCandidates, examIds, examsWithTag]);

  // Filter by search term
  const filteredUsers = useMemo(() => {
    if (!searchTerm) return usersFromExams;

    return usersFromExams
      .map((group) => ({
        ...group,
        users: group.users.filter((user) =>
          user.userId.toLowerCase().includes(searchTerm.toLowerCase())
        ),
      }))
      .filter((group) => group.users.length > 0);
  }, [usersFromExams, searchTerm]);

  // Get stats
  const stats = useMemo(() => {
    const totalExams = examsWithTag.length;
    const totalUsers = filteredExamCandidates.filter((c) =>
      examIds.includes(c.examId)
    ).length;

    return { totalExams, totalUsers };
  }, [examsWithTag, filteredExamCandidates, examIds]);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "Concluído";
      case "in_progress":
        return "Em Progresso";
      case "failed":
        return "Falhou";
      case "invited":
        return "Convidado";
      default:
        return status;
    }
  };

  // Reset value when key changes
  const handleKeyChange = (key: string) => {
    setSelectedKey(key);
    setSelectedValue("all");
  };

  const getFilterLabel = () => {
    if (selectedKey === "all") return "Todas as Tags";
    if (selectedValue === "all") return `Chave: ${selectedKey}`;
    return `${selectedKey}: ${selectedValue}`;
  };

  return (
    <div className="min-h-full p-8 md:p-10 lg:p-12 pb-20">
      <PageHeader title="Usuários por Tags" />

      <div className="flex items-center justify-between mb-6 mt-2">
        <p className="text-gray-600">
          Visualize usuários filtrados por tags.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-white border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-100 rounded-lg">
                <TagIcon className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Filtro Atual</p>
                <p className="text-lg font-bold text-gray-900 truncate">
                  {getFilterLabel()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Filter className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Exames Filtrados</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalExams}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total de Usuários</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-white border shadow-sm mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label>Filtrar por Chave</Label>
              <Select value={selectedKey} onValueChange={handleKeyChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma chave" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Chaves</SelectItem>
                  {getTagKeys().map((key) => (
                    <SelectItem key={key} value={key}>
                      <span className="px-2 py-1 bg-gray-100 rounded-md text-sm font-mono">
                        {key}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <Label>Filtrar por Valor</Label>
              <Select
                value={selectedValue}
                onValueChange={setSelectedValue}
                disabled={selectedKey === "all" || availableValues.length === 0}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={selectedKey === "all" ? "Selecione uma chave primeiro" : "Selecione um valor"}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Valores</SelectItem>
                  {availableValues.map((value) => {
                    const tag = filteredTags.find(
                      (t) => t.key && t.value && t.key.toLowerCase() === selectedKey.toLowerCase() && t.value.toLowerCase() === value.toLowerCase()
                    );
                    return (
                      <SelectItem key={value} value={value}>
                        <div className="flex items-center gap-2">
                          {tag && (
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: tag.color }}
                            />
                          )}
                          {value}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <Label>Buscar Usuário</Label>
              <Input
                placeholder="Buscar por ID do usuário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {filteredUsers.length === 0 ? (
        <Card className="bg-white border shadow-sm">
          <CardContent className="p-12">
            <div className="text-center">
              <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {stats.totalExams > 0 ? "Nenhum usuário adicionado" : "Nenhum usuário encontrado"}
              </h3>
              <p className="text-gray-600">
                {selectedKey === "all"
                  ? "Selecione uma chave de tag para filtrar os usuários."
                  : stats.totalExams > 0 && selectedValue !== "all"
                    ? `Encontramos ${stats.totalExams} exame${stats.totalExams !== 1 ? 's' : ''} com a tag "${selectedKey}: ${selectedValue}", mas nenhum usuário foi adicionado a esses exames. Vá até a página de Exames para adicionar candidatos.`
                    : stats.totalExams > 0
                    ? `Encontramos ${stats.totalExams} exame${stats.totalExams !== 1 ? 's' : ''} com a chave "${selectedKey}", mas nenhum usuário foi adicionado a esses exames. Vá até a página de Exames para adicionar candidatos.`
                    : selectedValue === "all"
                    ? `Não há exames com a chave "${selectedKey}".`
                    : `Não há exames com a tag "${selectedKey}: ${selectedValue}".`}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {filteredUsers.map((group) => (
            <Card key={group.examId} className="bg-white border shadow-sm">
              <CardContent className="p-6">
                {/* Exam header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {group.examName}
                    </h3>
                    {group.examTags.map((tagId) => {
                      const tag = filteredTags.find((t) => t.id === tagId);
                      if (!tag) return null;
                      return (
                        <div
                          key={tag.id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: tag.color,
                            color: getContrastColor(tag.color),
                          }}
                        >
                          <TagIcon className="w-3 h-3" />
                          {tag.key}: {tag.value}
                        </div>
                      );
                    })}
                  </div>
                  <span className="text-sm text-gray-600">
                    {group.users.length} usuário{group.users.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Users table */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID do Usuário</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Convidado em</TableHead>
                      <TableHead>Concluído em</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.userId}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              user.status
                            )}`}
                          >
                            {getStatusLabel(user.status)}
                          </span>
                        </TableCell>
                        <TableCell>{formatDate(user.invitedAt)}</TableCell>
                        <TableCell>
                          {user.completedAt
                            ? formatDate(user.completedAt)
                            : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
