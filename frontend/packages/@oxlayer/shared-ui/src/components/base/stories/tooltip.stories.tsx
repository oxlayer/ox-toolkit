import type { Meta, StoryObj } from "@storybook/react";
import { Tooltip, TooltipPopup, TooltipProvider, TooltipTrigger } from "../tooltip";
import { Button } from "../button";

const meta: Meta<typeof Tooltip> = {
  title: "UI/Tooltip",
  component: Tooltip,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A small popup that displays additional information when hovering over an element.",
      },
    },
  },
  decorators: [
    Story => (
      <TooltipProvider>
        <Story />
      </TooltipProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default tooltip appearing above the trigger
 */
export const Default: Story = {
  args: {},
  render: () => (
    <Tooltip>
      <TooltipTrigger render={<Button variant="outline" />}>Hover me</TooltipTrigger>
      <TooltipPopup>This is a helpful tooltip</TooltipPopup>
    </Tooltip>
  ),
};

/**
 * Tooltips with different placement positions
 */
export const Positions: Story = {
  args: {},
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Tooltip>
        <TooltipTrigger render={<Button variant="outline" />}>Top</TooltipTrigger>
        <TooltipPopup side="top">Tooltip on top</TooltipPopup>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger render={<Button variant="outline" />}>Bottom</TooltipTrigger>
        <TooltipPopup side="bottom">Tooltip on bottom</TooltipPopup>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger render={<Button variant="outline" />}>Left</TooltipTrigger>
        <TooltipPopup side="left">Tooltip on left</TooltipPopup>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger render={<Button variant="outline" />}>Right</TooltipTrigger>
        <TooltipPopup side="right">Tooltip on right</TooltipPopup>
      </Tooltip>
    </div>
  ),
};

/**
 * Tooltip on icon buttons for accessibility
 */
export const IconButtons: Story = {
  args: {},
  render: () => (
    <div className="flex gap-2">
      <Tooltip>
        <TooltipTrigger render={<Button variant="outline" size="icon" />}>✏️</TooltipTrigger>
        <TooltipPopup>Edit</TooltipPopup>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger render={<Button variant="outline" size="icon" />}>🗑️</TooltipTrigger>
        <TooltipPopup>Delete</TooltipPopup>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger render={<Button variant="outline" size="icon" />}>⭐</TooltipTrigger>
        <TooltipPopup>Add to favorites</TooltipPopup>
      </Tooltip>
    </div>
  ),
};
