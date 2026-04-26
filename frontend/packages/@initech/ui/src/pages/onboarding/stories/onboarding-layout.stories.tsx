import type { Meta, StoryObj } from "@storybook/react";
import { OnboardingCard, OnboardingCardContent, OnboardingCardHeader } from "../onboarding-card";
import {
  OnboardingLayout,
  OnboardingLayoutCrosshairs,
  OnboardingLayoutFooter,
  OnboardingLayoutSecurityFooter,
} from "../onboarding-layout";

const meta: Meta<typeof OnboardingLayout> = {
  title: "Pages/Onboarding/OnboardingLayout",
  component: OnboardingLayout,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "A full-screen layout component for the onboarding flow with decorative elements and footer.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default onboarding layout with card
 */
export const Default: Story = {
  args: {},
  render: () => (
    <OnboardingLayout>
      <OnboardingCard>
        <OnboardingCardHeader title="Welcome" description="Get started" />
        <OnboardingCardContent>
          <p className="text-sm text-muted-foreground">Layout content</p>
        </OnboardingCardContent>
      </OnboardingCard>
    </OnboardingLayout>
  ),
};

/**
 * Layout with crosshairs decoration
 */
export const WithCrosshairs: Story = {
  args: {},
  render: () => (
    <OnboardingLayout>
      <OnboardingLayoutCrosshairs />
      <OnboardingCard>
        <OnboardingCardHeader title="Welcome" description="Get started" />
        <OnboardingCardContent>
          <p className="text-sm text-muted-foreground">Layout with decorative crosshairs</p>
        </OnboardingCardContent>
      </OnboardingCard>
    </OnboardingLayout>
  ),
};

/**
 * Layout with footer
 */
export const WithFooter: Story = {
  args: {},
  render: () => (
    <OnboardingLayout>
      <OnboardingCard>
        <OnboardingCardHeader title="Welcome" description="Get started" />
        <OnboardingCardContent>
          <p className="text-sm text-muted-foreground">Layout content</p>
        </OnboardingCardContent>
      </OnboardingCard>
      <OnboardingLayoutFooter />
    </OnboardingLayout>
  ),
};

/**
 * Layout with security footer
 */
export const WithSecurityFooter: Story = {
  args: {},
  render: () => (
    <OnboardingLayout>
      <OnboardingCard>
        <OnboardingCardHeader title="Welcome" description="Get started" />
        <OnboardingCardContent>
          <p className="text-sm text-muted-foreground">Layout content</p>
        </OnboardingCardContent>
      </OnboardingCard>
      <OnboardingLayoutSecurityFooter />
    </OnboardingLayout>
  ),
};

/**
 * Complete layout with all decorations
 */
export const Complete: Story = {
  args: {},
  render: () => (
    <OnboardingLayout>
      <OnboardingLayoutCrosshairs />
      <OnboardingCard>
        <OnboardingCardHeader title="Welcome" description="Complete onboarding setup" />
        <OnboardingCardContent>
          <p className="text-sm text-muted-foreground">Full layout with all decorations</p>
        </OnboardingCardContent>
      </OnboardingCard>
      <OnboardingLayoutSecurityFooter />
    </OnboardingLayout>
  ),
};
