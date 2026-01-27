import type { Meta, StoryObj } from "@storybook/react";
import {
  Choicebox,
  ChoiceboxIndicator,
  ChoiceboxItem,
  ChoiceboxItemDescription,
  ChoiceboxItemHeader,
  ChoiceboxItemSubtitle,
  ChoiceboxItemTitle,
} from "../choicebox";

const meta: Meta<typeof Choicebox> = {
  title: "UI/Choicebox",
  component: Choicebox,
  parameters: {
    layout: "centered",
  },
  decorators: [
    Story => (
      <div className="w-[400px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default choicebox with simple items
 */
export const Default: Story = {
  args: {},
  render: () => (
    <Choicebox defaultValue="option-1">
      <ChoiceboxItem value="option-1">
        <ChoiceboxItemTitle>Option 1</ChoiceboxItemTitle>
      </ChoiceboxItem>
      <ChoiceboxItem value="option-2">
        <ChoiceboxItemTitle>Option 2</ChoiceboxItemTitle>
      </ChoiceboxItem>
      <ChoiceboxItem value="option-3">
        <ChoiceboxItemTitle>Option 3</ChoiceboxItemTitle>
      </ChoiceboxItem>
    </Choicebox>
  ),
};

/**
 * Choicebox with title and description
 */
export const WithDescription: Story = {
  args: {},
  render: () => (
    <Choicebox defaultValue="starter">
      <ChoiceboxItem value="starter">
        <ChoiceboxItemTitle>Starter</ChoiceboxItemTitle>
        <ChoiceboxItemDescription>
          Best for small projects and personal use
        </ChoiceboxItemDescription>
      </ChoiceboxItem>
      <ChoiceboxItem value="pro">
        <ChoiceboxItemTitle>Professional</ChoiceboxItemTitle>
        <ChoiceboxItemDescription>For growing teams with advanced needs</ChoiceboxItemDescription>
      </ChoiceboxItem>
      <ChoiceboxItem value="enterprise">
        <ChoiceboxItemTitle>Enterprise</ChoiceboxItemTitle>
        <ChoiceboxItemDescription>
          For large organizations with custom requirements
        </ChoiceboxItemDescription>
      </ChoiceboxItem>
    </Choicebox>
  ),
};

/**
 * Choicebox with header containing title and subtitle
 */
export const WithHeaderAndIndicator: Story = {
  args: {},
  render: () => (
    <Choicebox defaultValue="monthly">
      <ChoiceboxItem value="monthly">
        <ChoiceboxItemHeader>
          <ChoiceboxIndicator />
          <ChoiceboxItemTitle>Monthly</ChoiceboxItemTitle>
          <ChoiceboxItemSubtitle>$9/month</ChoiceboxItemSubtitle>
        </ChoiceboxItemHeader>
        <ChoiceboxItemDescription>Pay month-to-month, cancel anytime</ChoiceboxItemDescription>
      </ChoiceboxItem>
      <ChoiceboxItem value="yearly">
        <ChoiceboxItemHeader>
          <ChoiceboxIndicator />
          <ChoiceboxItemTitle>Yearly</ChoiceboxItemTitle>
          <ChoiceboxItemSubtitle>$7/month</ChoiceboxItemSubtitle>
        </ChoiceboxItemHeader>
        <ChoiceboxItemDescription>Save 22% with annual billing</ChoiceboxItemDescription>
      </ChoiceboxItem>
    </Choicebox>
  ),
};

/**
 * Choicebox with disabled items
 */
export const WithDisabled: Story = {
  args: {},
  render: () => (
    <Choicebox defaultValue="basic">
      <ChoiceboxItem value="basic">
        <ChoiceboxItemTitle>Basic</ChoiceboxItemTitle>
        <ChoiceboxItemDescription>Available for all users</ChoiceboxItemDescription>
      </ChoiceboxItem>
      <ChoiceboxItem value="premium" disabled>
        <ChoiceboxItemTitle>Premium</ChoiceboxItemTitle>
        <ChoiceboxItemDescription>Coming soon</ChoiceboxItemDescription>
      </ChoiceboxItem>
    </Choicebox>
  ),
};
