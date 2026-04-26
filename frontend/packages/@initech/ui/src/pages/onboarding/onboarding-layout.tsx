"use client";

import type { ReactNode } from "react";
import { cn } from "@oxlayer/shared-ui";
import { TechCrosshair, TechBarcode } from "../../components/tech/tech-decorations";

interface OnboardingLayoutProps {
  children: ReactNode;
  className?: string;
}

function OnboardingLayout({ children, className }: OnboardingLayoutProps) {
  return (
    <div
      className={cn(
        "relative flex min-h-screen flex-col items-center justify-center p-6",
        className
      )}
    >
      {children}
    </div>
  );
}

interface OnboardingLayoutCrosshairsProps {
  className?: string;
}

function OnboardingLayoutCrosshairs({ className }: OnboardingLayoutCrosshairsProps) {
  return (
    <>
      <div className={cn("absolute top-4 left-4 text-muted-foreground hidden sm:block", className)}>
        <TechCrosshair />
      </div>
      <div
        className={cn("absolute top-4 right-4 text-muted-foreground hidden sm:block", className)}
      >
        <TechCrosshair />
      </div>
      <div
        className={cn("absolute bottom-4 left-4 text-muted-foreground hidden sm:block", className)}
      >
        <TechCrosshair />
      </div>
      <div
        className={cn("absolute bottom-4 right-4 text-muted-foreground hidden sm:block", className)}
      >
        <TechCrosshair />
      </div>
    </>
  );
}

interface OnboardingLayoutFooterProps {
  className?: string;
}

function OnboardingLayoutFooter({ className }: OnboardingLayoutFooterProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between text-[10px] text-muted-foreground opacity-60",
        className
      )}
    >
      <span>SECURE CONNECTION</span>
      <TechBarcode className="h-3 w-12" />
    </div>
  );
}

interface OnboardingLayoutSecurityFooterProps {
  className?: string;
}

function OnboardingLayoutSecurityFooter({ className }: OnboardingLayoutSecurityFooterProps) {
  return (
    <div className={cn("mt-8 text-center", className)}>
      <p className="text-[10px] text-muted-foreground/40 font-mono uppercase">
        Secure Connection &bull; Encrypted in transit
      </p>
    </div>
  );
}

export {
  OnboardingLayout,
  OnboardingLayoutCrosshairs,
  OnboardingLayoutFooter,
  OnboardingLayoutSecurityFooter,
  type OnboardingLayoutProps,
  type OnboardingLayoutCrosshairsProps,
  type OnboardingLayoutFooterProps,
  type OnboardingLayoutSecurityFooterProps,
};
