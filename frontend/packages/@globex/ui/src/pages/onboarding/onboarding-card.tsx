"use client";

import type { ReactNode } from "react";
import {
  CardTech,
  CardTechContent,
  CardTechDescription,
  CardTechHeader,
  CardTechTitle,
} from "../../components/tech/card-tech";
import { TechDivider } from "../../components/tech/tech-decorations";
import { cn } from "@oxlayer/shared-ui";

interface OnboardingCardProps {
  children: ReactNode;
  className?: string;
}

function OnboardingCard({ children, className }: OnboardingCardProps) {
  return (
    <CardTech className={cn("w-lg", className)} corner="techline">
      {children}
    </CardTech>
  );
}

interface OnboardingCardHeaderProps {
  title: string;
  description?: string;
  className?: string;
}

function OnboardingCardHeader({ title, description, className }: OnboardingCardHeaderProps) {
  return (
    <CardTechHeader className={cn("items-center", className)}>
      <CardTechTitle className="text-xl font-medium tracking-tight">{title}</CardTechTitle>
      {description && (
        <CardTechDescription className="text-xs text-muted-foreground/80">
          {description}
        </CardTechDescription>
      )}
    </CardTechHeader>
  );
}

interface OnboardingCardDividerProps {
  label?: string;
  className?: string;
}

function OnboardingCardDivider({ label, className }: OnboardingCardDividerProps) {
  return <TechDivider className={cn("py-2", className)}>{label}</TechDivider>;
}

interface OnboardingCardContentProps {
  children: ReactNode;
  className?: string;
}

function OnboardingCardContent({ children, className }: OnboardingCardContentProps) {
  return <CardTechContent className={cn("grid gap-4", className)}>{children}</CardTechContent>;
}

export {
  OnboardingCard,
  OnboardingCardContent,
  OnboardingCardDivider,
  OnboardingCardHeader,
  type OnboardingCardContentProps,
  type OnboardingCardDividerProps,
  type OnboardingCardHeaderProps,
  type OnboardingCardProps,
};
