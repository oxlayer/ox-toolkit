/**
 * @template/ui
 *
 * Template brand UI components.
 * Re-exports all shared components from @oxlayer/shared-ui
 * and adds Template-specific tech design system components.
 */

// Re-export everything from shared-ui
export * from '@oxlayer/shared-ui';

// ============================================================================
// TEMPLATE TECH DESIGN SYSTEM (Brand-Specific)
// ============================================================================

export { BadgeTech } from "./components/tech/badge-tech";
export {
  ButtonTech,
  ButtonTech as TechButton,
  type ButtonTechProps,
} from "./components/tech/button-tech";
export {
  CardTech,
  CardTechAction,
  CardTechContent,
  CardTechDescription,
  CardTechFooter,
  CardTechHeader,
  CardTechTitle,
  CardTechToolbar,
  CardTech as TechCard,
} from "./components/tech/card-tech";
export {
  FieldTech,
  FieldTechControl,
  FieldTechDescription,
  FieldTechError,
  FieldTechLabel,
  type FieldTechDescriptionProps,
  type FieldTechErrorProps,
  type FieldTechProps,
} from "./components/tech/field-tech";
export { InputTech, inputTech, type InputTechProps } from "./components/tech/input-tech";
export { LabelTech, type LabelTechProps } from "./components/tech/label-tech";
export {
  TextareaTech,
  textareaTech,
  type TextareaTechProps,
} from "./components/tech/textarea-tech";
export { ProgressTech, type ProgressTechProps } from "./components/tech/progress-tech";
export { SectionTitle } from "./components/tech/section-title";
export {
  TechBarcode,
  TechConnector,
  TechCorner,
  TechCrosshair,
  TechDivider,
  TechLine,
  TechVector,
} from "./components/tech/tech-decorations";
export {
  WorkflowPipeline,
  type PipelineStage,
  type WorkflowPipelineProps,
} from "./components/tech/workflow-pipeline";

// ============================================================================
// TEMPLATE ONBOARDING (Brand-Specific)
// ============================================================================

export {
  OnboardingLayout,
  OnboardingLayoutCrosshairs,
  OnboardingLayoutFooter,
  OnboardingLayoutSecurityFooter,
  type OnboardingLayoutProps,
  type OnboardingLayoutCrosshairsProps,
  type OnboardingLayoutFooterProps,
  type OnboardingLayoutSecurityFooterProps,
  OnboardingCard,
  OnboardingCardHeader,
  OnboardingCardDivider,
  OnboardingCardContent,
  type OnboardingCardProps,
  type OnboardingCardHeaderProps,
  type OnboardingCardDividerProps,
  type OnboardingCardContentProps,
  OrganizationStep,
  type OrganizationStepProps,
  RepositoriesStep,
  type RepositoriesStepProps,
  InviteStep,
  type InviteStepProps,
  OnboardingWizard,
  type OnboardingWizardProps,
  type OnboardingStepConfig,
  organizationSchema,
  repositorySchema,
  repositoriesFormSchema,
  invitationSchema,
  inviteFormSchema,
  type OrganizationFormData,
  type Repository,
  type RepositoriesFormData,
  type Invitation,
  type InviteFormData,
} from "./pages/onboarding";
