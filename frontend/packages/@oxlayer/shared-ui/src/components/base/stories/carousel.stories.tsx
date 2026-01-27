import type { Meta, StoryObj } from "@storybook/react";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "../carousel";

const meta: Meta<typeof Carousel> = {
  title: "UI/Carousel",
  component: Carousel,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A carousel component built on Embla Carousel for displaying a collection of slides with navigation controls.",
      },
    },
  },
  decorators: [
    Story => (
      <div className="w-full max-w-sm px-12">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    orientation: {
      control: "select",
      options: ["horizontal", "vertical"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default horizontal carousel with navigation arrows
 */
export const Default: Story = {
  args: {},
  render: () => (
    <Carousel>
      <CarouselContent>
        {Array.from({ length: 5 }).map((_, index) => (
          <CarouselItem key={index}>
            <div className="flex aspect-square items-center justify-center rounded-lg border border-border bg-card p-6">
              <span className="text-3xl font-semibold text-foreground">{index + 1}</span>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  ),
};

/**
 * Carousel with multiple items per view
 */
export const MultipleItems: Story = {
  args: {},
  render: () => (
    <Carousel opts={{ align: "start" }}>
      <CarouselContent className="-ml-2">
        {Array.from({ length: 8 }).map((_, index) => (
          <CarouselItem key={index} className="basis-1/3 pl-2">
            <div className="flex aspect-square items-center justify-center rounded-lg border border-border bg-card p-4">
              <span className="text-lg font-semibold text-foreground">{index + 1}</span>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  ),
};

/**
 * Vertical carousel orientation
 */
export const Vertical: Story = {
  args: {},
  decorators: [
    Story => (
      <div className="h-[300px] py-12">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <Carousel orientation="vertical" className="h-full">
      <CarouselContent className="-mt-2 h-[200px]">
        {Array.from({ length: 5 }).map((_, index) => (
          <CarouselItem key={index} className="basis-1/2 pt-2">
            <div className="flex h-full items-center justify-center rounded-lg border border-border bg-card p-4">
              <span className="text-xl font-semibold text-foreground">{index + 1}</span>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  ),
};
