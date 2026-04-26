import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { OnboardingLayoutCrosshairs } from "../onboarding-layout";
import { OnboardingWizard, type OnboardingStepConfig } from "../onboarding-wizard";
import { InviteStep } from "../step-invite";
import { OrganizationStep } from "../step-organization";
import { RepositoriesStep } from "../step-repositories";

const meta: Meta<typeof OnboardingWizard> = {
  title: "Pages/Onboarding/OnboardingWizard",
  component: OnboardingWizard,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "A reusable wizard component for the onboarding flow. Handles stepper navigation, step completion states, and layout structure.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default onboarding wizard with two steps: Organization and Repositories
 */
export const Default: Story = {
  render: () => {
    const [currentStep, setCurrentStep] = useState(1);
    const [completedSteps, setCompletedSteps] = useState<number[]>([]);

    const markStepComplete = (step: number) => {
      setCompletedSteps(prev => (prev.includes(step) ? prev : [...prev, step]));
    };

    const handleOrganizationSubmit = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      markStepComplete(1);
      setCurrentStep(2);
    };

    const handleRepositoriesSubmit = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      markStepComplete(2);
    };

    const steps: OnboardingStepConfig[] = [
      {
        step: 1,
        title: "Organization",
        content: <OrganizationStep onSubmit={handleOrganizationSubmit} />,
        isCompleted: completedSteps.includes(1),
      },
      {
        step: 2,
        title: "Repositories",
        content: (
          <RepositoriesStep
            onSubmit={handleRepositoriesSubmit}
            onSkip={() => markStepComplete(2)}
          />
        ),
        isCompleted: completedSteps.includes(2),
      },
    ];

    return (
      <OnboardingWizard
        title="Welcome to Compozy"
        description="Complete these steps to get started with your workspace."
        currentStep={currentStep}
        steps={steps}
        onStepChange={setCurrentStep}
      />
    );
  },
};

/**
 * Wizard with crosshairs decoration (web app style)
 */
export const WithCrosshairs: Story = {
  render: () => {
    const [currentStep, setCurrentStep] = useState(1);
    const [completedSteps, setCompletedSteps] = useState<number[]>([]);

    const markStepComplete = (step: number) => {
      setCompletedSteps(prev => (prev.includes(step) ? prev : [...prev, step]));
    };

    const handleOrganizationSubmit = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      markStepComplete(1);
      setCurrentStep(2);
    };

    const handleRepositoriesSubmit = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      markStepComplete(2);
    };

    const steps: OnboardingStepConfig[] = [
      {
        step: 1,
        title: "Organization",
        content: <OrganizationStep onSubmit={handleOrganizationSubmit} />,
        isCompleted: completedSteps.includes(1),
      },
      {
        step: 2,
        title: "Repositories",
        content: (
          <RepositoriesStep
            onSubmit={handleRepositoriesSubmit}
            onSkip={() => markStepComplete(2)}
          />
        ),
        isCompleted: completedSteps.includes(2),
      },
    ];

    return (
      <OnboardingWizard
        title="Welcome to Compozy"
        description="Complete these steps to get started with your workspace."
        currentStep={currentStep}
        steps={steps}
        onStepChange={setCurrentStep}
        layoutDecorations={<OnboardingLayoutCrosshairs />}
      />
    );
  },
};

/**
 * Wizard with three steps: Organization, Repositories, and Team Invites
 */
export const ThreeSteps: Story = {
  render: () => {
    const [currentStep, setCurrentStep] = useState(1);
    const [completedSteps, setCompletedSteps] = useState<number[]>([]);
    const [organizationId, setOrganizationId] = useState<string | null>(null);

    const markStepComplete = (step: number) => {
      setCompletedSteps(prev => (prev.includes(step) ? prev : [...prev, step]));
    };

    const handleOrganizationSubmit = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setOrganizationId("org-123");
      markStepComplete(1);
      setCurrentStep(2);
    };

    const handleRepositoriesSubmit = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      markStepComplete(2);
      setCurrentStep(3);
    };

    const handleInviteSubmit = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      markStepComplete(3);
    };

    const steps: OnboardingStepConfig[] = [
      {
        step: 1,
        title: "Organization",
        content: <OrganizationStep onSubmit={handleOrganizationSubmit} />,
        isCompleted: completedSteps.includes(1),
      },
      {
        step: 2,
        title: "Repositories",
        content: (
          <RepositoriesStep
            onSubmit={handleRepositoriesSubmit}
            onSkip={() => {
              markStepComplete(2);
              setCurrentStep(3);
            }}
          />
        ),
        isCompleted: completedSteps.includes(2),
        isDisabled: !completedSteps.includes(1),
      },
      {
        step: 3,
        title: "Team",
        content: organizationId ? (
          <InviteStep onSubmit={handleInviteSubmit} onSkip={() => markStepComplete(3)} />
        ) : null,
        isCompleted: completedSteps.includes(3),
        isDisabled: !completedSteps.includes(2),
      },
    ];

    return (
      <OnboardingWizard
        title="Welcome to Compozy"
        description="Complete these steps to get started with your workspace."
        currentStep={currentStep}
        steps={steps}
        onStepChange={setCurrentStep}
      />
    );
  },
};

/**
 * Wizard with all steps completed
 */
export const AllStepsCompleted: Story = {
  render: () => {
    const [currentStep, setCurrentStep] = useState(2);

    const steps: OnboardingStepConfig[] = [
      {
        step: 1,
        title: "Organization",
        content: <OrganizationStep onSubmit={async () => {}} />,
        isCompleted: true,
      },
      {
        step: 2,
        title: "Repositories",
        content: <RepositoriesStep onSubmit={async () => {}} onSkip={() => {}} />,
        isCompleted: true,
      },
    ];

    return (
      <OnboardingWizard
        title="Welcome to Compozy"
        description="Complete these steps to get started with your workspace."
        currentStep={currentStep}
        steps={steps}
        onStepChange={setCurrentStep}
      />
    );
  },
};
