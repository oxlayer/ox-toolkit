import type { Meta, StoryObj } from "@storybook/react";
import {
  OnboardingCard,
  OnboardingCardContent,
  OnboardingCardDivider,
  OnboardingCardHeader,
} from "../onboarding-card";

const meta: Meta<typeof OnboardingCard> = {
  title: "Pages/Onboarding/OnboardingCard",
  component: OnboardingCard,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A card component used in the onboarding flow with header, content, and divider sections.",
      },
    },
  },
  decorators: [
    Story => (
      <div className="w-[500px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default onboarding card with header and content
 */
export const Default: Story = {
  args: {},
  render: () => (
    <OnboardingCard>
      <OnboardingCardHeader title="Welcome" description="Get started with your account" />
      <OnboardingCardContent>
        <p className="text-sm text-muted-foreground">Card content goes here</p>
      </OnboardingCardContent>
    </OnboardingCard>
  ),
};

/**
 * Card with divider section
 */
export const WithDivider: Story = {
  args: {},
  render: () => (
    <OnboardingCard>
      <OnboardingCardHeader title="Setup" description="Configure your preferences" />
      <OnboardingCardDivider label="Section 1" />
      <OnboardingCardContent>
        <p className="text-sm text-muted-foreground">Content above divider</p>
      </OnboardingCardContent>
      <OnboardingCardDivider label="Section 2" />
      <OnboardingCardContent>
        <p className="text-sm text-muted-foreground">Content below divider</p>
      </OnboardingCardContent>
    </OnboardingCard>
  ),
};

/**
 * Card with only header
 */
export const HeaderOnly: Story = {
  args: {},
  render: () => (
    <OnboardingCard>
      <OnboardingCardHeader title="Simple Card" />
    </OnboardingCard>
  ),
};
