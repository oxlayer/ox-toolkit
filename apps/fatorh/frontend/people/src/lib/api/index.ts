// API hooks barrel export
export { useWorkspaces } from './use-workspaces';
export { useExams } from './use-exams';
export { useQuestions } from './use-questions';
export { useCandidates } from './use-candidates';
export { useAnswers } from './use-answers';
export { useTags } from './use-tags';
export { useTemplates } from './use-templates';
export { useCampaigns } from './use-campaigns';
export { useEvaluations } from './use-evaluations';
export { useExamCandidates } from './use-exam-candidates';

// API client exports
export { api, apiFetch, setCurrentWorkspace, getCurrentWorkspaceId, type ApiError } from '../api-client';
