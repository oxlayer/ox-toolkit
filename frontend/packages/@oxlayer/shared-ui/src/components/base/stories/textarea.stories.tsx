import type { Meta, StoryObj } from "@storybook/react";
import { Textarea } from "../textarea";

const meta: Meta<typeof Textarea> = {
  title: "UI/Textarea",
  component: Textarea,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "default", "lg"],
    },
    disabled: {
      control: "boolean",
    },
    placeholder: {
      control: "text",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default textarea with standard styling
 */
export const Default: Story = {
  args: {
    placeholder: "Enter your message...",
    size: "default",
  },
};

/**
 * Textarea sizes: small, default, and large
 */
export const Sizes: Story = {
  args: {},
  render: () => (
    <div className="flex flex-col gap-4 w-80">
      <div>
        <p className="text-xs text-muted-foreground mb-2">Small</p>
        <Textarea size="sm" placeholder="Small textarea" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-2">Default</p>
        <Textarea size="default" placeholder="Default textarea" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-2">Large</p>
        <Textarea size="lg" placeholder="Large textarea" />
      </div>
    </div>
  ),
};

/**
 * Disabled textarea state
 */
export const Disabled: Story = {
  args: {
    placeholder: "Disabled textarea",
    disabled: true,
  },
};
