"use client";

import { createContext } from "react";
import type { BundledTheme } from "shiki";

/**
 * Shiki theme context for light/dark mode support
 * Provides theme configuration for syntax highlighting
 * Default: Vitesse themes for consistent, modern code highlighting
 */
export const ShikiThemeContext = createContext<[BundledTheme, BundledTheme]>([
  "vitesse-light",
  "vitesse-dark",
]);

/**
 * Runtime context for Streamdown
 * Provides animation state for components
 */
export interface StreamdownRuntimeContextValue {
  isAnimating: boolean;
}

export const StreamdownRuntimeContext = createContext<StreamdownRuntimeContextValue>({
  isAnimating: false,
});
