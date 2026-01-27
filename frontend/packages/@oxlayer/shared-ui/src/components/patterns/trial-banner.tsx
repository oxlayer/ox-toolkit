import { InfoIcon, TriangleAlertIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "../base/alert";

// ============================================================================
// Component Types
// ============================================================================

export interface TrialBannerProps {
  /** Number of days remaining in the trial */
  daysRemaining: number;
  /** Additional class name for the container */
  className?: string;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Pluralize "day" based on the count.
 * Returns "day" for 1, "days" for other values.
 */
function pluralizeDays(count: number): string {
  return count === 1 ? "day" : "days";
}

/**
 * Check if the trial is in urgent state (less than 3 days remaining).
 */
function isUrgent(daysRemaining: number): boolean {
  return daysRemaining < 3;
}

// ============================================================================
// Component
// ============================================================================

/**
 * A banner component that displays trial status and days remaining.
 * Shows urgent styling when less than 3 days remain in the trial.
 *
 * Accessibility:
 * - Uses `role="alert"` for urgent state (< 3 days)
 * - Uses `role="status"` for normal state
 * - Color is not the only means of conveying urgency (also uses icon and text)
 *
 * @example
 * // Normal state (7 days remaining)
 * <TrialBanner daysRemaining={7} />
 *
 * @example
 * // Urgent state (2 days remaining)
 * <TrialBanner daysRemaining={2} />
 */
export function TrialBanner({ daysRemaining, className }: TrialBannerProps) {
  // Clamp daysRemaining to minimum of 0 for display
  const displayDays = Math.max(0, daysRemaining);
  const urgent = isUrgent(daysRemaining);
  const variant = urgent ? "warning" : "info";
  const Icon = urgent ? TriangleAlertIcon : InfoIcon;

  const title = urgent
    ? `${displayDays} ${pluralizeDays(displayDays)} remaining in your trial!`
    : `${displayDays} ${pluralizeDays(displayDays)} remaining in your trial`;

  const description = urgent
    ? "Subscribe to avoid losing access to Compozy"
    : "Subscribe to continue using Compozy after your trial ends";

  // Use role="alert" for urgent state so screen readers announce it immediately
  // Use role="status" for normal state for polite announcement
  const role = urgent ? "alert" : "status";

  return (
    <Alert variant={variant} className={className} role={role}>
      <Icon className="size-4" />
      <AlertTitle className={urgent ? "font-bold" : undefined}>{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
    </Alert>
  );
}
