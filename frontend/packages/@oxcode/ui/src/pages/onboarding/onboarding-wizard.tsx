"use client";

import { useMemo, type ReactNode } from "react";
import {
  Stepper,
  StepperContent,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperPanel,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from "../../components/base/stepper";
import {
  OnboardingCard,
  OnboardingCardContent,
  OnboardingCardDivider,
  OnboardingCardHeader,
} from "./onboarding-card";
import { OnboardingLayout, OnboardingLayoutSecurityFooter } from "./onboarding-layout";

export interface OnboardingStepConfig {
  step: number;
  title: string;
  content: ReactNode;
  isCompleted?: boolean;
  isDisabled?: boolean;
}

export interface OnboardingWizardProps {
  title: string;
  description?: string;
  currentStep: number;
  steps: OnboardingStepConfig[];
  onStepChange?: (step: number) => void;
  layoutDecorations?: ReactNode;
  className?: string;
}

export function OnboardingWizard({
  title,
  description,
  currentStep,
  steps,
  onStepChange,
  layoutDecorations,
  className,
}: OnboardingWizardProps) {
  const dedupedSteps = useMemo(() => {
    const seen = new Set<number>();
    const duplicates: number[] = [];
    const unique: OnboardingStepConfig[] = [];

    steps.forEach(stepConfig => {
      if (seen.has(stepConfig.step)) {
        duplicates.push(stepConfig.step);
        return;
      }

      seen.add(stepConfig.step);
      unique.push(stepConfig);
    });

    if (duplicates.length > 0) {
      console.warn("OnboardingWizard: duplicate step numbers skipped", { duplicates });
    }

    return unique;
  }, [steps]);

  const stepConfigMap = useMemo(
    () => new Map(dedupedSteps.map(step => [step.step, step])),
    [dedupedSteps]
  );

  const validStepNumbers = useMemo(
    () => new Set(dedupedSteps.map(step => step.step)),
    [dedupedSteps]
  );

  if (dedupedSteps.length === 0) {
    console.warn("OnboardingWizard: steps array is empty");

    return (
      <OnboardingLayout {...(className !== undefined ? { className } : {})}>
        {layoutDecorations}
        <div className="z-10">
          <OnboardingCard>
            <OnboardingCardHeader
              title={title}
              {...(description !== undefined ? { description } : {})}
            />
            <OnboardingCardContent>
              <p className="text-sm text-muted-foreground">No onboarding steps available.</p>
            </OnboardingCardContent>
          </OnboardingCard>
          <OnboardingLayoutSecurityFooter />
        </div>
      </OnboardingLayout>
    );
  }

  const resolvedCurrentStep = useMemo(() => {
    if (!validStepNumbers.has(currentStep)) {
      console.warn("OnboardingWizard: currentStep not found in steps", {
        currentStep,
        availableSteps: Array.from(validStepNumbers),
      });
      const firstStep = dedupedSteps[0];
      return firstStep ? firstStep.step : currentStep;
    }

    return currentStep;
  }, [currentStep, dedupedSteps, validStepNumbers]);

  const isStepCompleted = (step: number) => {
    return stepConfigMap.get(step)?.isCompleted ?? false;
  };

  const isStepDisabled = (step: number) => {
    return stepConfigMap.get(step)?.isDisabled ?? false;
  };

  return (
    <OnboardingLayout {...(className !== undefined ? { className } : {})}>
      {layoutDecorations}
      <div className="z-10">
        <OnboardingCard>
          <OnboardingCardHeader
            title={title}
            {...(description !== undefined ? { description } : {})}
          />
          <Stepper
            value={resolvedCurrentStep}
            className="w-full"
            {...(onStepChange !== undefined ? { onValueChange: onStepChange } : {})}
          >
            <OnboardingCardContent>
              <StepperNav>
                {dedupedSteps.map((stepConfig, index) => (
                  <StepperItem
                    key={stepConfig.step}
                    step={stepConfig.step}
                    completed={isStepCompleted(stepConfig.step)}
                  >
                    <StepperTrigger disabled={isStepDisabled(stepConfig.step)}>
                      <StepperIndicator>{stepConfig.step}</StepperIndicator>
                      <div className="text-left">
                        <StepperTitle>{stepConfig.title}</StepperTitle>
                      </div>
                    </StepperTrigger>
                    {index < dedupedSteps.length - 1 && <StepperSeparator />}
                  </StepperItem>
                ))}
              </StepperNav>
            </OnboardingCardContent>
            <OnboardingCardDivider className="mt-8" />
            <OnboardingCardContent>
              <StepperPanel>
                <div className="mt-6">
                  {dedupedSteps.map(stepConfig => (
                    <StepperContent key={stepConfig.step} value={stepConfig.step}>
                      {stepConfig.content}
                    </StepperContent>
                  ))}
                </div>
              </StepperPanel>
            </OnboardingCardContent>
          </Stepper>
        </OnboardingCard>
        <OnboardingLayoutSecurityFooter />
      </div>
    </OnboardingLayout>
  );
}
