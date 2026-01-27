import type { Meta, StoryObj } from "@storybook/react";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from "../dialog";
import { Button } from "../button";

const meta: Meta<typeof Dialog> = {
  title: "UI/Dialog",
  component: Dialog,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "A modal dialog component for displaying content that requires user attention.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default dialog with header, panel content, and footer
 */
export const Default: Story = {
  args: {},
  render: () => (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>Open Dialog</DialogTrigger>
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>Make changes to your profile here.</DialogDescription>
        </DialogHeader>
        <DialogPanel>
          <p className="text-sm text-muted-foreground">
            This is the dialog content area where you can place forms, information, or any other
            content.
          </p>
        </DialogPanel>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <DialogClose render={<Button />}>Save Changes</DialogClose>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  ),
};

/**
 * Dialog without the close button in the corner
 */
export const WithoutCloseButton: Story = {
  args: {},
  render: () => (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>Open Dialog</DialogTrigger>
      <DialogPopup showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Confirm Action</DialogTitle>
          <DialogDescription>This action cannot be undone.</DialogDescription>
        </DialogHeader>
        <DialogFooter variant="bare">
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <DialogClose render={<Button variant="destructive" />}>Delete</DialogClose>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  ),
};

/**
 * Simple dialog with bare footer variant
 */
export const BareFooter: Story = {
  args: {},
  render: () => (
    <Dialog>
      <DialogTrigger render={<Button />}>Quick Action</DialogTrigger>
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>Quick Settings</DialogTitle>
        </DialogHeader>
        <DialogPanel>
          <p className="text-sm">Adjust your preferences here.</p>
        </DialogPanel>
        <DialogFooter variant="bare">
          <DialogClose render={<Button />}>Done</DialogClose>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  ),
};
