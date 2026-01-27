import { CircleAlertIcon, CircleCheckIcon, InfoIcon, TriangleAlertIcon } from "lucide-react";
import type { Meta, StoryObj } from "@storybook/react";

import { Alert, AlertTitle, AlertDescription, AlertAction } from "../alert";
import { Button } from "../button";

const meta: Meta<typeof Alert> = {
  title: "UI/Alert",
  component: Alert,
  parameters: {
    layout: "centered",
  },
  decorators: [
    Story => (
      <div className="w-[400px]">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "error", "info", "success", "warning"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default alert with title and description
 */
export const Default: Story = {
  args: {
    variant: "default",
  },
  render: args => (
    <Alert {...args}>
      <InfoIcon />
      <AlertTitle>Heads up!</AlertTitle>
      <AlertDescription>You can add components to your app using the CLI.</AlertDescription>
    </Alert>
  ),
};

/**
 * All alert variants showing different semantic states
 */
export const AllVariants: Story = {
  args: {},
  render: () => (
    <div className="flex flex-col gap-4">
      <Alert variant="default">
        <InfoIcon />
        <AlertTitle>Default</AlertTitle>
        <AlertDescription>This is a default alert message.</AlertDescription>
      </Alert>
      <Alert variant="info">
        <InfoIcon />
        <AlertTitle>Info</AlertTitle>
        <AlertDescription>This is an informational alert.</AlertDescription>
      </Alert>
      <Alert variant="success">
        <CircleCheckIcon />
        <AlertTitle>Success</AlertTitle>
        <AlertDescription>Your changes have been saved.</AlertDescription>
      </Alert>
      <Alert variant="warning">
        <TriangleAlertIcon />
        <AlertTitle>Warning</AlertTitle>
        <AlertDescription>Please review before continuing.</AlertDescription>
      </Alert>
      <Alert variant="error">
        <CircleAlertIcon />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Something went wrong.</AlertDescription>
      </Alert>
    </div>
  ),
};

/**
 * Alert with action button
 */
export const WithAction: Story = {
  args: {},
  render: () => (
    <Alert variant="info">
      <InfoIcon />
      <AlertTitle>New update available</AlertTitle>
      <AlertDescription>A new version is ready to be installed.</AlertDescription>
      <AlertAction>
        <Button size="xs" variant="outline">
          Update now
        </Button>
      </AlertAction>
    </Alert>
  ),
};
