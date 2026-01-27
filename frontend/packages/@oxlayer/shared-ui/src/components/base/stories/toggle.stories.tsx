import type { Meta, StoryObj } from "@storybook/react";
import { Toggle } from "../toggle";

const meta: Meta<typeof Toggle> = {
  title: "UI/Toggle",
  component: Toggle,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "outline"],
    },
    size: {
      control: "select",
      options: ["sm", "default", "lg"],
    },
    disabled: {
      control: "boolean",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default toggle button
 */
export const Default: Story = {
  args: {
    children: "Toggle",
    variant: "default",
    size: "default",
  },
};

/**
 * Toggle with outline variant
 */
export const Outline: Story = {
  args: {
    children: "Toggle",
    variant: "outline",
    size: "default",
  },
};

/**
 * All toggle sizes
 */
export const Sizes: Story = {
  args: {},
  render: () => (
    <div className="flex items-center gap-4">
      <Toggle size="sm">Small</Toggle>
      <Toggle size="default">Default</Toggle>
      <Toggle size="lg">Large</Toggle>
    </div>
  ),
};

/**
 * All toggle variants
 */
export const Variants: Story = {
  args: {},
  render: () => (
    <div className="flex items-center gap-4">
      <Toggle variant="default">Default</Toggle>
      <Toggle variant="outline">Outline</Toggle>
    </div>
  ),
};

/**
 * Toggle with icon
 */
export const WithIcon: Story = {
  args: {},
  render: () => (
    <Toggle aria-label="Toggle bold">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
        <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
      </svg>
    </Toggle>
  ),
};
