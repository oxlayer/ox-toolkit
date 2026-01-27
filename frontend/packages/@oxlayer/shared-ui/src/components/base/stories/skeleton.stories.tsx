import type { Meta, StoryObj } from "@storybook/react";

import { Skeleton } from "../skeleton";

const meta: Meta<typeof Skeleton> = {
  title: "UI/Skeleton",
  component: Skeleton,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default skeleton placeholder
 */
export const Default: Story = {
  args: {
    className: "h-4 w-[200px]",
  },
};

/**
 * Different skeleton shapes
 */
export const Shapes: Story = {
  args: {},
  render: () => (
    <div className="flex items-center gap-4">
      <Skeleton className="size-12 rounded-full" />
      <Skeleton className="h-4 w-[150px]" />
      <Skeleton className="h-8 w-8 rounded-md" />
    </div>
  ),
};

/**
 * Card-like skeleton layout
 */
export const CardLayout: Story = {
  args: {},
  render: () => (
    <div className="flex items-center gap-4">
      <Skeleton className="size-12 rounded-full" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-[200px]" />
        <Skeleton className="h-4 w-[150px]" />
      </div>
    </div>
  ),
};
