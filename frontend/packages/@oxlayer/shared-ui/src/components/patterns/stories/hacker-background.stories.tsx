import type { Meta, StoryObj } from "@storybook/react";
import { HackerBackground } from "../hacker-background";

const meta: Meta<typeof HackerBackground> = {
  title: "Patterns/HackerBackground",
  component: HackerBackground,
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    fontSize: {
      control: { type: "range", min: 8, max: 24, step: 1 },
    },
    speed: {
      control: { type: "range", min: 0.5, max: 3, step: 0.1 },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    color: "#0F0",
    fontSize: 14,
    speed: 1,
  },
  render: args => (
    <div className="relative h-[400px] w-full bg-black">
      <HackerBackground {...args} />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-green-400 text-2xl font-mono z-10">Matrix Effect</span>
      </div>
    </div>
  ),
};

export const LimeTheme: Story = {
  args: {
    color: "#84cc16",
    fontSize: 14,
    speed: 1,
  },
  render: args => (
    <div className="relative h-[400px] w-full bg-stone-950">
      <HackerBackground {...args} />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lime-400 text-2xl font-mono z-10">Lime Variant</span>
      </div>
    </div>
  ),
};

export const SlowFall: Story = {
  args: {
    color: "#0F0",
    fontSize: 12,
    speed: 0.5,
  },
  render: args => (
    <div className="relative h-[400px] w-full bg-black">
      <HackerBackground {...args} />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-green-400 text-xl font-mono z-10">Slow Speed</span>
      </div>
    </div>
  ),
};

export const FastFall: Story = {
  args: {
    color: "#0F0",
    fontSize: 16,
    speed: 2,
  },
  render: args => (
    <div className="relative h-[400px] w-full bg-black">
      <HackerBackground {...args} />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-green-400 text-xl font-mono z-10">Fast Speed</span>
      </div>
    </div>
  ),
};

export const LargeText: Story = {
  args: {
    color: "#0F0",
    fontSize: 20,
    speed: 1,
  },
  render: args => (
    <div className="relative h-[400px] w-full bg-black">
      <HackerBackground {...args} />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-green-400 text-xl font-mono z-10">Large Characters</span>
      </div>
    </div>
  ),
};
