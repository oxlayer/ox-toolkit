import { useState } from "react";
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
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Download, Plus, FileText, Edit } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import AddCompanyDialog from "./AddCompanyDialog";
import EditCompanyDialog from "./EditCompanyDialog";
import type { Company } from "@/types/admin";

export default function Companies() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [addCompanyOpen, setAddCompanyOpen] = useState(false);
  const [editCompanyOpen, setEditCompanyOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const { currentWorkspace } = useWorkspace();

  // TODO: Implement companies API endpoint and use useCompanies hook
  // For now, showing empty state
  const companies: Company[] = [];

  const filteredCompaniesList = companies.filter(
    (company) =>
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (company.description &&
        company.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-full p-8 md:p-10 lg:p-12 pb-20">
      <PageHeader title="Pessoas" />

      <div className="mb-6 mt-2">
        <p className="text-gray-600">
          Visão de todas as empresas do workspace.
        </p>
        {currentWorkspace && (
          <p className="text-sm text-amber-600 font-medium mt-1">
            Workspace: {currentWorkspace.name}
          </p>
        )}
      </div>

      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="sm" className="cursor-pointer">
          <Download className="w-4 h-4 mr-2" />
          Download Global
        </Button>
        <Button
          className="bg-amber-300 cursor-pointer hover:bg-amber-400 text-black"
          onClick={() => setAddCompanyOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Empresa
        </Button>
      </div>

      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-4 border-b">
          <Input
            placeholder="Buscar empresas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-xs"
          />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome da Empresa</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCompaniesList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-gray-500">
                  {searchTerm ? "Nenhuma empresa encontrada" : "Nenhuma empresa cadastrada. Adicione uma nova empresa para começar."}
                </TableCell>
              </TableRow>
            ) : (
              filteredCompaniesList.map((company) => (
                <TableRow key={company.id}>
                  <TableCell className="font-medium">
                    {company.name}
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {company.description || "-"}
                  </TableCell>
                  <TableCell>
                    {company.deletedAt ? (
                      <span className="text-red-600">Excluído</span>
                    ) : (
                      <span className="text-green-600">Ativo</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <button
                        className="p-1 hover:bg-amber-300 rounded cursor-pointer"
                        title="Acessar Detalhes"
                        onClick={() => navigate(`/pessoas/${company.id}`)}
                      >
                        <FileText className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        className="p-1 hover:bg-amber-300 rounded cursor-pointer"
                        title="Editar"
                        onClick={() => {
                          setSelectedCompany(company);
                          setEditCompanyOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        className="p-1 hover:bg-amber-300 rounded cursor-pointer"
                        title="Download"
                      >
                        <Download className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        Total: {filteredCompaniesList.length} empresa(s)
      </div>

      <AddCompanyDialog
        open={addCompanyOpen}
        onOpenChange={setAddCompanyOpen}
        onSave={(data) => {
          console.log("Nova empresa:", data);
        }}
      />

      <EditCompanyDialog
        open={editCompanyOpen}
        onOpenChange={setEditCompanyOpen}
        company={selectedCompany}
        onSave={(data) => {
          console.log("Empresa editada:", data);
          setEditCompanyOpen(false);
          setSelectedCompany(null);
        }}
      />
    </div>
  );
}
