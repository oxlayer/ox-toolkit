import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { OnboardingWizard, type OnboardingStepConfig } from "../onboarding-wizard";
import { OrganizationStep } from "../step-organization";

const meta: Meta<typeof OrganizationStep> = {
  title: "Pages/Onboarding/OrganizationStep",
  component: OrganizationStep,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "A form step for creating an organization during the onboarding process. Collects organization name with validation.",
      },
    },
  },
  args: {
    onSubmit: fn(async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }),
  },
  decorators: [
    (Story, context) => {
      const steps: OnboardingStepConfig[] = [
        {
          step: 1,
          title: "Organization",
          content: <Story {...context.args} />,
        },
      ];

      return (
        <OnboardingWizard
          title="Welcome to Compozy"
          description="Complete these steps to get started with your workspace."
          currentStep={1}
          steps={steps}
        />
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Organization step in real-world context with layout, card, and stepper
 */
export const Default: Story = {
  args: {},
};

/**
 * Organization step with default value
 */
export const WithDefaultValue: Story = {
  args: {
    defaultValues: {
      name: "Acme Inc",
    },
  },
};

/**
 * Organization step in loading state
 */
export const Loading: Story = {
  args: {
    isLoading: true,
  },
};
