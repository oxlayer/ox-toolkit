import { useState, useEffect } from "react";
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
import { Plus, Trash2, ChevronUp, ChevronDown, X, Tag as TagIcon } from "lucide-react";

interface CreateExamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface QuestionDraft {
  id: string;
  text: string;
  type: "technical" | "behavioral" | "situational";
  weight: "high" | "medium" | "low";
}

export default function CreateExamDialog({
  open,
  onOpenChange,
}: CreateExamDialogProps) {
  const { addExam, filteredTags, currentWorkspace } = useWorkspace();

  // Step state
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1 - Form data
  const [examName, setExamName] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  // Step 2 - Questions
  const [questions, setQuestions] = useState<QuestionDraft[]>([]);
  const [newQuestionText, setNewQuestionText] = useState("");
  const [newQuestionType, setNewQuestionType] = useState<
    "technical" | "behavioral" | "situational"
  >("technical");
  const [newQuestionWeight, setNewQuestionWeight] = useState<
    "high" | "medium" | "low"
  >("medium");

  // Set default program when opening
  useEffect(() => {
    if (open) {
      // Reset form when dialog opens
    }
  }, [open]);

  const resetForm = () => {
    setCurrentStep(1);
    setExamName("");
    setDurationMinutes(30);
    setSelectedTagIds([]);
    setQuestions([]);
    setNewQuestionText("");
    setNewQuestionType("technical");
    setNewQuestionWeight("medium");
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleToggleTag = (tagId: string) => {
    const tag = filteredTags.find((t) => t.id === tagId);
    if (!tag) return;

    setSelectedTagIds((prev) => {
      const isSelected = prev.includes(tagId);

      if (isSelected) {
        // Remove the tag
        return prev.filter((id) => id !== tagId);
      } else {
        // Add the tag and remove any other tags with the same key
        return [
          ...prev.filter((id) => {
            const existingTag = filteredTags.find((t) => t.id === id);
            return existingTag?.key !== tag.key;
          }),
          tagId,
        ];
      }
    });
  };

  const handleAddQuestion = () => {
    if (!newQuestionText.trim()) return;

    const newQuestion: QuestionDraft = {
      id: `draft-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      text: newQuestionText.trim(),
      type: newQuestionType,
      weight: newQuestionWeight,
    };

    setQuestions((prev) => [...prev, newQuestion]);
    setNewQuestionText("");
    setNewQuestionType("technical");
    setNewQuestionWeight("medium");
  };

  const handleRemoveQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const handleMoveQuestion = (index: number, direction: "up" | "down") => {
    const newQuestions = [...questions];
    const newIndex = direction === "up" ? index - 1 : index + 1;

    if (newIndex < 0 || newIndex >= questions.length) return;

    [newQuestions[index], newQuestions[newIndex]] = [
      newQuestions[newIndex],
      newQuestions[index],
    ];

    setQuestions(newQuestions);
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!examName.trim() || !currentWorkspace) return;
      setCurrentStep(2);
    }
  };

  const handleBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    }
  };

  const handleSubmit = async () => {
    if (questions.length === 0 || !currentWorkspace) return;

    // Map frontend questions to API format
    // Frontend: type="technical"|"behavioral"|"situational", weight="high"|"medium"|"low"
    // Backend: type="text"|"audio", priority=number
    const apiQuestions = questions.map((q, index) => ({
      priority: index + 1,
      text: q.text,
      type: "text" as const,
    }));

    // Criar o exame com as perguntas
    await addExam({
      examName: examName.trim(),
      durationMinutes,
      workspaceId: currentWorkspace.id,
      questions: apiQuestions,
    });

    handleClose();
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "technical":
        return "Técnica";
      case "behavioral":
        return "Comportamental";
      case "situational":
        return "Situacional";
      default:
        return type;
    }
  };

  const getWeightLabel = (weight: string) => {
    switch (weight) {
      case "high":
        return "Alto";
      case "medium":
        return "Médio";
      case "low":
        return "Baixo";
      default:
        return weight;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "technical":
        return "bg-blue-100 text-blue-800";
      case "behavioral":
        return "bg-purple-100 text-purple-800";
      case "situational":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getWeightColor = (weight: string) => {
    switch (weight) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-amber-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Helper function to determine text color based on background
  const getContrastColor = (hexColor: string): string => {
    // Remove # if present
    const color = hexColor.replace('#', '');

    // Convert to RGB
    const r = parseInt(color.substr(0, 2), 16);
    const g = parseInt(color.substr(2, 2), 16);
    const b = parseInt(color.substr(4, 2), 16);

    // Calculate brightness (YIQ formula)
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;

    // Return black or white based on brightness
    return yiq >= 128 ? '#000000' : '#ffffff';
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          {/* Steps indicator */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${currentStep >= 1
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-600"
                  }`}
              >
                1
              </div>
              <span
                className={`text-sm ${currentStep >= 1 ? "text-gray-900" : "text-gray-500"
                  }`}
              >
                Informações
              </span>
            </div>
            <div className="w-16 h-0.5 bg-gray-300" />
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${currentStep >= 2
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-600"
                  }`}
              >
                2
              </div>
              <span
                className={`text-sm ${currentStep >= 2 ? "text-gray-900" : "text-gray-500"
                  }`}
              >
                Perguntas
              </span>
            </div>
          </div>
          <DialogTitle>
            {currentStep === 1 ? "Criar Exame" : "Adicionar Perguntas"}
          </DialogTitle>
        </DialogHeader>

        {/* Step 1 - Informações básicas */}
        {currentStep === 1 && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="examName">Nome do Exame *</Label>
              <Input
                id="examName"
                placeholder="Ex: Avaliação Técnica - Desenvolvedor"
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duração (minutos): {durationMinutes}</Label>
              <input
                type="range"
                id="duration"
                min="5"
                max="120"
                step="5"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>5 min</span>
                <span>60 min</span>
                <span>120 min</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <p className="text-xs text-gray-500">
                Selecione tags para categorizar este exame (ex: Empresa, Técnica, Comportamental, etc.)
              </p>
              {filteredTags.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-3 bg-gray-50 rounded-lg border border-dashed">
                  Nenhuma tag disponível. Crie tags primeiro na seção de configurações.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {filteredTags.map((tag) => {
                    const isSelected = selectedTagIds.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => handleToggleTag(tag.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${isSelected
                            ? "ring-2 ring-offset-1"
                            : "opacity-70 hover:opacity-100"
                          }`}
                        style={{
                          backgroundColor: isSelected ? tag.color : `${tag.color}80`,
                          color: getContrastColor(tag.color),
                        }}
                      >
                        <TagIcon className="w-3.5 h-3.5" />
                        {tag.key}: {tag.value}
                        {isSelected && (
                          <X className="w-3 h-3 ml-0.5" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
              {selectedTagIds.length > 0 && (
                <p className="text-xs text-gray-600">
                  {selectedTagIds.length} tag{selectedTagIds.length !== 1 ? 's' : ''} selecionada{selectedTagIds.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Step 2 - Perguntas */}
        {currentStep === 2 && (
          <div className="space-y-4 py-4">
            {/* Formulário para adicionar pergunta */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <Label>Adicionar Nova Pergunta</Label>
              <Textarea
                placeholder="Digite o texto da pergunta..."
                value={newQuestionText}
                onChange={(e) => setNewQuestionText(e.target.value)}
                rows={2}
              />
              <div className="flex gap-3">
                <div className="flex-1">
                  <Label className="text-xs text-gray-500">Tipo</Label>
                  <Select
                    value={newQuestionType}
                    onValueChange={(v) =>
                      setNewQuestionType(
                        v as "technical" | "behavioral" | "situational"
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technical">Técnica</SelectItem>
                      <SelectItem value="behavioral">Comportamental</SelectItem>
                      <SelectItem value="situational">Situacional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Label className="text-xs text-gray-500">Peso</Label>
                  <Select
                    value={newQuestionWeight}
                    onValueChange={(v) =>
                      setNewQuestionWeight(v as "high" | "medium" | "low")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">Alto</SelectItem>
                      <SelectItem value="medium">Médio</SelectItem>
                      <SelectItem value="low">Baixo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    onClick={handleAddQuestion}
                    disabled={!newQuestionText.trim()}
                    className="bg-amber-500 hover:bg-amber-600"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Adicionar
                  </Button>
                </div>
              </div>
            </div>

            {/* Lista de perguntas adicionadas */}
            <div className="space-y-2">
              <Label>
                Perguntas Adicionadas ({questions.length})
              </Label>
              {questions.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  Nenhuma pergunta adicionada ainda
                </p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {questions.map((q, index) => (
                    <div
                      key={q.id}
                      className="bg-white border rounded-lg p-3 flex items-start gap-3"
                    >
                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          onClick={() => handleMoveQuestion(index, "up")}
                          disabled={index === 0}
                          className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveQuestion(index, "down")}
                          disabled={index === questions.length - 1}
                          className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-gray-500">
                            #{index + 1}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(
                              q.type
                            )}`}
                          >
                            {getTypeLabel(q.type)}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${getWeightColor(
                              q.weight
                            )}`}
                          >
                            {getWeightLabel(q.weight)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 line-clamp-2">
                          {q.text}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(q.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          {currentStep === 2 && (
            <Button type="button" variant="outline" onClick={handleBack}>
              Voltar
            </Button>
          )}
          {currentStep === 1 ? (
            <Button
              type="button"
              onClick={handleNext}
              disabled={!examName.trim() || !currentWorkspace}
              className="bg-amber-500 hover:bg-amber-600"
            >
              Continuar
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={questions.length === 0}
              className="bg-amber-500 hover:bg-amber-600"
            >
              Criar Exame
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
