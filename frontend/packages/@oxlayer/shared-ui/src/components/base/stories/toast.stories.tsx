import type { Meta, StoryObj } from "@storybook/react";

import { Button } from "../button";
import { Toaster, toast } from "../toast";

const meta: Meta<typeof Toaster> = {
  title: "UI/Toast",
  component: Toaster,
  parameters: {
    layout: "centered",
  },
  decorators: [
    Story => (
      <>
        <Toaster position="bottom-right" />
        <Story />
      </>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Interactive demo showing different toast types
 */
export const Default: Story = {
  args: {},
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Button
        onClick={() =>
          toast("Hello!", {
            description: "This is a default toast message.",
          })
        }
        variant="outline"
      >
        Default
      </Button>
      <Button
        onClick={() =>
          toast.success("Success!", {
            description: "Your action was completed.",
          })
        }
        variant="outline"
      >
        Success
      </Button>
      <Button
        onClick={() =>
          toast.error("Error", {
            description: "Something went wrong.",
          })
        }
        variant="outline"
      >
        Error
      </Button>
      <Button
        onClick={() =>
          toast.warning("Warning", {
            description: "Please review this action.",
          })
        }
        variant="outline"
      >
        Warning
      </Button>
      <Button
        onClick={() =>
          toast.info("Info", {
            description: "Here is some information.",
          })
        }
        variant="outline"
      >
        Info
      </Button>
    </div>
  ),
};

/**
 * Toast with action button
 */
export const WithAction: Story = {
  args: {},
  render: () => (
    <Button
      onClick={() =>
        toast.info("Event scheduled", {
          description: "Your meeting has been added.",
          action: {
            label: "Undo",
            onClick: () => console.log("Undo clicked"),
          },
        })
      }
      variant="outline"
    >
      Show Toast with Action
    </Button>
  ),
};
