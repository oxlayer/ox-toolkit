import { useState, useMemo } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import type { NewExamCandidate } from "@/types/admin";
import { UserPlus, Check, Shield, AlertCircle } from "lucide-react";
import { usePhoneInput } from "react-international-phone";
import "react-international-phone/style.css";

// Country flag mapping
const countryFlags: Record<string, string> = {
  br: '🇧🇷',
  us: '🇺🇸',
  pt: '🇵🇹',
  ar: '🇦🇷',
};

interface AddCandidateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  examId: string;
}

// Phone formatting using react-international-phone

// CPF formatting: 000.000.000-00
function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, '');

  if (digits.length <= 3) {
    return digits;
  } else if (digits.length <= 6) {
    return digits.slice(0, 3) + '.' + digits.slice(3, 6);
  } else if (digits.length <= 9) {
    return digits.slice(0, 3) + '.' + digits.slice(3, 6) + '.' + digits.slice(6, 9);
  } else {
    return digits.slice(0, 3) + '.' + digits.slice(3, 6) + '.' + digits.slice(6, 9) + '-' + digits.slice(9, 11);
  }
}

// CPF validation
function validateCPF(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, '');

  if (digits.length !== 11) return false;

  // Check if all digits are the same
  if (/^(\d)\1+$/.test(digits)) return false;

  // Validate check digits
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits[i]) * (10 - i);
  }
  let checkDigit = 11 - (sum % 11);
  if (checkDigit >= 10) checkDigit = 0;
  if (checkDigit !== parseInt(digits[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits[i]) * (11 - i);
  }
  checkDigit = 11 - (sum % 11);
  if (checkDigit >= 10) checkDigit = 0;
  if (checkDigit !== parseInt(digits[10])) return false;

  return true;
}

// Email validation
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export default function AddCandidateDialog({
  open,
  onOpenChange,
  examId,
}: AddCandidateDialogProps) {
  const { addExamCandidate, getExamPrimaryTags, filteredExamCandidates, currentWorkspace } = useWorkspace();

  // Get the primary tags for this exam
  const examPrimaryTags = useMemo(() => getExamPrimaryTags(examId), [examId, getExamPrimaryTags]);

  // Get exam IDs that the user is already assigned to
  const assignedExamIds = useMemo(() => {
    return filteredExamCandidates
      .filter((c) => c.examId === examId)
      .map((c) => c.userId);
  }, [filteredExamCandidates, examId]);

  // TODO: Implement users API endpoint
  const eligibleUsers: Array<{ id: string; name: string; email?: string; cpf?: string }> = [];

  // Group ineligible users by reason
  const ineligibleUsers = useMemo(() => {
    return { alreadyAssigned: [], wrongPrimaryTag: [] };
  }, [assignedExamIds, examPrimaryTags]);

  const [mode, setMode] = useState<"create" | "select">("create");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserCpf, setNewUserCpf] = useState("");
  const [errors, setErrors] = useState<{
    phone?: string;
    email?: string;
    cpf?: string;
  }>({});

  // Phone input using react-international-phone
  const { inputValue, phone, country, setCountry, handlePhoneValueChange, inputRef } = usePhoneInput({
    defaultCountry: "br",
    value: "",
    onChange: (data) => {
      // Clear phone error when user types
      if (errors.phone && data.phone) {
        setErrors({ ...errors, phone: undefined });
      }
    },
  });

  const resetForm = () => {
    setMode("create");
    setSelectedUserId("");
    setNewUserName("");
    setNewUserEmail("");
    setNewUserCpf("");
    setErrors({});
  };

  // Handle CPF input with mask
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const digits = value.replace(/\D/g, '');

    // Limit to 11 digits
    if (digits.length <= 11) {
      const formatted = formatCPF(value);
      setNewUserCpf(formatted);

      // Validate CPF when we have 11 digits
      if (digits.length === 11) {
        if (!validateCPF(digits)) {
          setErrors({ ...errors, cpf: 'CPF inválido' });
        } else {
          setErrors({ ...errors, cpf: undefined });
        }
      } else {
        setErrors({ ...errors, cpf: undefined });
      }
    }
  };

  // Handle email input with validation
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewUserEmail(value);

    if (value && !validateEmail(value)) {
      setErrors({ ...errors, email: 'Email inválido' });
    } else {
      setErrors({ ...errors, email: undefined });
    }
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleSubmit = () => {
    if (mode === "select" && !selectedUserId) {
      return;
    }

    if (mode === "create" && (!newUserName.trim() || !phone.trim())) {
      return;
    }

    // Validate phone - check if it has a reasonable length (excluding country code)
    const phoneDigits = phone.replace(/\D/g, '').replace(`+${country.dialCode}`, '');
    if (phoneDigits.length < 7) {
      setErrors({ ...errors, phone: 'Informe um número válido' });
      return;
    }

    // Validate email if provided
    if (newUserEmail && errors.email) {
      return;
    }

    // Validate CPF if provided and has 11 digits
    if (newUserCpf && errors.cpf) {
      return;
    }

    let userId: string;

    if (mode === "select") {
      userId = selectedUserId;
    } else {
      // Generate a proper UUID for the new user (in a real app, this would be an API call)
      const generateUUID = (): string => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      };
      const newUser = {
        id: generateUUID(),
        name: newUserName.trim(),
        phone: phone.trim(), // Store in E.164 format
        cpf: newUserCpf.trim() || "000.000.000-00",
        email: newUserEmail.trim() || undefined,
      };
      // TODO: Implement users API endpoint to create user
      userId = newUser.id;
    }

    const candidateData: NewExamCandidate = {
      examId,
      userId,
      workspaceId: currentWorkspace?.id || '',
      status: 'invited',
    };

    addExamCandidate(candidateData);
    handleClose();
  };

  const isValidSelect = selectedUserId;
  const isValidCreate = newUserName.trim() && phone.trim();

  const getContrastColor = (hexColor: string): string => {
    const color = hexColor.replace('#', '');
    const r = parseInt(color.substr(0, 2), 16);
    const g = parseInt(color.substr(2, 2), 16);
    const b = parseInt(color.substr(4, 2), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return yiq >= 128 ? '#000000' : '#ffffff';
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-amber-500" />
            Adicionar Candidato
          </DialogTitle>
        </DialogHeader>

        {examPrimaryTags.length > 0 && (
          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Shield className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">Acesso Restrito por Tag Primária</p>
              <p className="text-blue-700 mt-1">
                Este exame requer as seguintes tags primárias:
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {examPrimaryTags.map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: tag.color,
                      color: getContrastColor(tag.color),
                    }}
                  >
                    {tag.key}: {tag.value}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4 py-4">
          {/* Mode selection */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={mode === "select" ? "default" : "outline"}
              onClick={() => setMode("select")}
              className="flex-1"
            >
              Selecionar Usuário Existente
            </Button>
            <Button
              type="button"
              variant={mode === "create" ? "default" : "outline"}
              onClick={() => setMode("create")}
              className="flex-1"
            >
              Criar Novo Candidato
            </Button>
          </div>

          {/* Select existing user */}
          {mode === "select" && (
            <div className="space-y-2">
              <Label htmlFor="user">Selecionar Usuário *</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger id="user">
                  <SelectValue placeholder="Selecione um usuário" />
                </SelectTrigger>
                <SelectContent>
                  {eligibleUsers.length === 0 ? (
                    <div className="p-2 text-sm text-gray-500 text-center">
                      Nenhum usuário elegível disponível
                    </div>
                  ) : (
                    eligibleUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex items-center gap-2">
                          <span>{user.name}</span>
                          {user.email && (
                            <span className="text-xs text-gray-500">
                              ({user.email})
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>

              {selectedUserId && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="space-y-1 text-sm">
                    <p className="font-medium text-gray-900">{newUserName}</p>
                    {newUserEmail && (
                      <p className="text-gray-600">
                        <span className="font-medium">Email:</span> {newUserEmail}
                      </p>
                    )}
                    {newUserCpf && (
                      <p className="text-gray-600">
                        <span className="font-medium">CPF:</span> {newUserCpf}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Show info about ineligible users */}
              {eligibleUsers.length === 0 && (ineligibleUsers.alreadyAssigned.length > 0 || ineligibleUsers.wrongPrimaryTag.length > 0) && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium">Usuários Não Elegíveis</p>
                    {ineligibleUsers.alreadyAssigned.length > 0 && (
                      <p className="text-amber-700 mt-1">
                        {ineligibleUsers.alreadyAssigned.length} já estão neste exame
                      </p>
                    )}
                    {ineligibleUsers.wrongPrimaryTag.length > 0 && (
                      <p className="text-amber-700 mt-1">
                        {ineligibleUsers.wrongPrimaryTag.length} não possuem as tags primárias correspondentes
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Create new user */}
          {mode === "create" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newUserName">Nome Completo *</Label>
                <Input
                  id="newUserName"
                  placeholder="Ex: João da Silva"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newUserPhone">Celular *</Label>
                <div className="flex gap-2">
                  {/* Country Selector */}
                  <Select value={country.iso2} onValueChange={(value) => setCountry(value as any)}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue>
                        <span className="flex items-center gap-2">
                          <span>{countryFlags[country.iso2] || '🌍'}</span>
                          <span className="text-xs">+{country.dialCode}</span>
                        </span>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {/* Brazil */}
                      <SelectItem value="br">
                        <span className="flex items-center gap-2">
                          <span>🇧🇷</span>
                          <span>Brazil</span>
                          <span className="text-xs text-gray-500">+55</span>
                        </span>
                      </SelectItem>
                      {/* United States */}
                      <SelectItem value="us">
                        <span className="flex items-center gap-2">
                          <span>🇺🇸</span>
                          <span>United States</span>
                          <span className="text-xs text-gray-500">+1</span>
                        </span>
                      </SelectItem>
                      {/* Portugal */}
                      <SelectItem value="pt">
                        <span className="flex items-center gap-2">
                          <span>🇵🇹</span>
                          <span>Portugal</span>
                          <span className="text-xs text-gray-500">+351</span>
                        </span>
                      </SelectItem>
                      {/* Argentina */}
                      <SelectItem value="ar">
                        <span className="flex items-center gap-2">
                          <span>🇦🇷</span>
                          <span>Argentina</span>
                          <span className="text-xs text-gray-500">+54</span>
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Phone Input */}
                  <Input
                    ref={inputRef}
                    id="newUserPhone"
                    type="tel"
                    placeholder="(38) 9 1111-1111"
                    value={inputValue}
                    onChange={handlePhoneValueChange}
                    className={errors.phone ? "border-red-500 flex-1" : "flex-1"}
                  />
                </div>
                {errors.phone && (
                  <p className="text-xs text-red-500">{errors.phone}</p>
                )}
                <p className="text-xs text-gray-500">
                  Para Brasil: (38) 9 1111-1111
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newUserEmail">Email (opcional)</Label>
                <Input
                  id="newUserEmail"
                  type="email"
                  placeholder="joao.silva@email.com"
                  value={newUserEmail}
                  onChange={handleEmailChange}
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && (
                  <p className="text-xs text-red-500">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="newUserCpf">CPF (opcional)</Label>
                <Input
                  id="newUserCpf"
                  placeholder="000.000.000-00"
                  value={newUserCpf}
                  onChange={handleCpfChange}
                  className={errors.cpf ? "border-red-500" : ""}
                />
                {errors.cpf && (
                  <p className="text-xs text-red-500">{errors.cpf}</p>
                )}
                <p className="text-xs text-gray-500">
                  Formato: 000.000.000-00
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={(mode === "select" && !isValidSelect) || (mode === "create" && !isValidCreate)}
            className="bg-amber-500 hover:bg-amber-600"
          >
            <Check className="w-4 h-4 mr-2" />
            Adicionar Candidato
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
