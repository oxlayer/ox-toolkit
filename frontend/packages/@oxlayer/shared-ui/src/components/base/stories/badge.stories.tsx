import { XIcon } from "lucide-react";
import type { Meta, StoryObj } from "@storybook/react";

import { Badge, BadgeDot, BadgeButton } from "../badge";

const meta: Meta<typeof Badge> = {
  title: "UI/Badge",
  component: Badge,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    variant: {
      control: "select",
      options: [
        "default",
        "secondary",
        "outline",
        "destructive",
        "success",
        "warning",
        "error",
        "info",
      ],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default badge
 */
export const Default: Story = {
  args: {
    children: "Badge",
    variant: "default",
  },
};

/**
 * All badge variants
 */
export const AllVariants: Story = {
  args: {},
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="default">Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="error">Error</Badge>
      <Badge variant="info">Info</Badge>
    </div>
  ),
};

/**
 * Badge with status dot indicator
 */
export const WithDot: Story = {
  args: {},
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="success">
        <BadgeDot />
        Active
      </Badge>
      <Badge variant="warning">
        <BadgeDot />
        Pending
      </Badge>
      <Badge variant="error">
        <BadgeDot />
        Failed
      </Badge>
    </div>
  ),
};

/**
 * Badge with dismiss button
 */
export const WithButton: Story = {
  args: {},
  render: () => (
    <Badge variant="secondary">
      Tag
      <BadgeButton>
        <XIcon className="size-3" />
      </BadgeButton>
    </Badge>
  ),
};
