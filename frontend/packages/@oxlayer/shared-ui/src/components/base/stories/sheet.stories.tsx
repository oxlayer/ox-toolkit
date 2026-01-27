import type { Meta, StoryObj } from "@storybook/react";
import {
  Sheet,
  SheetClose,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetPanel,
  SheetPopup,
  SheetTitle,
  SheetTrigger,
} from "../sheet";
import { Button } from "../button";

const meta: Meta<typeof Sheet> = {
  title: "UI/Sheet",
  component: Sheet,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A slide-out panel that appears from the edge of the screen for secondary content or actions.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default sheet sliding in from the right side
 */
export const Default: Story = {
  args: {},
  render: () => (
    <Sheet>
      <SheetTrigger render={<Button variant="outline" />}>Open Sheet</SheetTrigger>
      <SheetPopup side="right">
        <SheetHeader>
          <SheetTitle>Edit Profile</SheetTitle>
          <SheetDescription>Make changes to your profile here.</SheetDescription>
        </SheetHeader>
        <SheetPanel>
          <p className="text-sm text-muted-foreground">
            This is the sheet content area where you can place forms or other content.
          </p>
        </SheetPanel>
        <SheetFooter>
          <SheetClose render={<Button />}>Save Changes</SheetClose>
        </SheetFooter>
      </SheetPopup>
    </Sheet>
  ),
};

/**
 * Sheet appearing from different sides
 */
export const Sides: Story = {
  args: {},
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Sheet>
        <SheetTrigger render={<Button variant="outline" />}>Left</SheetTrigger>
        <SheetPopup side="left">
          <SheetHeader>
            <SheetTitle>Left Sheet</SheetTitle>
            <SheetDescription>This sheet slides in from the left.</SheetDescription>
          </SheetHeader>
        </SheetPopup>
      </Sheet>
      <Sheet>
        <SheetTrigger render={<Button variant="outline" />}>Right</SheetTrigger>
        <SheetPopup side="right">
          <SheetHeader>
            <SheetTitle>Right Sheet</SheetTitle>
            <SheetDescription>This sheet slides in from the right.</SheetDescription>
          </SheetHeader>
        </SheetPopup>
      </Sheet>
      <Sheet>
        <SheetTrigger render={<Button variant="outline" />}>Top</SheetTrigger>
        <SheetPopup side="top">
          <SheetHeader>
            <SheetTitle>Top Sheet</SheetTitle>
            <SheetDescription>This sheet slides in from the top.</SheetDescription>
          </SheetHeader>
        </SheetPopup>
      </Sheet>
      <Sheet>
        <SheetTrigger render={<Button variant="outline" />}>Bottom</SheetTrigger>
        <SheetPopup side="bottom">
          <SheetHeader>
            <SheetTitle>Bottom Sheet</SheetTitle>
            <SheetDescription>This sheet slides in from the bottom.</SheetDescription>
          </SheetHeader>
        </SheetPopup>
      </Sheet>
    </div>
  ),
};

/**
 * Inset sheet with rounded corners and padding
 */
export const Inset: Story = {
  args: {},
  render: () => (
    <Sheet>
      <SheetTrigger render={<Button />}>Open Inset Sheet</SheetTrigger>
      <SheetPopup side="right" inset>
        <SheetHeader>
          <SheetTitle>Inset Style</SheetTitle>
          <SheetDescription>
            This sheet has inset styling with rounded corners and margin.
          </SheetDescription>
        </SheetHeader>
        <SheetPanel>
          <p className="text-sm">The inset variant is great for a floating panel look.</p>
        </SheetPanel>
        <SheetFooter variant="bare">
          <SheetClose render={<Button />}>Done</SheetClose>
        </SheetFooter>
      </SheetPopup>
    </Sheet>
  ),
};
