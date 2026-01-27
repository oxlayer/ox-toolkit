import type { Meta, StoryObj } from "@storybook/react";
import { Input } from "../input";

const meta: Meta<typeof Input> = {
  title: "UI/Input",
  component: Input,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "default", "lg"],
    },
    type: {
      control: "select",
      options: ["text", "email", "password", "search", "number", "file"],
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
 * Default input with standard styling
 */
export const Default: Story = {
  args: {
    placeholder: "Enter text...",
    size: "default",
  },
};

/**
 * Input sizes: small, default, and large
 */
export const Sizes: Story = {
  args: {},
  render: () => (
    <div className="flex flex-col gap-4 w-64">
      <div>
        <p className="text-xs text-muted-foreground mb-2">Small</p>
        <Input size="sm" placeholder="Small input" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-2">Default</p>
        <Input size="default" placeholder="Default input" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-2">Large</p>
        <Input size="lg" placeholder="Large input" />
      </div>
    </div>
  ),
};

/**
 * Disabled input state
 */
export const Disabled: Story = {
  args: {
    placeholder: "Disabled input",
    disabled: true,
  },
};

/**
 * File input type
 */
export const FileInput: Story = {
  args: {
    type: "file",
  },
};
