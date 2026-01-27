import type { Meta, StoryObj } from "@storybook/react";
import { Logo } from "../logo";

const meta: Meta<typeof Logo> = {
  title: "UI/Logo",
  component: Logo,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
    variant: {
      control: "select",
      options: ["symbol", "lettering", "full"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    size: "md",
    variant: "lettering",
  },
};

export const Small: Story = {
  args: {
    size: "sm",
    variant: "lettering",
  },
};

export const Large: Story = {
  args: {
    size: "lg",
    variant: "lettering",
  },
};

export const LetteringOnly: Story = {
  args: {
    variant: "lettering",
    size: "md",
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-col gap-8 items-start">
      <div>
        <p className="text-xs text-stone-500 mb-2">Small</p>
        <Logo size="sm" variant="lettering" />
      </div>
      <div>
        <p className="text-xs text-stone-500 mb-2">Medium</p>
        <Logo size="md" variant="lettering" />
      </div>
      <div>
        <p className="text-xs text-stone-500 mb-2">Large</p>
        <Logo size="lg" variant="lettering" />
      </div>
    </div>
  ),
};
