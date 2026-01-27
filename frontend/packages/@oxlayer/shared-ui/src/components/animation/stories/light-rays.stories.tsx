import type { Meta, StoryObj } from "@storybook/react";
import { LightRays } from "../light-rays";

const meta: Meta<typeof LightRays> = {
  title: "Animation/LightRays",
  component: LightRays,
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    count: {
      control: { type: "range", min: 1, max: 20, step: 1 },
    },
    blur: {
      control: { type: "range", min: 0, max: 100, step: 5 },
    },
    speed: {
      control: { type: "range", min: 1, max: 30, step: 1 },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    count: 7,
    color: "rgba(160, 210, 255, 0.2)",
    blur: 36,
    speed: 14,
    length: "70vh",
  },
  render: args => (
    <div className="relative h-[400px] w-full bg-stone-950 overflow-hidden">
      <LightRays {...args} />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-white text-2xl font-light">Light Rays Effect</span>
      </div>
    </div>
  ),
};

export const LimeGreen: Story = {
  args: {
    count: 10,
    color: "rgba(163, 230, 53, 0.15)",
    blur: 40,
    speed: 10,
    length: "80vh",
  },
  render: args => (
    <div className="relative h-[400px] w-full bg-stone-950 overflow-hidden">
      <LightRays {...args} />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lime-400 text-2xl font-light">Lime Theme</span>
      </div>
    </div>
  ),
};

export const Subtle: Story = {
  args: {
    count: 5,
    color: "rgba(255, 255, 255, 0.1)",
    blur: 50,
    speed: 20,
    length: "60vh",
  },
  render: args => (
    <div className="relative h-[400px] w-full bg-stone-950 overflow-hidden">
      <LightRays {...args} />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-stone-300 text-2xl font-light">Subtle Effect</span>
      </div>
    </div>
  ),
};

export const Intense: Story = {
  args: {
    count: 15,
    color: "rgba(163, 230, 53, 0.25)",
    blur: 25,
    speed: 8,
    length: "90vh",
  },
  render: args => (
    <div className="relative h-[400px] w-full bg-stone-950 overflow-hidden">
      <LightRays {...args} />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lime-300 text-2xl font-light">Intense Effect</span>
      </div>
    </div>
  ),
};
