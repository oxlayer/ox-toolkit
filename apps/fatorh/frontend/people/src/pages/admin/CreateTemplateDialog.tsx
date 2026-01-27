import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import type { NewTemplate } from "@/types/admin";
import { Plus, Trash2, Image as ImageIcon, Video, Upload } from "lucide-react";

interface CreateTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType?: "whatsapp" | "email";
}

interface MediaDraft {
  id: string;
  type: "image" | "video";
  url: string;
  alt: string;
}

interface ButtonDraft {
  id: string;
  text: string;
  url: string;
  type: "url" | "phone";
}

export default function CreateTemplateDialog({
  open,
  onOpenChange,
  defaultType = "whatsapp",
}: CreateTemplateDialogProps) {
  const { addTemplate, currentWorkspace } = useWorkspace();

  // Form data
  const [templateType, setTemplateType] = useState<"whatsapp" | "email">(defaultType);
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [showHtmlPreview, setShowHtmlPreview] = useState(false);
  const [variables, setVariables] = useState<string[]>([]);
  const [newVariable, setNewVariable] = useState("");
  const [footer, setFooter] = useState("");
  const [media, setMedia] = useState<MediaDraft[]>([]);
  const [newMediaUrl, setNewMediaUrl] = useState("");
  const [newMediaType, setNewMediaType] = useState<"image" | "video">("image");
  const [newMediaAlt, setNewMediaAlt] = useState("");
  const [buttons, setButtons] = useState<ButtonDraft[]>([]);
  const [newButtonText, setNewButtonText] = useState("");
  const [newButtonUrl, setNewButtonUrl] = useState("");
  const [newButtonType, setNewButtonType] = useState<"url" | "phone">("url");

  // Reset form on open
  useEffect(() => {
    if (open) {
      setTemplateType(defaultType);
      setName("");
      setTitle("");
      setContent("");
      setShowHtmlPreview(false);
      setVariables([]);
      setNewVariable("");
      setFooter("");
      setMedia([]);
      setNewMediaUrl("");
      setNewMediaType("image");
      setNewMediaAlt("");
      setButtons([]);
      setNewButtonText("");
      setNewButtonUrl("");
      setNewButtonType("url");
    }
  }, [open, defaultType]);

  const resetForm = () => {
    setTemplateType(defaultType);
    setName("");
    setTitle("");
    setContent("");
    setShowHtmlPreview(false);
    setVariables([]);
    setNewVariable("");
    setFooter("");
    setMedia([]);
    setNewMediaUrl("");
    setNewMediaType("image");
    setNewMediaAlt("");
    setButtons([]);
    setNewButtonText("");
    setNewButtonUrl("");
    setNewButtonType("url");
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  // Format variables as {{1}}, {{2}}, etc.
  const formatVariable = (index: number) => `{{${index + 1}}}`;

  const handleAddVariable = () => {
    if (newVariable.trim()) {
      setVariables((prev) => [...prev, formatVariable(prev.length)]);
      setNewVariable("");
    }
  };

  const handleRemoveVariable = (index: number) => {
    setVariables((prev) => {
      const filtered = prev.filter((_, i) => i !== index);
      // Reformat all variables
      return filtered.map((_, i) => formatVariable(i));
    });
  };

  const handleAddMedia = () => {
    if (newMediaUrl.trim()) {
      const newMedia: MediaDraft = {
        id: `media-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        type: newMediaType,
        url: newMediaUrl.trim(),
        alt: newMediaAlt.trim(),
      };
      setMedia((prev) => [...prev, newMedia]);
      setNewMediaUrl("");
      setNewMediaAlt("");
    }
  };

  const handleRemoveMedia = (id: string) => {
    setMedia((prev) => prev.filter((m) => m.id !== id));
  };

  // Handle file upload - convert to base64 for demo (in production, upload to S3/cloud storage)
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type based on selected media type
    if (newMediaType === "image" && !file.type.startsWith("image/")) {
      alert("Por favor, selecione um arquivo de imagem válido.");
      return;
    }
    if (newMediaType === "video" && !file.type.startsWith("video/")) {
      alert("Por favor, selecione um arquivo de vídeo válido.");
      return;
    }

    // Validate file size (max 10MB for demo)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert("O arquivo é muito grande. Tamanho máximo: 10MB.");
      return;
    }

    // Convert to base64 for demo purposes
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Url = reader.result as string;
      const newMedia: MediaDraft = {
        id: `media-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        type: newMediaType,
        url: base64Url,
        alt: newMediaAlt.trim() || file.name,
      };
      setMedia((prev) => [...prev, newMedia]);
      setNewMediaAlt("");
    };
    reader.readAsDataURL(file);
  }, [newMediaType, newMediaAlt]);

  const handleAddButton = () => {
    if (newButtonText.trim()) {
      const newButton: ButtonDraft = {
        id: `btn-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        text: newButtonText.trim(),
        url: newButtonUrl.trim(),
        type: newButtonType,
      };
      setButtons((prev) => [...prev, newButton]);
      setNewButtonText("");
      setNewButtonUrl("");
    }
  };

  const handleRemoveButton = (id: string) => {
    setButtons((prev) => prev.filter((b) => b.id !== id));
  };

  const handleSubmit = () => {
    if (!name.trim() || !title.trim() || !content.trim()) {
      return;
    }

    const templateData: NewTemplate = {
      type: templateType,
      name: name.trim(),
      title: title.trim(),
      content: content.trim(),
      variables,
      footer: footer.trim() || undefined,
      media: media.map((m) => ({
        id: m.id,
        type: m.type,
        url: m.url,
        alt: m.alt,
      })),
      buttons: buttons.map((b) => ({
        id: b.id,
        text: b.text,
        url: b.url,
        type: b.type,
      })),
      workspaceId: "", // Will be set by addTemplate
    };

    addTemplate(templateData);
    handleClose();
  };

  const isValid = name.trim() && title.trim() && content.trim() && currentWorkspace;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Template</DialogTitle>
          {currentWorkspace && (
            <p className="text-sm text-gray-500">Workspace: {currentWorkspace.name}</p>
          )}
        </DialogHeader>

        {!currentWorkspace && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
            Nenhum workspace selecionado. Por favor, selecione um workspace antes de criar um template.
          </div>
        )}

        <div className="space-y-4 py-4">
          {/* Template Type */}
          <div className="space-y-2">
            <Label htmlFor="templateType">Tipo de Template *</Label>
            <Select
              value={templateType}
              onValueChange={(v) => setTemplateType(v as "whatsapp" | "email")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="email">Email</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Template Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Template *</Label>
            <Input
              id="name"
              placeholder="Ex: Convite de Entrevista"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Template Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              placeholder={
                templateType === "whatsapp"
                  ? "Ex: Convite para Entrevista Técnica"
                  : "Ex: Convite para Entrevista - {{1}}"
              }
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <p className="text-xs text-gray-500">
              O título aparece como cabeçalho da mensagem
            </p>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="content">Conteúdo *</Label>
              {templateType === "email" && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowHtmlPreview(!showHtmlPreview)}
                  className="text-xs"
                >
                  {showHtmlPreview ? "Editar HTML" : "Visualizar Preview"}
                </Button>
              )}
            </div>
            {templateType === "email" && showHtmlPreview ? (
              <div className="border rounded-lg p-4 bg-gray-50">
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              </div>
            ) : (
              <Textarea
                id="content"
                placeholder={
                  templateType === "whatsapp"
                    ? "Olá {{1}}, gostaríamos de convidá-lo para uma entrevista técnica na posição de {{2}}. Data: {{3}}, Horário: {{4}}"
                    : `<h1>Convite para Entrevista - {{1}}</h1>
<p>Prezado(a) {{1}},</p>
<p>Temos o prazer de convidá-lo para uma entrevista técnica na posição de <strong>{{2}}</strong>.</p>
<p><strong>Data:</strong> {{3}}</p>
<p><strong>Horário:</strong> {{4}}</p>
<p>Por favor, confirme sua presença clicando no botão abaixo.</p>`
                }
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={templateType === "email" ? 12 : 4}
                className={templateType === "email" ? "font-mono text-xs" : ""}
              />
            )}
            <p className="text-xs text-gray-500">
              {templateType === "whatsapp"
                ? "Use variáveis como {{1}}, {{2}}, etc. que serão substituídas dinamicamente"
                : "Use HTML para formatar o email. Variáveis como {{1}}, {{2}} serão substituídas dinamicamente."
              }
            </p>
          </div>

          {/* Variables */}
          <div className="space-y-2">
            <Label>Variáveis</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Nome da variável (apenas referência)"
                value={newVariable}
                onChange={(e) => setNewVariable(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddVariable();
                  }
                }}
              />
              <Button
                type="button"
                onClick={handleAddVariable}
                disabled={!newVariable.trim()}
                className="bg-amber-500 hover:bg-amber-600"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {variables.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {variables.map((variable, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
                  >
                    <span className="font-mono">{variable}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveVariable(index)}
                      className="ml-1 hover:text-red-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="footer">Rodapé (opcional)</Label>
            <Input
              id="footer"
              placeholder="Ex: Responda esta mensagem para confirmar"
              value={footer}
              onChange={(e) => setFooter(e.target.value)}
            />
          </div>

          {/* Media - Only for WhatsApp */}
          {templateType === "whatsapp" && (
          <div className="space-y-2">
            <Label>Mídia (imagens e vídeos)</Label>
            <div className="space-y-2">
              <div className="flex gap-2 items-center">
                <Select
                  value={newMediaType}
                  onValueChange={(v) => setNewMediaType(v as "image" | "video")}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image">Imagem</SelectItem>
                    <SelectItem value="video">Vídeo</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="file"
                  accept={newMediaType === "image" ? "image/*" : "video/*"}
                  onChange={handleFileUpload}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  title="Fazer upload de arquivo"
                  className="cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                </Button>
              </div>
              <div className="text-xs text-gray-500 text-center">ou cole uma URL abaixo</div>
              <div className="flex gap-2">
                <Input
                  placeholder="URL da mídia (https://...)"
                  value={newMediaUrl}
                  onChange={(e) => setNewMediaUrl(e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="Texto alternativo"
                  value={newMediaAlt}
                  onChange={(e) => setNewMediaAlt(e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={handleAddMedia}
                  disabled={!newMediaUrl.trim()}
                  className="bg-amber-500 hover:bg-amber-600"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
            {media.length > 0 && (
              <div className="space-y-2 mt-2">
                {media.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 p-2 bg-gray-50 rounded border"
                  >
                    {item.type === "image" ? (
                      <ImageIcon className="w-4 h-4 text-gray-500" />
                    ) : (
                      <Video className="w-4 h-4 text-gray-500" />
                    )}
                    <span className="text-sm flex-1 truncate">
                      {item.url.startsWith("data:") ? `Arquivo: ${item.alt}` : item.url}
                    </span>
                    {item.alt && !item.url.startsWith("data:") && (
                      <span className="text-xs text-gray-500 truncate">
                        {item.alt}
                      </span>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMedia(item.id)}
                      className="hover:bg-red-100 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          )}

          {/* Buttons */}
          <div className="space-y-2">
            <Label>Botões de Ação</Label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Select
                  value={newButtonType}
                  onValueChange={(v) => setNewButtonType(v as "url" | "phone")}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="url">Link</SelectItem>
                    <SelectItem value="phone">Telefone</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Texto do botão"
                  value={newButtonText}
                  onChange={(e) => setNewButtonText(e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder={
                    newButtonType === "url"
                      ? "https://..."
                      : "+55 11 99999-9999"
                  }
                  value={newButtonUrl}
                  onChange={(e) => setNewButtonUrl(e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={handleAddButton}
                  disabled={!newButtonText.trim()}
                  className="bg-amber-500 hover:bg-amber-600"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
            {buttons.length > 0 && (
              <div className="space-y-2 mt-2">
                {buttons.map((button) => (
                  <div
                    key={button.id}
                    className="flex items-center gap-2 p-2 bg-gray-50 rounded border"
                  >
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded text-xs">
                      {button.type === "url" ? "Link" : "Telefone"}
                    </span>
                    <span className="text-sm flex-1 font-medium">
                      {button.text}
                    </span>
                    {button.url && (
                      <span className="text-xs text-gray-500 truncate max-w-[200px]">
                        {button.url}
                      </span>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveButton(button.id)}
                      className="hover:bg-red-100 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!isValid}
            className="bg-amber-500 hover:bg-amber-600"
          >
            Criar Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
