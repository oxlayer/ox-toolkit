/**
 * @oxlayer/shared-ui
 *
 * Shared UI component library for all OxLayer brand packages.
 *
 * This package contains:
 * - Base UI components (Button, Input, Card, etc.)
 * - Design patterns (FormField, DataTable, etc.)
 * - Utility functions and hooks
 * - Design tokens
 * - Global styles
 *
 * Brand packages (@acme/ui, @globex/ui, @initech/ui) should:
 * 1. Import and re-export shared components
 * 2. Add brand-specific customizations
 * 3. Override design tokens via CSS variables
 * 4. Add brand-specific components only
 */

// ============================================================================
// DESIGN TOKENS
// ============================================================================

export * from './tokens';

// ============================================================================
// LIB UTILITIES
// ============================================================================

export {
  createVariantWrapper,
  createWrapper,
  reExport,
  type BaseWrapperProps,
  type PropsOf,
  type PropsWithRefOf,
  type RefOf,
  type VariantWrapperOptions,
  type WrapperOptions,
} from "./lib/component-utils";
export { composeRefs, useComposedRefs } from "./lib/compose-refs";
export { getStrictContext } from "./lib/context";
export { cva, extendVariants, type VariantProps } from "./lib/cva";
export { cn, getRandomCorners, type CornerPosition } from "./lib/utils";
export { formatFieldErrors } from "./lib/form-utils";

// ============================================================================
// HOOKS
// ============================================================================

export { useControlledState } from "./hooks/use-controlled-state";
export { useIsInView, type UseIsInViewOptions } from "./hooks/use-is-in-view";
export { useIsMobile } from "./hooks/use-mobile";
export { usePrefersReducedMotion } from "./hooks/use-prefers-reduced-motion";
export {
  useAppForm,
  withForm,
  fieldContext,
  formContext,
  useFieldContext,
  useFormContext,
} from "./hooks/use-app-form";

// ============================================================================
// THEME PROVIDER (next-themes re-export)
// ============================================================================

export { ThemeProvider, useTheme } from "next-themes";

// ============================================================================
// PRIMITIVES
// ============================================================================

export {
  Slot,
  type AnyProps,
  type DOMMotionProps,
  type SlotProps,
  type WithAsChild,
} from "./primitives/slot";

// ============================================================================
// BASE COMPONENTS
// ============================================================================

export * from "./components/base/accordion";
export * from "./components/base/alert";
export * from "./components/base/alert-dialog";
export * from "./components/base/avatar";
export * from "./components/base/badge";
export * from "./components/base/breadcrumb";
export * from "./components/base/button";
export * from "./components/base/card";
export * from "./components/base/carousel";
export {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
  type ChartLegendContentProps,
  type ChartTooltipContentProps,
} from "./components/base/chart";
export * from "./components/base/checkbox";
export * from "./components/base/checkbox-group";
export * from "./components/base/choicebox";
export * from "./components/base/code-block";
export * from "./components/base/collapsible";
export * from "./components/base/combobox";
export * from "./components/base/command";
export * from "./components/base/content-editable";
export * from "./components/base/context-menu";
export * from "./components/base/dialog";
export * from "./components/base/dialog-terminal";
export * from "./components/base/fullscreen-dialog";
export {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "./components/base/dropdown-menu";
export {
  Editable,
  EditableArea,
  EditableCancel,
  EditableInput,
  EditableLabel,
  EditablePreview,
  EditableRoot,
  EditableSubmit,
  EditableToolbar,
  EditableTrigger,
  useEditable,
  type EditableProps,
} from "./components/base/editable";
export * from "./components/base/empty";
export * from "./components/base/field";
export * from "./components/base/filters";
export * from "./components/base/group";
export * from "./components/base/hover-card";
export * from "./components/base/image-crop";
export * from "./components/base/input";
export * from "./components/base/input-group";
export * from "./components/base/item";
export * from "./components/base/item-list";
export * from "./components/base/kbd";
export * from "./components/base/label";
export * from "./components/base/list";
export { Logo, type LogoProps } from "./components/base/logo";
export * from "./components/base/markdown";
export {
  Menu,
  MenuCheckboxItem,
  MenuContent,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuLabel,
  MenuPopup,
  MenuPortal,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuShortcut,
  MenuSub,
  MenuSubContent,
  MenuSubPopup,
  MenuSubTrigger,
  MenuTrigger,
} from "./components/base/menu";
export * from "./components/base/number-field";
export * from "./components/base/page";
export * from "./components/base/pill";
export * from "./components/base/popover";
export * from "./components/base/progress";
export * from "./components/base/radio-group";
export * from "./components/base/resizable";
export * from "./components/base/scroll-area";
export * from "./components/base/select";
export * from "./components/base/select-tags";
export * from "./components/base/separator";
export * from "./components/base/sheet";
export * from "./components/base/sidebar";
export * from "./components/base/skeleton";
export * from "./components/base/slider";
export * from "./components/base/spinner";
export * from "./components/base/stepper";
export * from "./components/base/switch";
export * from "./components/base/table";
export * from "./components/base/tabs";
export * from "./components/base/text-shimmer";
export * from "./components/base/textarea";
export * from "./components/base/theme-switcher";
export {
  ToastProvider,
  Toaster,
  toast,
  type ToastOptions,
  type ToastPosition,
  type ToastTheme,
  type ToastType,
} from "./components/base/toast";
export * from "./components/base/toggle";
export { ToggleGroup, ToggleGroupItem, ToggleGroupSeparator } from "./components/base/toggle-group";
export * from "./components/base/tooltip";
export * from "./components/base/tree";
export * from "./components/base/visually-hidden-input";

// ============================================================================
// ANIMATION COMPONENTS
// ============================================================================

export {
  AnimatedGroup,
  type AnimatedGroupProps,
  type PresetType,
} from "./components/animation/animated-group";
export {
  GithubStars,
  GithubStarsIcon,
  GithubStarsLogo,
  GithubStarsNumber,
  GithubStarsParticles,
  useGithubStars,
  type GithubStarsContextType,
  type GithubStarsIconProps,
  type GithubStarsLogoProps,
  type GithubStarsNumberProps,
  type GithubStarsParticlesProps,
  type GithubStarsProps,
} from "./components/animation/github-stars";
export { LightRays } from "./components/animation/light-rays";
export {
  Particles,
  ParticlesEffect,
  useParticles,
  type ParticlesEffectProps,
  type ParticlesProps,
} from "./components/animation/particles";
export { SlidingNumber, type SlidingNumberProps } from "./components/animation/sliding-number";
export { WordRotate } from "./components/animation/word-rotate";

// ============================================================================
// PATTERN COMPONENTS
// ============================================================================

export {
  AnimatedSlashBar,
  type AnimatedSlashBarProps,
} from "./components/patterns/animated-slash-bar";
export {
  BlockPattern,
  type BlockPatternProps,
  type PatternType,
} from "./components/patterns/block-pattern";
export { CornerFiducials } from "./components/patterns/corner-fiducials";
export { HackerBackground } from "./components/patterns/hacker-background";
export { StaticSlashBar, type StaticSlashBarProps } from "./components/patterns/static-slash-bar";
export { TrialBanner, type TrialBannerProps } from "./components/patterns/trial-banner";

// ============================================================================
// KIBO UI COMPONENTS
// ============================================================================

export {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
  type DropzoneProps,
  type DropzoneContentProps,
  type DropzoneEmptyStateProps,
} from "./components/kibo-ui/dropzone";
