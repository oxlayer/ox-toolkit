import type { Meta, StoryObj } from "@storybook/react";
import {
  Popover,
  PopoverClose,
  PopoverDescription,
  PopoverPopup,
  PopoverTitle,
  PopoverTrigger,
} from "../popover";
import { Button } from "../button";

const meta: Meta<typeof Popover> = {
  title: "UI/Popover",
  component: Popover,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A floating panel that displays additional content or actions when triggered by a button.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default popover with title and description
 */
export const Default: Story = {
  args: {},
  render: () => (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" />}>Open Popover</PopoverTrigger>
      <PopoverPopup>
        <div className="p-4">
          <PopoverTitle>Dimensions</PopoverTitle>
          <PopoverDescription className="mt-2">
            Set the dimensions for the layer.
          </PopoverDescription>
          <div className="mt-4 flex gap-2">
            <PopoverClose render={<Button size="sm" />}>Apply</PopoverClose>
          </div>
        </div>
      </PopoverPopup>
    </Popover>
  ),
};

/**
 * Popover with different placement positions
 */
export const Positions: Story = {
  args: {},
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Popover>
        <PopoverTrigger render={<Button variant="outline" />}>Top</PopoverTrigger>
        <PopoverPopup side="top">
          <div className="p-4">
            <PopoverTitle>Top Popover</PopoverTitle>
            <PopoverDescription>Appears above the trigger.</PopoverDescription>
          </div>
        </PopoverPopup>
      </Popover>
      <Popover>
        <PopoverTrigger render={<Button variant="outline" />}>Bottom</PopoverTrigger>
        <PopoverPopup side="bottom">
          <div className="p-4">
            <PopoverTitle>Bottom Popover</PopoverTitle>
            <PopoverDescription>Appears below the trigger.</PopoverDescription>
          </div>
        </PopoverPopup>
      </Popover>
      <Popover>
        <PopoverTrigger render={<Button variant="outline" />}>Left</PopoverTrigger>
        <PopoverPopup side="left">
          <div className="p-4">
            <PopoverTitle>Left Popover</PopoverTitle>
            <PopoverDescription>Appears to the left.</PopoverDescription>
          </div>
        </PopoverPopup>
      </Popover>
      <Popover>
        <PopoverTrigger render={<Button variant="outline" />}>Right</PopoverTrigger>
        <PopoverPopup side="right">
          <div className="p-4">
            <PopoverTitle>Right Popover</PopoverTitle>
            <PopoverDescription>Appears to the right.</PopoverDescription>
          </div>
        </PopoverPopup>
      </Popover>
    </div>
  ),
};

/**
 * Tooltip-styled popover for simple hints
 */
export const TooltipStyle: Story = {
  args: {},
  render: () => (
    <Popover>
      <PopoverTrigger render={<Button variant="ghost" size="icon" />}>?</PopoverTrigger>
      <PopoverPopup tooltipStyle>
        <div className="px-2 py-1">Quick tip: Hover for more info</div>
      </PopoverPopup>
    </Popover>
  ),
};
