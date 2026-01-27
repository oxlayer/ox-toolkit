import {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { setCurrentWorkspace } from "@/lib/api-client";
import { getRealm } from "@/lib/keycloak";
import {
  useWorkspaces,
  useExams,
  useQuestions,
  useCandidates,
  useTags,
  useTemplates,
  useCampaigns,
  useEvaluations,
  useExamCandidates,
} from "@/lib/api";
import { useAuth } from "./AuthContext";
import type { Organization, Workspace } from "@/types/organization";
import type {
  Exam,
  Answer,
  EvaluationResult,
  Question,
  NewExam,
  NewQuestion,
  WhatsAppCampaign,
  NewWhatsAppCampaign,
  Template,
  NewTemplate,
  ExamCandidate,
  NewExamCandidate,
  Tag,
  NewTag,
  Candidate,
  NewCandidate,
} from "@/types/admin";

interface WorkspaceContextState {
  // Estado
  currentOrganization: Organization | null;
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];

  // Ações
  setCurrentWorkspace: (workspaceId: string) => void;
  setCurrentOrganization: (organizationId: string) => void;

  // CRUD de Workspaces
  addWorkspace: (data: {
    name: string;
    description?: string;
    domainAliases?: string[];
    rootManagerEmail?: string;
  }) => Promise<void>;
  updateWorkspace: (workspaceId: string, data: { name?: string; description?: string }) => Promise<void>;
  deleteWorkspace: (workspaceId: string) => Promise<void>;

  // CRUD de Exames
  addExam: (exam: NewExam) => Promise<void>;
  updateExam: (examId: string, data: Partial<Exam>) => Promise<void>;
  deleteExam: (examId: string) => Promise<void>;
  cloneExam: (examId: string, newName: string, targetWorkspaceId: string) => Promise<void>;

  // CRUD de Questions
  addQuestion: (question: NewQuestion) => Promise<void>;
  updateQuestion: (questionId: string, data: Partial<Question>) => Promise<void>;
  deleteQuestion: (questionId: string) => Promise<void>;
  getQuestionsByExamId: (examId: string) => Question[];

  // CRUD de WhatsApp Campaigns
  addWhatsAppCampaign: (campaign: NewWhatsAppCampaign) => Promise<void>;
  updateWhatsAppCampaign: (campaignId: string, data: Partial<WhatsAppCampaign>) => Promise<void>;
  deleteWhatsAppCampaign: (campaignId: string) => Promise<void>;
  getWhatsAppCampaignsByExamId: (examId: string) => WhatsAppCampaign[];

  // CRUD de Templates
  addTemplate: (template: NewTemplate) => Promise<void>;
  updateTemplate: (templateId: string, data: Partial<Template>) => Promise<void>;
  deleteTemplate: (templateId: string) => Promise<void>;
  getTemplatesByType: (type: 'whatsapp' | 'email') => Template[];

  // CRUD de Exam Candidates
  addExamCandidate: (candidate: NewExamCandidate) => Promise<void>;
  removeExamCandidate: (candidateId: string) => Promise<void>;
  getExamCandidatesByExamId: (examId: string) => ExamCandidate[];
  getExamCandidatesByUserId: (userId: string) => ExamCandidate[];

  // CRUD de Candidates
  addCandidate: (candidate: NewCandidate) => Promise<void>;
  updateCandidate: (candidateId: string, data: Partial<Candidate>) => Promise<void>;
  deleteCandidate: (candidateId: string) => Promise<void>;

  // CRUD de Tags
  addTag: (tag: NewTag) => Promise<void>;
  updateTag: (tagId: string, data: Partial<Tag>) => Promise<void>;
  deleteTag: (tagId: string) => Promise<void>;
  getTagsByKey: (key: string) => Tag[];
  getTagsByKeyAndValue: (key: string, value: string) => Tag[];
  getTagKeys: () => string[];
  getTagValuesByKey: (key: string) => string[];
  getPrimaryTags: () => Tag[];
  getExamPrimaryTags: (examId: string) => Tag[];
  getUserPrimaryTags: (userId: string) => Tag[];

  // Dados filtrados pelo workspace
  filteredExams: Exam[];
  filteredAnswers: Answer[];
  filteredEvaluationResults: EvaluationResult[];
  filteredQuestions: Question[];
  filteredWhatsAppCampaigns: WhatsAppCampaign[];
  filteredTemplates: Template[];
  filteredExamCandidates: ExamCandidate[];
  filteredTags: Tag[];
  filteredCandidates: Candidate[];
}

const WorkspaceContext = createContext<WorkspaceContextState | undefined>(
  undefined
);

export const WorkspaceProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const { organizations } = useAuth();

  // Initialize organization from JWT or localStorage
  const [currentOrganization, setCurrentOrganizationState] =
    useState<Organization | null>(() => {
      const savedOrgId = localStorage.getItem("currentOrganizationId");
      if (savedOrgId && organizations) {
        return organizations.find((org) => org.id === savedOrgId) || organizations[0] || null;
      }
      return organizations?.[0] || null;
    });

  // Initialize workspace from localStorage
  const [currentWorkspace, setCurrentWorkspaceState] =
    useState<Workspace | null>(() => {
      const savedWorkspaceId = localStorage.getItem("currentWorkspaceId");
      return savedWorkspaceId ? { id: savedWorkspaceId } as Workspace : null;
    });

  // API hooks - pass workspace filter when available
  const { workspaces, create: createWorkspace, update: updateWorkspaceApi, remove: deleteWorkspaceApi } = useWorkspaces(currentOrganization?.id);
  const { exams, create: createExam, update: updateExamApi, remove: deleteExamApi } = useExams({ workspaceId: currentWorkspace?.id });
  const { questions, create: createQuestion, update: updateQuestionApi, remove: deleteQuestionApi } = useQuestions();
  const { candidates, create: createCandidate, update: updateCandidateApi, remove: deleteCandidateApi } = useCandidates(currentWorkspace?.id);
  const { tags, create: createTag, update: updateTagApi, remove: deleteTagApi } = useTags(currentWorkspace?.id);
  const { templates, create: createTemplate, update: updateTemplateApi, remove: deleteTemplateApi } = useTemplates(currentWorkspace?.id);
  const { campaigns, create: createCampaign, update: updateCampaignApi, remove: deleteCampaignApi } = useCampaigns();
  const { bulkEvaluate, getByExamAndCpf } = useEvaluations();
  const { examCandidates, create: createExamCandidate, remove: removeExamCandidateMutation } = useExamCandidates();

  // Note: filteredAnswers and filteredEvaluationResults would need corresponding API hooks
  // For now, they return empty arrays to maintain interface compatibility
  const filteredAnswers: Answer[] = [];
  const filteredEvaluationResults: EvaluationResult[] = [];

  // Workspace switching with query invalidation
  const setCurrentWorkspace = useCallback((workspaceId: string) => {
    const workspace = workspaces.find((ws) => ws.id === workspaceId);
    if (workspace) {
      setCurrentWorkspaceState(workspace);
      setCurrentWorkspace(workspace);
      localStorage.setItem("currentWorkspaceId", workspaceId);

      // Invalidate all queries to refetch for new workspace
      queryClient.invalidateQueries();
      toast.success(`Switched to ${workspace.name}`);
    }
  }, [workspaces, queryClient]);

  // Initialize workspace when workspaces are loaded
  // This handles: 1) Restoring full workspace from localStorage ID
  //                2) Selecting first available workspace if none selected
  useEffect(() => {
    if (workspaces && workspaces.length > 0) {
      const savedWorkspaceId = localStorage.getItem("currentWorkspaceId");

      if (savedWorkspaceId) {
        // Try to find the saved workspace in the loaded workspaces
        const savedWorkspace = workspaces.find((ws) => ws.id === savedWorkspaceId);
        if (savedWorkspace) {
          // Found the saved workspace - use it (only if not already set properly)
          if (!currentWorkspace || currentWorkspace.id !== savedWorkspace.id || !currentWorkspace.name) {
            setCurrentWorkspaceState(savedWorkspace);
            console.log('[WorkspaceContext] Restored workspace from localStorage:', savedWorkspace.name);
          }
          return;
        }
        // Saved workspace not found - fall through to first workspace
      }

      // No saved workspace or saved workspace not found - select first workspace
      if (!currentWorkspace || !currentWorkspace.name) {
        const firstWorkspace = workspaces[0];
        setCurrentWorkspaceState(firstWorkspace);
        localStorage.setItem("currentWorkspaceId", firstWorkspace.id);
        console.log('[WorkspaceContext] Auto-selected first workspace:', firstWorkspace.name);
      }
    }
  }, [workspaces, currentWorkspace]);

  // Organization switching
  const setCurrentOrganization = useCallback((organizationId: string) => {
    const organization = organizations?.find(
      (org) => org.id === organizationId
    );
    if (organization) {
      setCurrentOrganizationState(organization);
      localStorage.setItem("currentOrganizationId", organizationId);

      // Invalidate workspaces query to get workspaces for new organization
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });

      // Select first workspace of new organization after data refresh
      setTimeout(() => {
        const orgWorkspaces = workspaces.filter(
          (ws) => ws.organizationId === organizationId
        );
        if (orgWorkspaces.length > 0) {
          setCurrentWorkspace(orgWorkspaces[0].id);
        }
      }, 100);
    }
  }, [organizations, workspaces, setCurrentWorkspace, queryClient]);

  // CRUD operations using API mutations
  const addWorkspace = useCallback(async (data: {
    name: string;
    description?: string;
    domainAliases?: string[];
    rootManagerEmail?: string;
  }) => {
    const realm = getRealm();
    await createWorkspace.mutateAsync({
      ...data,
      organizationId: currentOrganization?.id,
      realmId: realm,
      domainAliases: data.domainAliases,
      rootManagerEmail: data.rootManagerEmail,
    });
  }, [currentOrganization, createWorkspace]);

  const updateWorkspace = useCallback(async (workspaceId: string, data: { name?: string; description?: string }) => {
    await updateWorkspaceApi.mutateAsync({ id: workspaceId, data });
  }, [updateWorkspaceApi]);

  const deleteWorkspace = useCallback(async (workspaceId: string) => {
    await deleteWorkspaceApi.mutateAsync(workspaceId);
  }, [deleteWorkspaceApi]);

  const addExam = useCallback(async (exam: NewExam) => {
    if (!currentWorkspace) {
      throw new Error("No workspace selected");
    }
    await createExam.mutateAsync({ ...exam, workspaceId: currentWorkspace.id });
  }, [currentWorkspace, createExam]);

  const updateExam = useCallback(async (examId: string, data: Partial<Exam>) => {
    await updateExamApi.mutateAsync({ id: examId, data });
  }, [updateExamApi]);

  const deleteExam = useCallback(async (examId: string) => {
    await deleteExamApi.mutateAsync(examId);
  }, [deleteExamApi]);

  const cloneExam = useCallback(async (examId: string, newName: string, targetWorkspaceId: string) => {
    // Get the original exam
    const originalExam = exams.find((e) => e.id === examId);
    if (!originalExam) {
      throw new Error("Exam not found");
    }

    // Create new exam with cloned data
    await createExam.mutateAsync({
      workspaceId: targetWorkspaceId,
      examName: newName,
      durationMinutes: originalExam.durationMinutes,
      tags: [...(originalExam.tags || [])],
    });

    // Clone questions for the exam
    const examQuestions = questions.filter((q) => q.examId === examId);
    for (const question of examQuestions) {
      await createQuestion.mutateAsync({
        ...question,
        examId: newName, // This will need to be updated with the actual new exam ID
      });
    }
  }, [exams, questions, createExam, createQuestion]);

  const addQuestion = useCallback(async (question: NewQuestion) => {
    await createQuestion.mutateAsync(question);
  }, [createQuestion]);

  const updateQuestion = useCallback(async (questionId: string, data: Partial<Question>) => {
    await updateQuestionApi.mutateAsync({ id: questionId, data });
  }, [updateQuestionApi]);

  const deleteQuestion = useCallback(async (questionId: string) => {
    await deleteQuestionApi.mutateAsync(questionId);
  }, [deleteQuestionApi]);

  const getQuestionsByExamId = useCallback((examId: string): Question[] => {
    return questions
      .filter((q) => q.examId === examId)
      .sort((a, b) => a.order - b.order);
  }, [questions]);

  const addWhatsAppCampaign = useCallback(async (campaign: NewWhatsAppCampaign) => {
    await createCampaign.mutateAsync(campaign);
  }, [createCampaign]);

  const updateWhatsAppCampaign = useCallback(async (campaignId: string, data: Partial<WhatsAppCampaign>) => {
    await updateCampaignApi.mutateAsync({ id: campaignId, data });
  }, [updateCampaignApi]);

  const deleteWhatsAppCampaign = useCallback(async (campaignId: string) => {
    await deleteCampaignApi.mutateAsync(campaignId);
  }, [deleteCampaignApi]);

  const getWhatsAppCampaignsByExamId = useCallback((examId: string): WhatsAppCampaign[] => {
    return campaigns
      .filter((c) => c.examId === examId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [campaigns]);

  const addTemplate = useCallback(async (template: NewTemplate) => {
    if (!currentWorkspace) {
      throw new Error("No workspace selected");
    }
    await createTemplate.mutateAsync({ ...template, workspaceId: currentWorkspace.id });
  }, [currentWorkspace, createTemplate]);

  const updateTemplate = useCallback(async (templateId: string, data: Partial<Template>) => {
    await updateTemplateApi.mutateAsync({ id: templateId, data });
  }, [updateTemplateApi]);

  const deleteTemplate = useCallback(async (templateId: string) => {
    await deleteTemplateApi.mutateAsync(templateId);
  }, [deleteTemplateApi]);

  const getTemplatesByType = useCallback((type: 'whatsapp' | 'email'): Template[] => {
    return templates
      .filter((t) => t.type === type)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [templates]);

  // Exam candidates - using the new API hook
  const addExamCandidate = useCallback(async (candidate: NewExamCandidate) => {
    await createExamCandidate.mutateAsync(candidate);
  }, [createExamCandidate]);

  const removeExamCandidate = useCallback(async (candidateId: string) => {
    await removeExamCandidateMutation.mutateAsync(candidateId);
  }, [removeExamCandidateMutation]);

  const getExamCandidatesByExamId = useCallback((examId: string): ExamCandidate[] => {
    return examCandidates.filter((c: ExamCandidate) => c.examId === examId);
  }, [examCandidates]);

  const getExamCandidatesByUserId = useCallback((userId: string): ExamCandidate[] => {
    return examCandidates.filter((c: ExamCandidate) => c.userId === userId);
  }, [examCandidates]);

  // Candidate operations
  const addCandidate = useCallback(async (candidate: NewCandidate) => {
    if (!currentWorkspace) {
      throw new Error("No workspace selected");
    }
    await createCandidate.mutateAsync({ ...candidate, workspaceId: currentWorkspace.id });
  }, [currentWorkspace, createCandidate]);

  const updateCandidate = useCallback(async (candidateId: string, data: Partial<Candidate>) => {
    await updateCandidateApi.mutateAsync({ id: candidateId, data });
  }, [updateCandidateApi]);

  const deleteCandidate = useCallback(async (candidateId: string) => {
    await deleteCandidateApi.mutateAsync(candidateId);
  }, [deleteCandidateApi]);

  // Tag operations
  const addTag = useCallback(async (tag: NewTag) => {
    await createTag.mutateAsync(tag);
  }, [createTag]);

  const updateTag = useCallback(async (tagId: string, data: Partial<Tag>) => {
    await updateTagApi.mutateAsync({ id: tagId, data });
  }, [updateTagApi]);

  const deleteTag = useCallback(async (tagId: string) => {
    await deleteTagApi.mutateAsync(tagId);
  }, [deleteTagApi]);

  const getTagsByKey = useCallback((key: string): Tag[] => {
    return tags.filter((tag) =>
      tag.key &&
      tag.key.toLowerCase() === key.toLowerCase() &&
      (!currentWorkspace || tag.workspaceId === currentWorkspace.id)
    );
  }, [tags, currentWorkspace]);

  const getTagsByKeyAndValue = useCallback((key: string, value: string): Tag[] => {
    return tags.filter(
      (tag) => tag.key && tag.value &&
        tag.key.toLowerCase() === key.toLowerCase() &&
        tag.value.toLowerCase() === value.toLowerCase() &&
        (!currentWorkspace || tag.workspaceId === currentWorkspace.id)
    );
  }, [tags, currentWorkspace]);

  const getTagKeys = useCallback((): string[] => {
    const workspaceTags = currentWorkspace
      ? tags.filter((tag) => tag.workspaceId === currentWorkspace.id)
      : tags;
    const keys = new Set(workspaceTags.map((tag) => tag.key).filter((key): key is string => !!key));
    return Array.from(keys).sort();
  }, [tags, currentWorkspace]);

  const getTagValuesByKey = useCallback((key: string): string[] => {
    const workspaceTags = currentWorkspace
      ? tags.filter((tag) => tag.workspaceId === currentWorkspace.id)
      : tags;
    const values = new Set(
      workspaceTags.filter((tag) => tag.key && tag.key.toLowerCase() === key.toLowerCase()).map((tag) => tag.value).filter((value): value is string => !!value)
    );
    return Array.from(values).sort();
  }, [tags, currentWorkspace]);

  const getPrimaryTags = useCallback((): Tag[] => {
    return tags.filter((tag) => tag.isPrimary);
  }, [tags]);

  const getExamPrimaryTags = useCallback((examId: string): Tag[] => {
    const exam = exams.find((e) => e.id === examId);
    if (!exam || !exam.tags) return [];

    return tags.filter((tag) => exam.tags.includes(tag.id) && tag.isPrimary);
  }, [exams, tags]);

  const getUserPrimaryTags = useCallback((): Tag[] => {
    // This would need user-specific data from the API
    return [];
  }, []);

  // Filtered data by workspace
  const filteredExams = useMemo(() => {
    if (!currentWorkspace) return exams;
    return exams.filter((exam) => exam.workspaceId === currentWorkspace.id);
  }, [currentWorkspace, exams]);

  const filteredQuestions = useMemo(() => {
    const examIds = filteredExams.map((exam) => exam.id);
    return questions.filter((q) => examIds.includes(q.examId));
  }, [filteredExams, questions]);

  const filteredWhatsAppCampaigns = useMemo(() => {
    if (!currentWorkspace) return campaigns;
    const examIds = filteredExams.map((e) => e.id);
    if (examIds.length === 0) return [];
    return campaigns.filter((campaign) => examIds.includes(campaign.examId));
  }, [currentWorkspace, campaigns, filteredExams]);

  const filteredTemplates = useMemo(() => {
    if (!currentWorkspace) return templates;
    return templates.filter((template) => template.workspaceId === currentWorkspace.id);
  }, [currentWorkspace, templates]);

  const filteredExamCandidates = useMemo(() => {
    const examIds = filteredExams.map((e) => e.id);
    return examCandidates.filter((c: ExamCandidate) => examIds.includes(c.examId));
  }, [filteredExams, examCandidates]);

  const filteredTags = useMemo(() => {
    if (!currentWorkspace) return tags;
    return tags.filter((tag) => tag.workspaceId === currentWorkspace.id);
  }, [currentWorkspace, tags]);

  const filteredCandidates = useMemo(() => {
    if (!currentWorkspace) return candidates;
    return candidates.filter((c) => c.workspaceId === currentWorkspace.id);
  }, [currentWorkspace, candidates]);

  // Persist organization and workspace selection
  useEffect(() => {
    if (currentOrganization) {
      localStorage.setItem("currentOrganizationId", currentOrganization.id);
    }
  }, [currentOrganization]);

  useEffect(() => {
    if (currentWorkspace) {
      localStorage.setItem("currentWorkspaceId", currentWorkspace.id);
    }
  }, [currentWorkspace]);

  const value: WorkspaceContextState = useMemo(
    () => ({
      currentOrganization,
      currentWorkspace,
      workspaces,
      setCurrentWorkspace,
      setCurrentOrganization,
      addWorkspace,
      updateWorkspace,
      deleteWorkspace,
      addExam,
      updateExam,
      deleteExam,
      cloneExam,
      addQuestion,
      updateQuestion,
      deleteQuestion,
      getQuestionsByExamId,
      addWhatsAppCampaign,
      updateWhatsAppCampaign,
      deleteWhatsAppCampaign,
      getWhatsAppCampaignsByExamId,
      addTemplate,
      updateTemplate,
      deleteTemplate,
      getTemplatesByType,
      addExamCandidate,
      removeExamCandidate,
      getExamCandidatesByExamId,
      getExamCandidatesByUserId,
      addCandidate,
      updateCandidate,
      deleteCandidate,
      addTag,
      updateTag,
      deleteTag,
      getTagsByKey,
      getTagsByKeyAndValue,
      getTagKeys,
      getTagValuesByKey,
      getPrimaryTags,
      getExamPrimaryTags,
      getUserPrimaryTags,
      filteredExams,
      filteredAnswers,
      filteredEvaluationResults,
      filteredQuestions,
      filteredWhatsAppCampaigns,
      filteredTemplates,
      filteredExamCandidates,
      filteredTags,
      filteredCandidates,
    }),
    [
      currentOrganization,
      currentWorkspace,
      workspaces,
      setCurrentWorkspace,
      setCurrentOrganization,
      addWorkspace,
      updateWorkspace,
      deleteWorkspace,
      addExam,
      updateExam,
      deleteExam,
      cloneExam,
      addQuestion,
      updateQuestion,
      deleteQuestion,
      getQuestionsByExamId,
      addWhatsAppCampaign,
      updateWhatsAppCampaign,
      deleteWhatsAppCampaign,
      getWhatsAppCampaignsByExamId,
      addTemplate,
      updateTemplate,
      deleteTemplate,
      getTemplatesByType,
      addExamCandidate,
      removeExamCandidate,
      getExamCandidatesByExamId,
      getExamCandidatesByUserId,
      addCandidate,
      updateCandidate,
      deleteCandidate,
      addTag,
      updateTag,
      deleteTag,
      getTagsByKey,
      getTagsByKeyAndValue,
      getTagKeys,
      getTagValuesByKey,
      getPrimaryTags,
      getExamPrimaryTags,
      getUserPrimaryTags,
      filteredExams,
      filteredAnswers,
      filteredEvaluationResults,
      filteredQuestions,
      filteredWhatsAppCampaigns,
      filteredTemplates,
      filteredExamCandidates,
      filteredTags,
      filteredCandidates,
    ]
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
};
