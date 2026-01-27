import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "../button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardAction,
} from "../card";

const meta: Meta<typeof Card> = {
  title: "UI/Card",
  component: Card,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A card component with header, content, footer, and action slots for structured content display.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default card with header, content, and footer
 */
export const Default: Story = {
  args: {},
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card description goes here.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">This is the main content area of the card.</p>
      </CardContent>
      <CardFooter>
        <Button variant="outline" size="sm" className="mr-4">
          Cancel
        </Button>
        <Button size="sm">Save</Button>
      </CardFooter>
    </Card>
  ),
};

/**
 * Card with action button in header
 */
export const WithAction: Story = {
  args: {},
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Settings</CardTitle>
        <CardDescription>Manage your account settings.</CardDescription>
        <CardAction>
          <Button variant="ghost" size="sm">
            Edit
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Configure your preferences and account details.
        </p>
      </CardContent>
    </Card>
  ),
};

/**
 * Simple card with just content
 */
export const Simple: Story = {
  args: {},
  render: () => (
    <Card className="w-[350px]">
      <CardContent>
        <p className="text-sm text-muted-foreground">
          A simple card with only content, no header or footer.
        </p>
      </CardContent>
    </Card>
  ),
};
