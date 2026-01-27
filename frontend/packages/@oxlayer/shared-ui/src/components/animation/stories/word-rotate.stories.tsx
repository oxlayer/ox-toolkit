import type { Meta, StoryObj } from "@storybook/react";
import { WordRotate } from "../word-rotate";

const meta: Meta<typeof WordRotate> = {
  title: "Animation/WordRotate",
  component: WordRotate,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    duration: {
      control: { type: "range", min: 500, max: 5000, step: 100 },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    words: ["Innovative", "Creative", "Powerful", "Modern"],
    duration: 2000,
  },
  render: args => (
    <div className="text-3xl font-light">
      Build <WordRotate words={args.words ?? []} duration={args.duration ?? 2000} /> Solutions
    </div>
  ),
};

export const FastRotation: Story = {
  args: {
    words: ["Hello", "Hola", "Bonjour", "Ciao"],
    duration: 1000,
  },
  render: args => (
    <div className="text-2xl">
      <WordRotate words={args.words ?? []} duration={args.duration ?? 1000} />
    </div>
  ),
};

export const SlowRotation: Story = {
  args: {
    words: ["Designing", "Building", "Shipping", "Scaling"],
    duration: 3000,
  },
  render: args => (
    <div className="text-4xl font-light">
      <WordRotate words={args.words ?? []} duration={args.duration ?? 3000} /> the future
    </div>
  ),
};

export const InHeadline: Story = {
  args: {
    words: ["developers", "designers", "creators", "builders"],
    duration: 2000,
  },
  render: args => (
    <h1 className="text-5xl font-bold tracking-tight">
      Made for{" "}
      <WordRotate
        words={args.words ?? []}
        duration={args.duration ?? 2000}
        className="text-lime-400"
      />
    </h1>
  ),
};

export const TechWords: Story = {
  args: {
    words: ["AI", "ML", "APIs", "Cloud"],
    duration: 1500,
  },
  render: args => (
    <div className="text-3xl font-mono">
      Powered by <WordRotate words={args.words ?? []} duration={args.duration ?? 1500} />
    </div>
  ),
};
