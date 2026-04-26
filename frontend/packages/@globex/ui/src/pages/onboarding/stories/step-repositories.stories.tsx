import type { Meta, StoryObj } from "@storybook/react";
import { OnboardingWizard, type OnboardingStepConfig } from "../onboarding-wizard";
import { RepositoriesStep } from "../step-repositories";

const meta: Meta<typeof RepositoriesStep> = {
  title: "Pages/Onboarding/RepositoriesStep",
  component: RepositoriesStep,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "A form step for adding repositories during onboarding. Supports multiple repositories with path and name fields.",
      },
    },
  },
  args: {
    onSubmit: async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
    },
    onSkip: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Repositories step in real-world context with layout, card, and stepper
 */
export const Default: Story = {
  args: {},
  render: args => {
    const steps: OnboardingStepConfig[] = [
      {
        step: 1,
        title: "Organization",
        content: null,
        isCompleted: true,
      },
      {
        step: 2,
        title: "Repositories",
        content: <RepositoriesStep {...args} />,
      },
    ];

    return (
      <OnboardingWizard
        title="Welcome to Compozy"
        description="Complete these steps to get started with your workspace."
        currentStep={2}
        steps={steps}
      />
    );
  },
};

/**
 * Repositories step with default values
 */
export const WithDefaultValues: Story = {
  args: {
    defaultValues: [
      {
        id: "1",
        path: "/path/to/repo1",
        name: "my-repo-1",
      },
      {
        id: "2",
        path: "/path/to/repo2",
        name: "my-repo-2",
      },
    ],
  },
  render: args => {
    const steps: OnboardingStepConfig[] = [
      {
        step: 1,
        title: "Organization",
        content: null,
        isCompleted: true,
      },
      {
        step: 2,
        title: "Repositories",
        content: <RepositoriesStep {...args} />,
      },
    ];

    return (
      <OnboardingWizard
        title="Welcome to Compozy"
        description="Complete these steps to get started with your workspace."
        currentStep={2}
        steps={steps}
      />
    );
  },
};

/**
 * Repositories step in loading state
 */
export const Loading: Story = {
  args: {
    isLoading: true,
  },
  render: args => {
    const steps: OnboardingStepConfig[] = [
      {
        step: 1,
        title: "Organization",
        content: null,
        isCompleted: true,
      },
      {
        step: 2,
        title: "Repositories",
        content: <RepositoriesStep {...args} />,
      },
    ];

    return (
      <OnboardingWizard
        title="Welcome to Compozy"
        description="Complete these steps to get started with your workspace."
        currentStep={2}
        steps={steps}
      />
    );
  },
};
