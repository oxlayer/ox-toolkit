import type { Meta, StoryObj } from "@storybook/react";
import { AnimatedGroup } from "../animated-group";

const meta: Meta<typeof AnimatedGroup> = {
  title: "Animation/AnimatedGroup",
  component: AnimatedGroup,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    preset: {
      control: "select",
      options: [
        "fade",
        "slide",
        "scale",
        "blur",
        "blur-slide",
        "zoom",
        "flip",
        "bounce",
        "rotate",
        "swing",
      ],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const SampleItems = () => (
  <>
    <div className="p-4 bg-stone-800 rounded border border-stone-700">Item 1</div>
    <div className="p-4 bg-stone-800 rounded border border-stone-700">Item 2</div>
    <div className="p-4 bg-stone-800 rounded border border-stone-700">Item 3</div>
  </>
);

export const Fade: Story = {
  args: {
    preset: "fade",
    className: "flex flex-col gap-2",
  },
  render: args => (
    <AnimatedGroup {...args}>
      <SampleItems />
    </AnimatedGroup>
  ),
};

export const Slide: Story = {
  args: {
    preset: "slide",
    className: "flex flex-col gap-2",
  },
  render: args => (
    <AnimatedGroup {...args}>
      <SampleItems />
    </AnimatedGroup>
  ),
};

export const Scale: Story = {
  args: {
    preset: "scale",
    className: "flex flex-col gap-2",
  },
  render: args => (
    <AnimatedGroup {...args}>
      <SampleItems />
    </AnimatedGroup>
  ),
};

export const Blur: Story = {
  args: {
    preset: "blur",
    className: "flex flex-col gap-2",
  },
  render: args => (
    <AnimatedGroup {...args}>
      <SampleItems />
    </AnimatedGroup>
  ),
};

export const BlurSlide: Story = {
  args: {
    preset: "blur-slide",
    className: "flex flex-col gap-2",
  },
  render: args => (
    <AnimatedGroup {...args}>
      <SampleItems />
    </AnimatedGroup>
  ),
};

export const Zoom: Story = {
  args: {
    preset: "zoom",
    className: "flex flex-col gap-2",
  },
  render: args => (
    <AnimatedGroup {...args}>
      <SampleItems />
    </AnimatedGroup>
  ),
};

export const Flip: Story = {
  args: {
    preset: "flip",
    className: "flex flex-col gap-2",
  },
  render: args => (
    <AnimatedGroup {...args}>
      <SampleItems />
    </AnimatedGroup>
  ),
};

export const Bounce: Story = {
  args: {
    preset: "bounce",
    className: "flex flex-col gap-2",
  },
  render: args => (
    <AnimatedGroup {...args}>
      <SampleItems />
    </AnimatedGroup>
  ),
};

export const Rotate: Story = {
  args: {
    preset: "rotate",
    className: "flex flex-col gap-2",
  },
  render: args => (
    <AnimatedGroup {...args}>
      <SampleItems />
    </AnimatedGroup>
  ),
};

export const Swing: Story = {
  args: {
    preset: "swing",
    className: "flex flex-col gap-2",
  },
  render: args => (
    <AnimatedGroup {...args}>
      <SampleItems />
    </AnimatedGroup>
  ),
};

export const HorizontalLayout: Story = {
  args: {
    preset: "slide",
    className: "flex flex-row gap-4",
  },
  render: args => (
    <AnimatedGroup {...args}>
      <div className="p-6 bg-lime-500/20 rounded border border-lime-500/50">Card 1</div>
      <div className="p-6 bg-lime-500/20 rounded border border-lime-500/50">Card 2</div>
      <div className="p-6 bg-lime-500/20 rounded border border-lime-500/50">Card 3</div>
    </AnimatedGroup>
  ),
};
