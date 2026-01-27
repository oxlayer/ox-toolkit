import type { Meta, StoryObj } from "@storybook/react";
import { Separator } from "../separator";

const meta: Meta<typeof Separator> = {
  title: "UI/Separator",
  component: Separator,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A separator component for visually dividing content horizontally or vertically.",
      },
    },
  },
  argTypes: {
    orientation: {
      control: "select",
      options: ["horizontal", "vertical"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default horizontal separator
 */
export const Default: Story = {
  args: {
    orientation: "horizontal",
  },
  render: args => (
    <div className="w-[300px] space-y-4">
      <div>
        <p className="text-sm font-medium">Section One</p>
        <p className="text-sm text-muted-foreground">Content above the separator.</p>
      </div>
      <Separator {...args} />
      <div>
        <p className="text-sm font-medium">Section Two</p>
        <p className="text-sm text-muted-foreground">Content below the separator.</p>
      </div>
    </div>
  ),
};

/**
 * Vertical separator between inline elements
 */
export const Vertical: Story = {
  args: {
    orientation: "vertical",
  },
  render: args => (
    <div className="flex h-10 items-center gap-4">
      <span className="text-sm">Item 1</span>
      <Separator {...args} />
      <span className="text-sm">Item 2</span>
      <Separator {...args} />
      <span className="text-sm">Item 3</span>
    </div>
  ),
};
