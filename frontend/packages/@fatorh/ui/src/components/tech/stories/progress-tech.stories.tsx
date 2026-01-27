import type { Meta, StoryObj } from "@storybook/react";
import { ProgressTech } from "../progress-tech";

const meta: Meta<typeof ProgressTech> = {
  title: "Tech/ProgressTech",
  component: ProgressTech,
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
    max: {
      control: { type: "range", min: 1, max: 100, step: 1 },
    },
    totalSegments: {
      control: { type: "range", min: 1, max: 50, step: 1 },
    },
    variant: {
      control: "select",
      options: ["default", "warning", "success", "muted"],
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    value: 65,
  },
};

export const CustomSegments: Story = {
  args: {
    value: 75,
    max: 100,
    totalSegments: 10,
  },
};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="space-y-1">
        <span className="text-xs text-muted-foreground">Default (max 100 -&gt; 20 segments)</span>
        <ProgressTech value={70} max={100} variant="default" />
      </div>
      <div className="space-y-1">
        <span className="text-xs text-muted-foreground">Warning (max 14 -&gt; 14 segments)</span>
        <ProgressTech value={10} max={14} variant="warning" />
      </div>
      <div className="space-y-1">
        <span className="text-xs text-muted-foreground">Success (Explicit 5 segments)</span>
        <ProgressTech value={90} max={100} totalSegments={5} variant="success" />
      </div>
      <div className="space-y-1">
        <span className="text-xs text-muted-foreground">Muted</span>
        <ProgressTech value={50} variant="muted" />
      </div>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="space-y-1">
        <span className="text-xs text-muted-foreground">Small</span>
        <ProgressTech value={60} size="sm" />
      </div>
      <div className="space-y-1">
        <span className="text-xs text-muted-foreground">Medium</span>
        <ProgressTech value={60} size="md" />
      </div>
      <div className="space-y-1">
        <span className="text-xs text-muted-foreground">Large</span>
        <ProgressTech value={60} size="lg" />
      </div>
    </div>
  ),
};

export const TrialDaysExample: Story = {
  render: () => (
    <div className="rounded-lg border border-border/50 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
          Trial
        </span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="font-nippo text-2xl font-bold tabular-nums leading-none">10</span>
        <span className="text-xs text-muted-foreground">days left</span>
      </div>
      <ProgressTech value={10} max={14} variant="default" size="sm" />
    </div>
  ),
};

export const UrgentTrialExample: Story = {
  render: () => (
    <div className="rounded-lg border border-border/50 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
          Trial
        </span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="font-nippo text-2xl font-bold tabular-nums leading-none text-warning">
          2
        </span>
        <span className="text-xs text-muted-foreground">days left</span>
      </div>
      <ProgressTech value={2} max={14} variant="warning" size="sm" />
    </div>
  ),
};
