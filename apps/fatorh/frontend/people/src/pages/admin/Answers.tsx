import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/PageHeader";
import { useWorkspace } from "@/contexts/WorkspaceContext";

export default function Answers() {
  const [searchTerm, setSearchTerm] = useState("");
  const { filteredAnswers } = useWorkspace();

  // TODO: Implement answers API endpoint and use useAnswers hook
  const filteredAnswersList = filteredAnswers.filter(
    (answer) =>
      answer.externalId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      answer.s3Url.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  const formatFileSize = (bytes: string) => {
    const size = parseFloat(bytes);
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="min-h-full p-8 md:p-10 lg:p-12 pb-20">
      <PageHeader title="Respostas" />

      <p className="text-gray-600 mb-6 mt-2">
        Visualize todas as respostas enviadas pelos participantes.
      </p>

      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-4 border-b">
          <Input
            placeholder="Buscar respostas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-xs"
          />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID Externo</TableHead>
              <TableHead>Exame</TableHead>
              <TableHead>Duração (s)</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Tamanho</TableHead>
              <TableHead>Válido</TableHead>
              <TableHead>Criado em</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAnswersList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-gray-500">
                  {searchTerm ? "Nenhuma resposta encontrada" : "Nenhuma resposta cadastrada ainda."}
                </TableCell>
              </TableRow>
            ) : (
              filteredAnswersList.map((answer) => (
                <TableRow key={answer.id}>
                  <TableCell className="font-medium">
                    {answer.externalId || "-"}
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {answer.examId}
                  </TableCell>
                  <TableCell>{answer.duration}</TableCell>
                  <TableCell className="text-gray-600">
                    {answer.contentType}
                  </TableCell>
                  <TableCell>{formatFileSize(answer.fileSize)}</TableCell>
                  <TableCell>
                    {answer.isValid ? (
                      <span className="text-green-600">Sim</span>
                    ) : (
                      <span className="text-red-600">Não</span>
                    )}
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {formatDate(answer.createdAt)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        Total: {filteredAnswersList.length} resposta(s)
      </div>
    </div>
  );
}

