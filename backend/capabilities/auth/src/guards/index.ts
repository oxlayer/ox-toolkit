/**
 * Role-based access control guards
 *
 * Export all guard functions and types
 */

export {
  roleGuard,
  platformGuard,
  clientGuard,
  candidateGuard,
  workspaceGuard,
  organizationGuard,
  realmGuard,
  type RoleGuardOptions,
} from './roles.js';
