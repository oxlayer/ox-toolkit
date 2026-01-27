import type { Meta, StoryObj } from "@storybook/react";
import { BlockPattern } from "../block-pattern";

const meta: Meta<typeof BlockPattern> = {
  title: "Patterns/BlockPattern",
  component: BlockPattern,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    type: {
      control: "select",
      options: ["dots", "grid"],
    },
    opacity: {
      control: { type: "range", min: 0, max: 1, step: 0.1 },
    },
    size: {
      control: { type: "range", min: 8, max: 48, step: 2 },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const GridPattern: Story = {
  args: {
    type: "grid",
    showNoise: true,
  },
  render: args => (
    <div className="relative w-80 h-48 border border-stone-700 bg-stone-900 rounded-lg overflow-hidden">
      <BlockPattern {...args} />
      <div className="relative z-10 flex items-center justify-center h-full">
        <span className="text-stone-300">Grid Pattern</span>
      </div>
    </div>
  ),
};

export const DotsPattern: Story = {
  args: {
    type: "dots",
    showNoise: true,
  },
  render: args => (
    <div className="relative w-80 h-48 border border-stone-700 bg-stone-900 rounded-lg overflow-hidden">
      <BlockPattern {...args} />
      <div className="relative z-10 flex items-center justify-center h-full">
        <span className="text-stone-300">Dots Pattern</span>
      </div>
    </div>
  ),
};

export const NoNoise: Story = {
  args: {
    type: "grid",
    showNoise: false,
  },
  render: args => (
    <div className="relative w-80 h-48 border border-stone-700 bg-stone-900 rounded-lg overflow-hidden">
      <BlockPattern {...args} />
      <div className="relative z-10 flex items-center justify-center h-full">
        <span className="text-stone-300">No Noise Overlay</span>
      </div>
    </div>
  ),
};

export const LargeGrid: Story = {
  args: {
    type: "grid",
    size: 40,
    showNoise: true,
  },
  render: args => (
    <div className="relative w-80 h-48 border border-stone-700 bg-stone-900 rounded-lg overflow-hidden">
      <BlockPattern {...args} />
      <div className="relative z-10 flex items-center justify-center h-full">
        <span className="text-stone-300">Large Grid</span>
      </div>
    </div>
  ),
};

export const SmallDots: Story = {
  args: {
    type: "dots",
    size: 8,
    opacity: 0.5,
    showNoise: true,
  },
  render: args => (
    <div className="relative w-80 h-48 border border-stone-700 bg-stone-900 rounded-lg overflow-hidden">
      <BlockPattern {...args} />
      <div className="relative z-10 flex items-center justify-center h-full">
        <span className="text-stone-300">Small Dots</span>
      </div>
    </div>
  ),
};

export const ComparisonBoth: Story = {
  render: () => (
    <div className="flex gap-6">
      <div className="relative w-64 h-40 border border-stone-700 bg-stone-900 rounded-lg overflow-hidden">
        <BlockPattern type="grid" />
        <div className="relative z-10 flex items-center justify-center h-full">
          <span className="text-stone-300 text-sm">Grid</span>
        </div>
      </div>
      <div className="relative w-64 h-40 border border-stone-700 bg-stone-900 rounded-lg overflow-hidden">
        <BlockPattern type="dots" />
        <div className="relative z-10 flex items-center justify-center h-full">
          <span className="text-stone-300 text-sm">Dots</span>
        </div>
      </div>
    </div>
  ),
};
