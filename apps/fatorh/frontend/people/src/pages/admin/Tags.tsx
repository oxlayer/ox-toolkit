import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Switch,
} from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import type { NewTag, Tag } from "@/types/admin";
import { Plus, Trash2, Tag as TagIcon, Palette, Shield } from "lucide-react";

// Predefined colors for tags
const PREDEFINED_COLORS = [
  "#ef4444", // red-500
  "#f97316", // orange-500
  "#f59e0b", // amber-500
  "#84cc16", // lime-500
  "#22c55e", // green-500
  "#10b981", // emerald-500
  "#14b8a6", // teal-500
  "#06b6d4", // cyan-500
  "#0ea5e9", // sky-500
  "#3b82f6", // blue-500
  "#6366f1", // indigo-500
  "#8b5cf6", // violet-500
  "#a855f7", // purple-500
  "#d946ef", // fuchsia-500
  "#ec4899", // pink-500
  "#f43f5e", // rose-500
];

export default function TagsPage() {
  const { filteredTags, addTag, updateTag, deleteTag, getTagKeys, getTagsByKey, currentWorkspace } = useWorkspace();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);

  // Create form
  const [newTagKey, setNewTagKey] = useState("");
  const [newTagValue, setNewTagValue] = useState("");
  const [newTagColor, setNewTagColor] = useState(PREDEFINED_COLORS[0]);
  const [newTagIsPrimary, setNewTagIsPrimary] = useState(false);

  // Edit form
  const [editTagKey, setEditTagKey] = useState("");
  const [editTagValue, setEditTagValue] = useState("");
  const [editTagColor, setEditTagColor] = useState("");
  const [editTagIsPrimary, setEditTagIsPrimary] = useState(false);

  // Helper function to determine text color based on background
  const getContrastColor = (hexColor: string): string => {
    const color = hexColor.replace('#', '');
    const r = parseInt(color.substr(0, 2), 16);
    const g = parseInt(color.substr(2, 2), 16);
    const b = parseInt(color.substr(4, 2), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return yiq >= 128 ? '#000000' : '#ffffff';
  };

  const handleCreateTag = () => {
    if (!newTagKey.trim() || !newTagValue.trim() || !currentWorkspace) return;

    const tagData: NewTag = {
      workspaceId: currentWorkspace.id,
      key: newTagKey.trim(),
      value: newTagValue.trim(),
      color: newTagColor,
      isPrimary: newTagIsPrimary,
    };

    addTag(tagData);
    setNewTagKey("");
    setNewTagValue("");
    setNewTagColor(PREDEFINED_COLORS[0]);
    setNewTagIsPrimary(false);
    setIsCreateDialogOpen(false);
  };

  const handleEditTag = () => {
    if (!editingTag || !editTagKey.trim() || !editTagValue.trim()) return;

    updateTag(editingTag.id, {
      key: editTagKey.trim(),
      value: editTagValue.trim(),
      color: editTagColor,
      isPrimary: editTagIsPrimary,
    });

    setEditTagKey("");
    setEditTagValue("");
    setEditTagColor("");
    setEditTagIsPrimary(false);
    setEditingTag(null);
    setIsEditDialogOpen(false);
  };

  const openEditDialog = (tag: Tag) => {
    setEditingTag(tag);
    setEditTagKey(tag.key);
    setEditTagValue(tag.value);
    setEditTagColor(tag.color);
    setEditTagIsPrimary(tag.isPrimary || false);
    setIsEditDialogOpen(true);
  };

  const closeEditDialog = () => {
    setEditingTag(null);
    setEditTagKey("");
    setEditTagValue("");
    setEditTagColor("");
    setEditTagIsPrimary(false);
    setIsEditDialogOpen(false);
  };

  const handleDeleteTag = (tagId: string) => {
    if (confirm("Tem certeza que deseja excluir esta tag? Ela será removida de todos os exames.")) {
      deleteTag(tagId);
    }
  };

  // Group tags by key for better organization
  const tagKeys = getTagKeys();
  const tagsByKey = tagKeys.map((key) => ({
    key,
    tags: getTagsByKey(key),
  }));

  return (
    <div className="min-h-full p-8 md:p-10 lg:p-12 pb-20">
      <PageHeader title="Tags" />

      <div className="flex items-center justify-between mb-6 mt-2">
        <p className="text-gray-600">
          Gerencie tags para categorizar e organizar exames.
        </p>
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-amber-500 hover:bg-amber-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Tag
        </Button>
      </div>

      {filteredTags.length === 0 ? (
        <Card className="bg-white border shadow-sm">
          <CardContent className="p-12">
            <div className="text-center">
              <TagIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhuma tag encontrada
              </h3>
              <p className="text-gray-600 mb-6">
                Crie sua primeira tag usando o formato chave:valor (ex: Empresa: Minha Empresa).
              </p>
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-amber-500 hover:bg-amber-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeira Tag
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {tagsByKey.map(({ key, tags }) => (
            <div key={key}>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="px-2 py-1 bg-gray-100 rounded-md text-sm font-mono">
                  {key}
                </span>
                <span className="text-sm font-normal text-gray-500">
                  ({tags.length} tag{tags.length !== 1 ? 's' : ''})
                </span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tags.map((tag) => (
                  <Card
                    key={tag.id}
                    className={`bg-white border shadow-sm hover:shadow-md transition-shadow ${tag.isPrimary ? "ring-2 ring-blue-500" : ""}`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-3">
                            <div
                              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
                              style={{
                                backgroundColor: tag.color,
                                color: getContrastColor(tag.color),
                              }}
                            >
                              <TagIcon className="w-4 h-4" />
                              <span className="font-medium">{tag.key}: {tag.value}</span>
                            </div>
                            {tag.isPrimary && (
                              <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                <Shield className="w-3 h-3" />
                                Primária
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">
                            Criada em {tag.createdAt.toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(tag)}
                            className="h-8 w-8 p-0"
                          >
                            <Palette className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTag(tag.id)}
                            className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Tag Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Criar Nova Tag</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tagKey">Chave da Tag *</Label>
              <Input
                id="tagKey"
                placeholder="Ex: Empresa, Tipo, Nível..."
                value={newTagKey}
                onChange={(e) => setNewTagKey(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                A chave identifica o tipo de tag (ex: "Empresa", "Tipo Teste")
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tagValue">Valor da Tag *</Label>
              <Input
                id="tagValue"
                placeholder="Ex: Minha Empresa, Técnica, Senior..."
                value={newTagValue}
                onChange={(e) => setNewTagValue(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                O valor específico da tag (ex: "Minha Empresa", "Técnica", "Senior")
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="isPrimary" className="text-base">Tag Primária</Label>
                <p className="text-xs text-gray-500">
                  Define como critério para relação entre exames
                </p>
              </div>
              <Switch
                id="isPrimary"
                checked={newTagIsPrimary}
                onCheckedChange={setNewTagIsPrimary}
              />
            </div>

            {newTagIsPrimary && (
              <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <Shield className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">Tag Primária</p>
                  <p className="text-blue-700 mt-1">
                    Esta tag será usada para relacionar usuários entre exames que tenham a mesma tag primária.
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Cor da Tag</Label>
              <div className="flex flex-wrap gap-2">
                {PREDEFINED_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewTagColor(color)}
                    className={`w-10 h-10 rounded-full border-2 transition-all ${newTagColor === color
                      ? "border-gray-900 scale-110"
                      : "border-gray-200 hover:scale-105"
                      }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div className="mt-2">
                <Label className="text-xs text-gray-500 mr-2">Preview:</Label>
                <div
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mt-1"
                  style={{
                    backgroundColor: newTagColor,
                    color: getContrastColor(newTagColor),
                  }}
                >
                  <TagIcon className="w-4 h-4" />
                  <span className="font-medium">
                    {newTagKey || "Chave"}: {newTagValue || "Valor"}
                  </span>
                  {newTagIsPrimary && <Shield className="w-3 h-3" />}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreateTag}
              disabled={!newTagKey.trim() || !newTagValue.trim()}
              className="bg-amber-500 hover:bg-amber-600"
            >
              Criar Tag
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Tag Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Tag</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editTagKey">Chave da Tag *</Label>
              <Input
                id="editTagKey"
                placeholder="Ex: Company, Tipo, Nível..."
                value={editTagKey}
                onChange={(e) => setEditTagKey(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                A chave identifica o tipo de tag (ex: "Company", "Tipo Teste")
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="editTagValue">Valor da Tag *</Label>
              <Input
                id="editTagValue"
                placeholder="Ex: Minha Empresa, Técnica, Senior..."
                value={editTagValue}
                onChange={(e) => setEditTagValue(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                O valor específico da tag (ex: "Minha Empresa", "Técnica", "Senior")
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="editIsPrimary" className="text-base">Tag Primária</Label>
                <p className="text-xs text-gray-500">
                  Define como critério para relação entre exames
                </p>
              </div>
              <Switch
                id="editIsPrimary"
                checked={editTagIsPrimary}
                onCheckedChange={setEditTagIsPrimary}
              />
            </div>

            {editTagIsPrimary && (
              <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <Shield className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">Tag Primária</p>
                  <p className="text-blue-700 mt-1">
                    Esta tag será usada para relacionar usuários entre exames que tenham a mesma tag primária.
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Cor da Tag</Label>
              <div className="flex flex-wrap gap-2">
                {PREDEFINED_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setEditTagColor(color)}
                    className={`w-10 h-10 rounded-full border-2 transition-all ${editTagColor === color
                      ? "border-gray-900 scale-110"
                      : "border-gray-200 hover:scale-105"
                      }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div className="mt-2">
                <Label className="text-xs text-gray-500 mr-2">Preview:</Label>
                <div
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mt-1"
                  style={{
                    backgroundColor: editTagColor,
                    color: getContrastColor(editTagColor),
                  }}
                >
                  <TagIcon className="w-4 h-4" />
                  <span className="font-medium">
                    {editTagKey || "Chave"}: {editTagValue || "Valor"}
                  </span>
                  {editTagIsPrimary && <Shield className="w-3 h-3" />}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeEditDialog}>
              Cancelar
            </Button>
            <Button
              onClick={handleEditTag}
              disabled={!editTagKey.trim() || !editTagValue.trim()}
              className="bg-amber-500 hover:bg-amber-600"
            >
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
