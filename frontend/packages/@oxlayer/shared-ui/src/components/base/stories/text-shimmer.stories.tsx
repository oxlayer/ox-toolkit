import type { Meta, StoryObj } from "@storybook/react";
import { TextShimmer } from "../text-shimmer";

const meta: Meta<typeof TextShimmer> = {
  title: "UI/TextShimmer",
  component: TextShimmer,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "An animated text component with a shimmering effect.",
      },
    },
  },
  argTypes: {
    as: {
      control: "select",
      options: ["p", "span", "h1", "h2", "h3"],
    },
    duration: {
      control: { type: "number", min: 0.5, max: 5, step: 0.5 },
    },
    spread: {
      control: { type: "number", min: 1, max: 5, step: 0.5 },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default shimmer effect on text
 */
export const Default: Story = {
  args: {
    children: "Shimmering Text",
    duration: 2,
    spread: 2,
  },
};

/**
 * Shimmer with different speeds
 */
export const DifferentSpeeds: Story = {
  args: {},
  render: () => (
    <div className="flex flex-col gap-4">
      <TextShimmer duration={1} className="text-lg font-semibold">
        Fast Shimmer
      </TextShimmer>
      <TextShimmer duration={2} className="text-lg font-semibold">
        Normal Shimmer
      </TextShimmer>
      <TextShimmer duration={4} className="text-lg font-semibold">
        Slow Shimmer
      </TextShimmer>
    </div>
  ),
};

/**
 * Shimmer as different heading elements
 */
export const AsHeading: Story = {
  args: {},
  render: () => (
    <div className="flex flex-col gap-4">
      <TextShimmer as="h1" className="text-3xl font-bold">
        Heading 1
      </TextShimmer>
      <TextShimmer as="h2" className="text-2xl font-semibold">
        Heading 2
      </TextShimmer>
      <TextShimmer as="h3" className="text-xl font-medium">
        Heading 3
      </TextShimmer>
    </div>
  ),
};
