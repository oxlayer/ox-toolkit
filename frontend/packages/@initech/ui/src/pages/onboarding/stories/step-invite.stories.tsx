import type { Meta, StoryObj } from "@storybook/react";
import { OnboardingWizard, type OnboardingStepConfig } from "../onboarding-wizard";
import { InviteStep } from "../step-invite";

const meta: Meta<typeof InviteStep> = {
  title: "Pages/Onboarding/InviteStep",
  component: InviteStep,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "A form step for inviting team members during onboarding. Allows adding multiple invitations with email and role selection.",
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
 * Invite step in real-world context with layout, card, and stepper
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
        title: "Team",
        content: <InviteStep {...args} />,
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
 * Invite step with default invitations
 */
export const WithDefaultInvitations: Story = {
  args: {
    defaultInvitations: [
      {
        id: "1",
        email: "john@example.com",
        role: "admin",
      },
      {
        id: "2",
        email: "jane@example.com",
        role: "member",
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
        title: "Team",
        content: <InviteStep {...args} />,
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
 * Invite step in loading state
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
        title: "Team",
        content: <InviteStep {...args} />,
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
