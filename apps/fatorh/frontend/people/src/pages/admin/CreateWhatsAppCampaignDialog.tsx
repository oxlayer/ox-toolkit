import { useState, useCallback, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import type { NewWhatsAppCampaign, WhatsAppVariable, WhatsAppTestUser, Template } from "@/types/admin";
import { Upload, FileText, Plus, Trash2 } from "lucide-react";

interface CreateWhatsAppCampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  examId: string;
}

interface CSVRow {
  name: string;
  phone: string;
}

export default function CreateWhatsAppCampaignDialog({
  open,
  onOpenChange,
  examId,
}: CreateWhatsAppCampaignDialogProps) {
  const { addWhatsAppCampaign, filteredTemplates, getTemplatesByType } = useWorkspace();

  const [campaignName, setCampaignName] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [scheduledDate, setScheduledDate] = useState("");

  // Get WhatsApp templates
  const whatsappTemplates = useMemo(() => {
    return getTemplatesByType("whatsapp");
  }, [getTemplatesByType]);

  // Find selected template
  const selectedTemplate = useMemo(() => {
    if (!selectedTemplateId) return null;
    return whatsappTemplates.find((t) => t.id === selectedTemplateId);
  }, [selectedTemplateId, whatsappTemplates]);

  // Initialize variables based on template
  const initializeVariables = (template: Template | null): WhatsAppVariable[] => {
    if (!template || template.variables.length === 0) {
      // Default to 4 empty variables if no template selected
      return [
        { type: "text", text: "" },
        { type: "text", text: "" },
        { type: "text", text: "" },
        { type: "text", text: "" },
      ];
    }

    // Create variables based on template
    return template.variables.map(() => ({ type: "text", text: "" }));
  };

  const [variables, setVariables] = useState<WhatsAppVariable[]>(initializeVariables(null));

  // Update variables when template changes
  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const template = whatsappTemplates.find((t) => t.id === templateId);
    setVariables(initializeVariables(template || null));
  };

  // Test users
  const [testUsers, setTestUsers] = useState<WhatsAppTestUser[]>([]);

  // CSV upload
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [csvError, setCsvError] = useState<string>("");

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      setCsvError("Por favor, selecione um arquivo CSV válido.");
      setCsvFile(null);
      return;
    }

    setCsvFile(file);
    setCsvError("");

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      try {
        const lines = text.trim().split("\n");
        const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));

        // Validate headers
        if (!headers.includes("name") || !headers.includes("phone")) {
          setCsvError("O CSV deve conter as colunas 'name' e 'phone'.");
          setCsvData([]);
          return;
        }

        const nameIndex = headers.indexOf("name");
        const phoneIndex = headers.indexOf("phone");

        const rows: CSVRow[] = lines.slice(1).map((line) => {
          const values = line.split(",").map((v) => v.trim().replace(/"/g, ""));
          return {
            name: values[nameIndex] || "",
            phone: values[phoneIndex] || "",
          };
        }).filter((row) => row.name && row.phone);

        setCsvData(rows);
      } catch (error) {
        setCsvError("Erro ao ler o arquivo CSV.");
        setCsvData([]);
      }
    };
    reader.readAsText(file);
  }, []);

  const handleAddTestUser = () => {
    setTestUsers([...testUsers, { phoneNumber: "", userName: "" }]);
  };

  const handleRemoveTestUser = (index: number) => {
    setTestUsers(testUsers.filter((_, i) => i !== index));
  };

  const handleTestUserChange = (index: number, field: keyof WhatsAppTestUser, value: string) => {
    const updated = [...testUsers];
    updated[index][field] = value;
    setTestUsers(updated);
  };

  const handleVariableChange = (index: number, value: string) => {
    const updated = [...variables];
    updated[index].text = value;
    setVariables(updated);
  };

  const handleSubmit = () => {
    if (!campaignName.trim()) {
      setCsvError("Por favor, insira um nome para a campanha.");
      return;
    }

    if (!selectedTemplate) {
      setCsvError("Por favor, selecione um template.");
      return;
    }

    const newCampaign: NewWhatsAppCampaign = {
      examId,
      name: campaignName,
      template: selectedTemplate.name,
      scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
      status: "draft",
      variables: variables.map((v) => ({ type: v.type, text: v.text })),
      testUsers,
      totalRecipients: csvData.length,
    };

    addWhatsAppCampaign(newCampaign);

    // Reset form
    setCampaignName("");
    setSelectedTemplateId("");
    setScheduledDate("");
    setVariables(initializeVariables(null));
    setTestUsers([]);
    setCsvFile(null);
    setCsvData([]);
    setCsvError("");

    onOpenChange(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Reset form on close
      setCampaignName("");
      setSelectedTemplateId("");
      setScheduledDate("");
      setVariables(initializeVariables(null));
      setTestUsers([]);
      setCsvFile(null);
      setCsvData([]);
      setCsvError("");
    }
    onOpenChange(open);
  };

  const isValid =
    campaignName.trim() !== "" &&
    selectedTemplateId !== "" &&
    csvData.length > 0 &&
    variables.every((v) => v.text.trim() !== "");

  const getVariableLabel = (index: number) => {
    if (selectedTemplate && selectedTemplate.variables[index]) {
      return `Variável ${index + 1} (${selectedTemplate.variables[index]})`;
    }
    return `Variável ${index + 1}`;
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Campanha WhatsApp</DialogTitle>
          <DialogDescription>
            Configure uma nova campanha de envio de mensagens WhatsApp.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Campaign Name */}
          <div className="space-y-2">
            <Label htmlFor="campaignName">
              Nome da Campanha <span className="text-red-500">*</span>
            </Label>
            <Input
              id="campaignName"
              placeholder="Ex: Lembrete de Entrevista - Programa Estágio"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
            />
          </div>

          {/* Template Selection */}
          <div className="space-y-2">
            <Label htmlFor="template">
              Template WhatsApp <span className="text-red-500">*</span>
            </Label>
            <Select value={selectedTemplateId} onValueChange={handleTemplateChange}>
              <SelectTrigger id="template">
                <SelectValue placeholder="Selecione um template" />
              </SelectTrigger>
              <SelectContent>
                {whatsappTemplates.length === 0 ? (
                  <div className="p-2 text-sm text-gray-500">
                    Nenhum template WhatsApp cadastrado
                  </div>
                ) : (
                  whatsappTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name} - {template.title}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500">
              {selectedTemplate
                ? `Variáveis necessárias: ${selectedTemplate.variables.join(", ")}`
                : "Selecione um template para ver as variáveis necessárias"}
            </p>
          </div>

          {/* Variables - dynamically loaded from template */}
          {selectedTemplate && (
            <div className="space-y-3">
              <Label>
                Variáveis do Template <span className="text-red-500">*</span>
              </Label>
              <div className="space-y-2">
                {variables.map((variable, index) => (
                  <div key={index} className="space-y-1">
                    <Label htmlFor={`var${index}`} className="text-sm text-gray-600">
                      {getVariableLabel(index)}
                    </Label>
                    <Input
                      id={`var${index}`}
                      placeholder={`Valor para {{${index + 1}}}`}
                      value={variable.text}
                      onChange={(e) => handleVariableChange(index, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CSV Upload */}
          <div className="space-y-2">
            <Label>
              Arquivo CSV com Destinatários <span className="text-red-500">*</span>
            </Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-amber-400 transition-colors">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload" className="cursor-pointer">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <span className="text-amber-600 font-medium">
                  {csvFile ? csvFile.name : "Clique para selecionar um arquivo CSV"}
                </span>
                <p className="text-sm text-gray-500 mt-2">
                  O CSV deve conter as colunas: name, phone
                </p>
              </label>
            </div>
            {csvError && (
              <p className="text-sm text-red-500">{csvError}</p>
            )}
            {csvData.length > 0 && (
              <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <FileText className="w-4 h-4 inline mr-1" />
                  {csvData.length} destinatário(s) carregado(s) do arquivo CSV
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Primeiros 5 registros: {csvData.slice(0, 5).map((r) => r.name).join(", ")}
                  {csvData.length > 5 ? "..." : ""}
                </p>
              </div>
            )}
          </div>

          {/* Test Users */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Usuários de Teste (Opcional)</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddTestUser}
              >
                <Plus className="w-4 h-4 mr-1" />
                Adicionar
              </Button>
            </div>
            {testUsers.length === 0 ? (
              <p className="text-sm text-gray-500">
                Adicione usuários para testar o envio antes de disparar para toda a lista.
              </p>
            ) : (
              <div className="space-y-2">
                {testUsers.map((user, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <div className="flex-1 space-y-2">
                      <Input
                        placeholder="Nome"
                        value={user.userName}
                        onChange={(e) =>
                          handleTestUserChange(index, "userName", e.target.value)
                        }
                      />
                      <Input
                        placeholder="Telefone (com DDD, ex: 5538999880075)"
                        value={user.phoneNumber}
                        onChange={(e) =>
                          handleTestUserChange(index, "phoneNumber", e.target.value)
                        }
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveTestUser(index)}
                      className="mt-6 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Scheduled Date */}
          <div className="space-y-2">
            <Label htmlFor="scheduledDate">Data e Hora de Agendamento (Opcional)</Label>
            <Input
              id="scheduledDate"
              type="datetime-local"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
            />
            <p className="text-sm text-gray-500">
              Deixe em branco para enviar imediatamente após salvar.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!isValid}
            className="bg-amber-500 hover:bg-amber-600"
          >
            Criar Campanha
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
