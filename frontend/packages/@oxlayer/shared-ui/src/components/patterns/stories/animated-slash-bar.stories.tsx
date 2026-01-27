import type { Meta, StoryObj } from "@storybook/react";
import { AnimatedSlashBar } from "../animated-slash-bar";

const meta: Meta<typeof AnimatedSlashBar> = {
  title: "Patterns/AnimatedSlashBar",
  component: AnimatedSlashBar,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    height: "h-2",
    backgroundColor: "bg-lime-500",
    borderColor: "border-stone-800",
  },
  render: args => (
    <div className="relative h-[200px] w-full bg-stone-950">
      <AnimatedSlashBar {...args} />
      <div className="flex items-center justify-center h-full">
        <span className="text-stone-400">Content below the bar</span>
      </div>
    </div>
  ),
};

export const TallBar: Story = {
  args: {
    height: "h-4",
    backgroundColor: "bg-lime-500",
  },
  render: args => (
    <div className="relative h-[200px] w-full bg-stone-950">
      <AnimatedSlashBar {...args} />
      <div className="flex items-center justify-center h-full pt-4">
        <span className="text-stone-400">Taller progress bar</span>
      </div>
    </div>
  ),
};

export const WarningVariant: Story = {
  args: {
    height: "h-2",
    backgroundColor: "bg-amber-500",
  },
  render: args => (
    <div className="relative h-[200px] w-full bg-stone-950">
      <AnimatedSlashBar {...args} />
      <div className="flex items-center justify-center h-full">
        <span className="text-amber-400">Warning state</span>
      </div>
    </div>
  ),
};

export const DangerVariant: Story = {
  args: {
    height: "h-2",
    backgroundColor: "bg-red-500",
  },
  render: args => (
    <div className="relative h-[200px] w-full bg-stone-950">
      <AnimatedSlashBar {...args} />
      <div className="flex items-center justify-center h-full">
        <span className="text-red-400">Error state</span>
      </div>
    </div>
  ),
};
