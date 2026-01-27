import type { Meta, StoryObj } from "@storybook/react";

import {
  Progress,
  ProgressLabel,
  ProgressTrack,
  ProgressIndicator,
  ProgressValue,
} from "../progress";

const meta: Meta<typeof Progress> = {
  title: "UI/Progress",
  component: Progress,
  parameters: {
    layout: "centered",
  },
  decorators: [
    Story => (
      <div className="w-[300px]">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    value: {
      control: { type: "range", min: 0, max: 100, step: 1 },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default progress bar at 50%
 */
export const Default: Story = {
  args: {
    value: 50,
  },
};

/**
 * Progress bar with label and value display
 */
export const WithLabel: Story = {
  args: {},
  render: () => (
    <Progress value={65}>
      <div className="flex items-center justify-between">
        <ProgressLabel>Uploading...</ProgressLabel>
        <ProgressValue />
      </div>
      <ProgressTrack>
        <ProgressIndicator />
      </ProgressTrack>
    </Progress>
  ),
};

/**
 * Different progress values
 */
export const AllStates: Story = {
  args: {},
  render: () => (
    <div className="flex flex-col gap-6">
      <Progress value={0}>
        <div className="flex items-center justify-between">
          <ProgressLabel>Not started</ProgressLabel>
          <ProgressValue />
        </div>
        <ProgressTrack>
          <ProgressIndicator />
        </ProgressTrack>
      </Progress>
      <Progress value={33}>
        <div className="flex items-center justify-between">
          <ProgressLabel>In progress</ProgressLabel>
          <ProgressValue />
        </div>
        <ProgressTrack>
          <ProgressIndicator />
        </ProgressTrack>
      </Progress>
      <Progress value={100}>
        <div className="flex items-center justify-between">
          <ProgressLabel>Complete</ProgressLabel>
          <ProgressValue />
        </div>
        <ProgressTrack>
          <ProgressIndicator />
        </ProgressTrack>
      </Progress>
    </div>
  ),
};
