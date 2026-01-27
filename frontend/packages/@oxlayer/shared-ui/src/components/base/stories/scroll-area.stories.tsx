import type { Meta, StoryObj } from "@storybook/react";

import { ScrollArea } from "../scroll-area";

const meta: Meta<typeof ScrollArea> = {
  title: "UI/ScrollArea",
  component: ScrollArea,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A custom scroll area component with styled scrollbars that supports both vertical and horizontal scrolling.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default vertical scroll area
 */
export const Default: Story = {
  render: () => (
    <div className="h-72 w-48 rounded-md border border-border">
      <ScrollArea className="h-full p-4">
        <div className="space-y-4">
          {Array.from({ length: 20 }).map((_, index) => (
            <div
              key={index}
              className="rounded-md border border-border bg-card p-3 text-sm text-foreground"
            >
              Item {index + 1}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  ),
};

/**
 * Horizontal scroll area with wide content
 */
export const Horizontal: Story = {
  render: () => (
    <div className="w-80 rounded-md border border-border">
      <ScrollArea className="p-4">
        <div className="flex gap-4">
          {Array.from({ length: 15 }).map((_, index) => (
            <div
              key={index}
              className="flex h-20 w-32 shrink-0 items-center justify-center rounded-md border border-border bg-card text-sm text-foreground"
            >
              Item {index + 1}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  ),
};

/**
 * Both orientations for two-dimensional scrolling
 */
export const BothOrientations: Story = {
  render: () => (
    <div className="h-72 w-80 rounded-md border border-border">
      <ScrollArea className="h-full p-4">
        <div className="grid w-[600px] grid-cols-4 gap-4">
          {Array.from({ length: 40 }).map((_, index) => (
            <div
              key={index}
              className="flex h-20 items-center justify-center rounded-md border border-border bg-card text-sm text-foreground"
            >
              {index + 1}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  ),
};
