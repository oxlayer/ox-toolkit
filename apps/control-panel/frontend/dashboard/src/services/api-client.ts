/**
 * API Client Hooks
 *
 * Convenience wrappers around the generated API hooks
 */

import {
  // Types
  type Organization,
  type Developer,
  type License,
  type ApiKey,
  type ApiKeyCreated,
  type PostV1OrganizationsMutationRequest,
  type PatchV1OrganizationsIdMutationRequest,
  type PostV1OrganizationsOrganizationidDevelopersMutationRequest,
  type PatchV1DevelopersIdMutationRequest,
  type PostV1OrganizationsOrganizationidLicensesMutationRequest,
  type PatchV1LicensesIdMutationRequest,
  type PostV1LicensesIdPackagesMutationRequest,
  type PutV1LicensesIdCapabilitiesCapabilityMutationRequest,
  type PostV1OrganizationsOrganizationidApiKeysMutationRequest,
  type PatchV1ApiKeysIdMutationRequest,

  // Organizations hooks
  useGetV1Organizations,
  useGetV1OrganizationsId,
  usePostV1Organizations,
  usePatchV1OrganizationsId,
  useDeleteV1OrganizationsId,

  // Developers hooks
  useGetV1Developers,
  useGetV1DevelopersId,
  usePostV1OrganizationsOrganizationidDevelopers,
  usePatchV1DevelopersId,
  useDeleteV1DevelopersId,

  // Licenses hooks
  useGetV1Licenses,
  useGetV1LicensesId,
  usePostV1OrganizationsOrganizationidLicenses,
  usePatchV1LicensesId,
  useDeleteV1LicensesId,
  usePostV1LicensesIdActivate,
  usePostV1LicensesIdSuspend,
  usePostV1LicensesIdRevoke,
  usePostV1LicensesIdPackages,
  useDeleteV1LicensesIdPackagesPackage,
  usePutV1LicensesIdCapabilitiesCapability,
  useDeleteV1LicensesIdCapabilitiesCapability,

  // API Keys hooks
  useGetV1ApiKeys,
  useGetV1ApiKeysId,
  usePostV1OrganizationsOrganizationidApiKeys,
  usePatchV1ApiKeysId,
  useDeleteV1ApiKeysId,
  usePostV1ApiKeysIdRevoke,

  // Health/Version hooks
  useGetV1Health,
  useGetV1LatestVersion,
  useGetVersion,
} from '@oxlayer/api-client';

/**
 * Organizations API Hooks
 */

export function useOrganizations() {
  return useGetV1Organizations();
}

export function useOrganization(id: string) {
  return useGetV1OrganizationsId(id);
}

export function useCreateOrganization() {
  return usePostV1Organizations();
}

export function useUpdateOrganization() {
  return usePatchV1OrganizationsId();
}

export function useDeleteOrganization() {
  return useDeleteV1OrganizationsId();
}

/**
 * Developers API Hooks
 */

export function useDevelopers(organizationId?: string) {
  return useGetV1Developers(organizationId ? { organization_id: organizationId } : undefined);
}

export function useDeveloper(id: string) {
  return useGetV1DevelopersId(id);
}

export function useCreateDeveloper() {
  return usePostV1OrganizationsOrganizationidDevelopers();
}

export function useUpdateDeveloper() {
  return usePatchV1DevelopersId();
}

export function useDeleteDeveloper() {
  return useDeleteV1DevelopersId();
}

/**
 * Licenses API Hooks
 */

export function useLicenses(organizationId?: string) {
  return useGetV1Licenses(organizationId ? { organization_id: organizationId } : undefined);
}

export function useLicense(id: string) {
  return useGetV1LicensesId(id);
}

export function useCreateLicense() {
  return usePostV1OrganizationsOrganizationidLicenses();
}

export function useUpdateLicense() {
  return usePatchV1LicensesId();
}

export function useDeleteLicense() {
  return useDeleteV1LicensesId();
}

export function useActivateLicense() {
  return usePostV1LicensesIdActivate();
}

export function useSuspendLicense() {
  return usePostV1LicensesIdSuspend();
}

export function useRevokeLicense() {
  return usePostV1LicensesIdRevoke();
}

export function useAddPackageToLicense() {
  return usePostV1LicensesIdPackages();
}

export function useRemovePackageFromLicense() {
  return useDeleteV1LicensesIdPackagesPackage();
}

export function useUpdateCapabilityLimits() {
  return usePutV1LicensesIdCapabilitiesCapability();
}

export function useRemoveCapabilityFromLicense() {
  return useDeleteV1LicensesIdCapabilitiesCapability();
}

/**
 * API Keys API Hooks
 */

export function useApiKeys(organizationId?: string, licenseId?: string, developerId?: string) {
  const params: Record<string, string> = {};
  if (organizationId) params.organization_id = organizationId;
  if (licenseId) params.license_id = licenseId;
  if (developerId) params.developer_id = developerId;
  return useGetV1ApiKeys(Object.keys(params).length > 0 ? params : undefined);
}

export function useApiKey(id: string) {
  return useGetV1ApiKeysId(id);
}

export function useCreateApiKey() {
  return usePostV1OrganizationsOrganizationidApiKeys();
}

export function useUpdateApiKey() {
  return usePatchV1ApiKeysId();
}

export function useDeleteApiKey() {
  return useDeleteV1ApiKeysId();
}

export function useRevokeApiKey() {
  return usePostV1ApiKeysIdRevoke();
}

/**
 * Health/Version Hooks
 */

export function useHealth() {
  return useGetV1Health();
}

export function useLatestVersion() {
  return useGetV1LatestVersion();
}

export function useVersion() {
  return useGetVersion();
}

// Re-export types
export type {
  Organization,
  Developer,
  License,
  ApiKey,
  ApiKeyCreated,
  PostV1OrganizationsMutationRequest as CreateOrganizationInput,
  PatchV1OrganizationsIdMutationRequest as UpdateOrganizationInput,
  PostV1OrganizationsOrganizationidDevelopersMutationRequest as CreateDeveloperInput,
  PatchV1DevelopersIdMutationRequest as UpdateDeveloperInput,
  PostV1OrganizationsOrganizationidLicensesMutationRequest as CreateLicenseInput,
  PatchV1LicensesIdMutationRequest as UpdateLicenseInput,
  PostV1OrganizationsOrganizationidApiKeysMutationRequest as CreateApiKeyInput,
  PatchV1ApiKeysIdMutationRequest as UpdateApiKeyInput,
  PostV1LicensesIdPackagesMutationRequest as AddPackageToLicenseInput,
  PutV1LicensesIdCapabilitiesCapabilityMutationRequest as UpdateCapabilityLimitsInput,
};
