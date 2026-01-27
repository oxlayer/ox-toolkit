import type { Meta, StoryObj } from "@storybook/react";

import { Spinner } from "../spinner";

const meta: Meta<typeof Spinner> = {
  title: "UI/Spinner",
  component: Spinner,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default spinner
 */
export const Default: Story = {
  args: {},
};

/**
 * Different spinner sizes using className
 */
export const Sizes: Story = {
  args: {},
  render: () => (
    <div className="flex items-center gap-4">
      <Spinner className="size-3" />
      <Spinner className="size-4" />
      <Spinner className="size-6" />
      <Spinner className="size-8" />
    </div>
  ),
};

/**
 * Spinner with text loading indicator
 */
export const WithText: Story = {
  args: {},
  render: () => (
    <div className="flex items-center gap-2 text-muted-foreground">
      <Spinner />
      <span className="text-sm">Loading...</span>
    </div>
  ),
};
