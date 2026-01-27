import type { Meta, StoryObj } from "@storybook/react";
import { ArrowRight, Loader2, Mail } from "lucide-react";

import { Button } from "../button";

const meta: Meta<typeof Button> = {
  title: "UI/Button",
  component: Button,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A versatile button component with multiple variants and sizes for different use cases.",
      },
    },
  },
  argTypes: {
    variant: {
      control: "select",
      options: [
        "default",
        "secondary",
        "destructive",
        "destructive-outline",
        "outline",
        "ghost",
        "link",
      ],
    },
    size: {
      control: "select",
      options: [
        "xs",
        "sm",
        "default",
        "lg",
        "xl",
        "icon",
        "icon-sm",
        "icon-lg",
        "icon-xl",
        "icon-xs",
      ],
    },
    disabled: {
      control: "boolean",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default button with primary styling
 */
export const Default: Story = {
  args: {
    children: "Button",
    variant: "default",
    size: "sm",
  },
};

/**
 * All available button variants
 */
export const Variants: Story = {
  args: {},
  render: () => (
    <div className="flex flex-wrap gap-4 bg-background p-4">
      <Button variant="default">Default</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="destructive-outline">Destructive Outline</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
};

/**
 * All available button sizes
 */
export const Sizes: Story = {
  args: {},
  render: () => (
    <div className="flex flex-wrap items-center gap-4 bg-background p-4">
      <Button size="xs">Extra Small</Button>
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
      <Button size="xl">Extra Large</Button>
    </div>
  ),
};

/**
 * Button with icon variations
 */
export const WithIcons: Story = {
  args: {},
  render: () => (
    <div className="flex flex-wrap items-center gap-4 bg-background p-4">
      <Button>
        <Mail />
        Login with Email
      </Button>
      <Button variant="outline">
        Next
        <ArrowRight />
      </Button>
      <Button size="icon" variant="outline">
        <Mail />
      </Button>
      <Button disabled>
        <Loader2 className="animate-spin" />
        Loading...
      </Button>
    </div>
  ),
};
