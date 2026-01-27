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
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import PageHeader from "@/components/PageHeader";
import { Plus, Pencil, Trash2, MessageCircle, Mail } from "lucide-react";
import type { Template } from "@/types/admin";
import CreateTemplateDialog from "./CreateTemplateDialog";
import EditTemplateDialog from "./EditTemplateDialog";
import DeleteTemplateDialog from "./DeleteTemplateDialog";

export default function Templates() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"whatsapp" | "email">("whatsapp");

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  const { filteredTemplates, currentWorkspace } = useWorkspace();

  const whatsappTemplates = filteredTemplates.filter((t) => t.type === "whatsapp");
  const emailTemplates = filteredTemplates.filter((t) => t.type === "email");

  const filterTemplates = (templates: Template[]) => {
    return templates.filter(
      (template) =>
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const filteredWhatsAppTemplates = filterTemplates(whatsappTemplates);
  const filteredEmailTemplates = filterTemplates(emailTemplates);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  const handleEdit = (template: Template) => {
    setSelectedTemplate(template);
    setEditDialogOpen(true);
  };

  const handleDelete = (template: Template) => {
    setSelectedTemplate(template);
    setDeleteDialogOpen(true);
  };

  const renderTemplateTable = (templates: Template[]) => (
    <div className="bg-white rounded-lg border shadow-sm">
      <div className="p-4 border-b">
        <Input
          placeholder="Buscar templates..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs"
        />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Título</TableHead>
            <TableHead>Variáveis</TableHead>
            <TableHead>Mídia</TableHead>
            <TableHead>Botões</TableHead>
            <TableHead>Atualizado em</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {templates.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-gray-500">
                {searchTerm
                  ? "Nenhum template encontrado com este filtro"
                  : "Nenhum template cadastrado"}
              </TableCell>
            </TableRow>
          ) : (
            templates.map((template) => (
              <TableRow key={template.id}>
                <TableCell className="font-medium">{template.name}</TableCell>
                <TableCell className="text-gray-600">{template.title}</TableCell>
                <TableCell>
                  {template.variables.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {template.variables.map((variable, index) => (
                        <span
                          key={index}
                          className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-mono"
                        >
                          {variable}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm">Nenhuma</span>
                  )}
                </TableCell>
                <TableCell>
                  {template.media.length > 0 ? (
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                      {template.media.length} arquivo(s)
                    </span>
                  ) : (
                    <span className="text-gray-400 text-sm">Nenhuma</span>
                  )}
                </TableCell>
                <TableCell>
                  {template.buttons.length > 0 ? (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                      {template.buttons.length} botão(ões)
                    </span>
                  ) : (
                    <span className="text-gray-400 text-sm">Nenhum</span>
                  )}
                </TableCell>
                <TableCell className="text-gray-600">
                  {formatDate(template.updatedAt)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      className="cursor-pointer hover:bg-blue-100 hover:text-blue-700"
                      size="sm"
                      onClick={() => handleEdit(template)}
                      title="Editar"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      className="cursor-pointer hover:bg-red-100 hover:text-red-700"
                      size="sm"
                      onClick={() => handleDelete(template)}
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
  );

  return (
    <div className="min-h-full p-8 md:p-10 lg:p-12 pb-20">
      <div className="flex items-center justify-between">
        <PageHeader title="Templates" />
        <Button
          onClick={() => setCreateDialogOpen(true)}
          className="bg-amber-500 hover:bg-amber-600 cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-2" />
          Criar Template
        </Button>
      </div>

      <div className="mb-6 mt-2">
        <p className="text-gray-600">
          Gerencie templates para envio de mensagens via WhatsApp e Email.
        </p>
        {currentWorkspace && (
          <p className="text-sm text-amber-600 font-medium mt-1">
            Workspace: {currentWorkspace.name}
          </p>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "whatsapp" | "email")} className="space-y-4">
        <TabsList>
          <TabsTrigger value="whatsapp" className="cursor-pointer">
            <MessageCircle className="w-4 h-4 mr-2" />
            WhatsApp
            {whatsappTemplates.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-xs">
                {whatsappTemplates.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="email" className="cursor-pointer">
            <Mail className="w-4 h-4 mr-2" />
            Email
            {emailTemplates.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-xs">
                {emailTemplates.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="whatsapp" className="space-y-4">
          {renderTemplateTable(filteredWhatsAppTemplates)}
          <div className="text-sm text-gray-600">
            Total: {filteredWhatsAppTemplates.length} template(s) de WhatsApp
          </div>
        </TabsContent>

        <TabsContent value="email" className="space-y-4">
          {renderTemplateTable(filteredEmailTemplates)}
          <div className="text-sm text-gray-600">
            Total: {filteredEmailTemplates.length} template(s) de Email
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <CreateTemplateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        defaultType={activeTab}
      />

      <EditTemplateDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        template={selectedTemplate}
      />

      <DeleteTemplateDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        template={selectedTemplate}
      />
    </div>
  );
}
