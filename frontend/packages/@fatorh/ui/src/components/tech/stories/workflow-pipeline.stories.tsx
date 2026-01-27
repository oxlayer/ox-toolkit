import type { Meta, StoryObj } from "@storybook/react";
import { WorkflowPipeline } from "../workflow-pipeline";

const meta: Meta<typeof WorkflowPipeline> = {
  title: "Tech/WorkflowPipeline",
  component: WorkflowPipeline,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    stageDuration: {
      control: { type: "range", min: 1000, max: 5000, step: 500 },
    },
    transitionDuration: {
      control: { type: "range", min: 200, max: 1000, step: 100 },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
  decorators: [
    Story => (
      <div className="w-[600px] p-8 bg-stone-950 rounded-lg">
        <Story />
      </div>
    ),
  ],
};

export const FastAnimation: Story = {
  args: {
    stageDuration: 1000,
    transitionDuration: 300,
  },
  decorators: [
    Story => (
      <div className="w-[600px] p-8 bg-stone-950 rounded-lg">
        <Story />
      </div>
    ),
  ],
};

export const SlowAnimation: Story = {
  args: {
    stageDuration: 4000,
    transitionDuration: 800,
  },
  decorators: [
    Story => (
      <div className="w-[600px] p-8 bg-stone-950 rounded-lg">
        <Story />
      </div>
    ),
  ],
};

export const CustomStages: Story = {
  args: {
    stages: [
      { id: "plan", label: "PLAN", icon: "proicons:lightbulb" },
      { id: "design", label: "DESIGN", icon: "proicons:pen-tool" },
      { id: "develop", label: "DEVELOP", icon: "proicons:code" },
      { id: "test", label: "TEST", icon: "proicons:check-circle" },
      { id: "deploy", label: "DEPLOY", icon: "proicons:rocket" },
    ],
  },
  decorators: [
    Story => (
      <div className="w-[600px] p-8 bg-stone-950 rounded-lg">
        <Story />
      </div>
    ),
  ],
};

export const CustomColors: Story = {
  args: {
    primaryColor: "#3b82f6",
    primaryGlowColor: "rgba(59, 130, 246, 0.6)",
  },
  decorators: [
    Story => (
      <div className="w-[600px] p-8 bg-stone-950 rounded-lg">
        <Story />
      </div>
    ),
  ],
};

export const ThreeStages: Story = {
  args: {
    stages: [
      { id: "input", label: "INPUT", icon: "proicons:file-text" },
      { id: "process", label: "PROCESS", icon: "proicons:cpu" },
      { id: "output", label: "OUTPUT", icon: "proicons:download" },
    ],
    primaryColor: "#a855f7",
    primaryGlowColor: "rgba(168, 85, 247, 0.6)",
  },
  decorators: [
    Story => (
      <div className="w-[400px] p-8 bg-stone-950 rounded-lg">
        <Story />
      </div>
    ),
  ],
};

export const InCard: Story = {
  render: () => (
    <div className="w-[700px] p-6 bg-stone-900 border border-stone-800 rounded-lg">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground">Workflow Progress</h3>
        <p className="text-sm text-muted-foreground">Automated pipeline visualization</p>
      </div>
      <WorkflowPipeline />
    </div>
  ),
};
