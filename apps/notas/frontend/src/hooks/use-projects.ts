import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { projectsApi, sectionsApi, projectQueryKeys, sectionQueryKeys } from '@/lib/api/projects';
import { useAuth } from '@/lib/auth';
import type {
  Project,
  CreateProjectInput,
  CreateSectionInput,
} from '@/types';

// ============================================================================
// PROJECTS HOOKS
// ============================================================================

/**
 * Hook to fetch all projects
 * Only fetches from server when authenticated
 */
export function useProjects() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: projectQueryKeys.lists(),
    queryFn: async () => {
      const response = await projectsApi.getAll();
      return response.projects;
    },
    enabled: isAuthenticated, // Only fetch from server when logged in
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch a single project by ID
 * Only fetches from server when authenticated
 */
export function useProject(id: string) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: projectQueryKeys.detail(id),
    queryFn: async () => {
      const response = await projectsApi.getById(id);
      return response.project;
    },
    enabled: !!id && isAuthenticated, // Only fetch when logged in
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to create a project
 */
export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateProjectInput) => projectsApi.create(input),
    onSuccess: (response) => {
      const newProject = response.project;
      // Invalidate and refetch projects list
      queryClient.invalidateQueries({ queryKey: projectQueryKeys.lists() });

      // Add the new project to the cache optimistically
      queryClient.setQueryData(
        projectQueryKeys.detail(newProject.id),
        newProject
      );
    },
  });
}

/**
 * Hook to update a project
 */
export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CreateProjectInput> }) =>
      projectsApi.update(id, input),
    onMutate: async ({ id, input }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: projectQueryKeys.detail(id) });

      // Snapshot previous value
      const previousProject = queryClient.getQueryData<Project>(
        projectQueryKeys.detail(id)
      );

      // Optimistically update to the new value
      queryClient.setQueryData<Project>(
        projectQueryKeys.detail(id),
        (old) => ({
          ...old!,
          ...input,
          updatedAt: new Date().toISOString(),
        } as Project)
      );

      // Return context with previous value
      return { previousProject };
    },
    onError: (_error, variables, context) => {
      // Rollback to previous value on error
      if (context?.previousProject) {
        queryClient.setQueryData(
          projectQueryKeys.detail(variables.id),
          context.previousProject
        );
      }
    },
    onSettled: (_data, _error, variables) => {
      // Refetch to ensure server state
      queryClient.invalidateQueries({ queryKey: projectQueryKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: projectQueryKeys.lists() });
    },
  });
}

/**
 * Hook to delete a project
 */
export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => projectsApi.delete(id),
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: projectQueryKeys.detail(deletedId) });
      // Invalidate list
      queryClient.invalidateQueries({ queryKey: projectQueryKeys.lists() });
    },
  });
}

// ============================================================================
// SECTIONS HOOKS
// ============================================================================

/**
 * Hook to fetch sections for a project
 * Only fetches from server when authenticated
 */
export function useSections(projectId: string) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: sectionQueryKeys.list(projectId),
    queryFn: async () => {
      const response = await projectsApi.getSections(projectId);
      return response.sections;
    },
    enabled: !!projectId && isAuthenticated, // Only fetch when logged in
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to create a section
 */
export function useCreateSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateSectionInput) => sectionsApi.create(input),
    onSuccess: (_data, variables) => {
      // Invalidate sections list for this project
      queryClient.invalidateQueries({
        queryKey: sectionQueryKeys.list(variables.projectId),
      });
    },
  });
}

/**
 * Hook to update a section
 */
export function useUpdateSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CreateSectionInput> }) =>
      sectionsApi.update(id, input),
    onSuccess: () => {
      // We need to invalidate all section lists since we don't know which project
      // this section belongs to without additional data
      queryClient.invalidateQueries({ queryKey: sectionQueryKeys.lists() });
    },
  });
}

/**
 * Hook to delete a section
 */
export function useDeleteSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { id: string; projectId: string }) =>
      sectionsApi.delete(params.id),
    onSuccess: (_data, variables) => {
      // Invalidate sections list for this project
      queryClient.invalidateQueries({
        queryKey: sectionQueryKeys.list(variables.projectId),
      });
    },
  });
}
