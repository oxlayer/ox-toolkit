/**
 * OxLayer Shared UI Design Tokens
 *
 * Single source of truth for design tokens across all OxLayer brand packages.
 * Brand-specific overrides are handled in individual brand packages.
 */

export const colors = {
  // Brand colors (to be overridden by brand packages)
  brand: 'var(--color-brand)',
  brandHover: 'var(--color-brand-hover)',
  brandForeground: 'var(--color-brand-foreground)',

  // Base colors
  background: 'var(--color-background)',
  foreground: 'var(--color-foreground)',

  // Surface colors
  surface: 'var(--color-surface)',
  surfaceHover: 'var(--color-surface-hover)',
  surfaceBorder: 'var(--color-surface-border)',

  // Interactive states
  primary: 'var(--color-primary)',
  primaryHover: 'var(--color-primary-hover)',
  primaryForeground: 'var(--color-primary-foreground)',

  secondary: 'var(--color-secondary)',
  secondaryHover: 'var(--color-secondary-hover)',
  secondaryForeground: 'var(--color-secondary-foreground)',

  // Status colors
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  error: 'var(--color-error)',
  info: 'var(--color-info)',

  // Text colors
  textPrimary: 'var(--color-text-primary)',
  textSecondary: 'var(--color-text-secondary)',
  textTertiary: 'var(--color-text- tertiary)',
  textInverse: 'var(--color-text-inverse)',

  // Border colors
  border: 'var(--color-border)',
  borderHover: 'var(--color-border-hover)',
  borderFocus: 'var(--color-border-focus)',
} as const;

export const spacing = {
  xs: 'var(--spacing-xs)',
  sm: 'var(--spacing-sm)',
  md: 'var(--spacing-md)',
  lg: 'var(--spacing-lg)',
  xl: 'var(--spacing-xl)',
  '2xl': 'var(--spacing-2xl)',
  '3xl': 'var(--spacing-3xl)',
} as const;

export const borderRadius = {
  none: 'var(--radius-none)',
  sm: 'var(--radius-sm)',
  md: 'var(--radius-md)',
  lg: 'var(--radius-lg)',
  xl: 'var(--radius-xl)',
  full: 'var(--radius-full)',
} as const;

export const typography = {
  fontFamily: {
    sans: 'var(--font-sans)',
    mono: 'var(--font-mono)',
    serif: 'var(--font-serif)',
  },
  fontSize: {
    xs: 'var(--text-xs)',
    sm: 'var(--text-sm)',
    base: 'var(--text-base)',
    lg: 'var(--text-lg)',
    xl: 'var(--text-xl)',
    '2xl': 'var(--text-2xl)',
    '3xl': 'var(--text-3xl)',
  },
  fontWeight: {
    normal: 'var(--font-normal)',
    medium: 'var(--font-medium)',
    semibold: 'var(--font-semibold)',
    bold: 'var(--font-bold)',
  },
} as const;

export const shadows = {
  sm: 'var(--shadow-sm)',
  md: 'var(--shadow-md)',
  lg: 'var(--shadow-lg)',
  xl: 'var(--shadow-xl)',
} as const;

export const transitions = {
  fast: 'var(--transition-fast)',
  base: 'var(--transition-base)',
  slow: 'var(--transition-slow)',
} as const;

export const zIndex = {
  dropdown: 'var(--z-dropdown)',
  sticky: 'var(--z-sticky)',
  modal: 'var(--z-modal)',
  popover: 'var(--z-popover)',
  tooltip: 'var(--z-tooltip)',
} as const;

// Type exports
export type Color = typeof colors[keyof typeof colors];
export type Spacing = typeof spacing[keyof typeof spacing];
export type BorderRadius = typeof borderRadius[keyof typeof borderRadius];
