import { z } from "zod";

export const organizationSchema = z.object({
  name: z
    .string()
    .min(2, "Organization name must be at least 2 characters")
    .max(50, "Organization name must be at most 50 characters"),
});

export type OrganizationFormData = z.infer<typeof organizationSchema>;

export const repositorySchema = z.object({
  id: z.string(),
  path: z.string().min(1, "Path is required"),
  name: z.string().min(1, "Name is required"),
});

export const repositoriesFormSchema = z.object({
  repositories: z.array(repositorySchema),
});

export type Repository = z.infer<typeof repositorySchema>;
export type RepositoriesFormData = z.infer<typeof repositoriesFormSchema>;

const USER_ROLES = ["member", "admin"] as const;

export const invitationSchema = z.object({
  id: z.string(),
  email: z.string().email("Please enter a valid email address"),
  role: z.enum(USER_ROLES),
});

export const inviteFormSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  role: z.enum(USER_ROLES),
  invitations: z.array(invitationSchema),
});

export type Invitation = z.infer<typeof invitationSchema>;
export type InviteFormData = z.infer<typeof inviteFormSchema>;
