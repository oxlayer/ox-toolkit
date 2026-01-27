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
import { useWorkspace } from "@/contexts/WorkspaceContext";
import type { Exam } from "@/types/admin";
import { X, Tag as TagIcon } from "lucide-react";

interface EditExamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exam: Exam | null;
}

export default function EditExamDialog({
  open,
  onOpenChange,
  exam,
}: EditExamDialogProps) {
  const { filteredTags, updateExam } = useWorkspace();

  const [examName, setExamName] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  // Load exam data when dialog opens
  useEffect(() => {
    if (open && exam) {
      setExamName(exam.examName);
      setDurationMinutes(exam.durationMinutes);
      setSelectedTagIds(exam.tags || []);
    }
  }, [open, exam]);

  const resetForm = () => {
    setExamName("");
    setDurationMinutes(30);
    setSelectedTagIds([]);
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

  const handleSubmit = () => {
    if (!exam) return;

    updateExam(exam.id, {
      examName: examName.trim(),
      durationMinutes,
      tags: selectedTagIds,
    });

    handleClose();
  };

  // Helper function to determine text color based on background
  const getContrastColor = (hexColor: string): string => {
    const color = hexColor.replace('#', '');
    const r = parseInt(color.substr(0, 2), 16);
    const g = parseInt(color.substr(2, 2), 16);
    const b = parseInt(color.substr(4, 2), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return yiq >= 128 ? '#000000' : '#ffffff';
  };

  if (!exam) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Exame</DialogTitle>
        </DialogHeader>

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
              Selecione tags para categorizar este exame
            </p>
            {filteredTags.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-3 bg-gray-50 rounded-lg border border-dashed">
                Nenhuma tag disponível.
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

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!examName.trim()}
            className="bg-amber-500 hover:bg-amber-600"
          >
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
