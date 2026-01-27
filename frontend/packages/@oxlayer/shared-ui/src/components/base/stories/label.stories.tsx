import type { Meta, StoryObj } from "@storybook/react";
import { Label } from "../label";

const meta: Meta<typeof Label> = {
  title: "UI/Label",
  component: Label,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "A simple label component for form inputs with muted foreground styling.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default label
 */
export const Default: Story = {
  args: {
    children: "Email address",
  },
};

/**
 * Label with htmlFor attribute
 */
export const WithHtmlFor: Story = {
  args: {
    children: "Username",
    htmlFor: "username-input",
  },
};

/**
 * Label with icon
 */
export const WithIcon: Story = {
  args: {},
  render: () => (
    <Label>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4" />
        <path d="M12 8h.01" />
      </svg>
      Required field
    </Label>
  ),
};
