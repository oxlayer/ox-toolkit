import type { Meta, StoryObj } from "@storybook/react";
import { BadgeTech } from "../badge-tech";

const meta: Meta<typeof BadgeTech> = {
  title: "Tech/BadgeTech",
  component: BadgeTech,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <BadgeTech>Tech Badge</BadgeTech>,
};

export const WithStatus: Story = {
  render: () => (
    <div className="flex gap-4">
      <BadgeTech>Online</BadgeTech>
      <BadgeTech>Offline</BadgeTech>
      <BadgeTech>Pending</BadgeTech>
    </div>
  ),
};

export const WithLabels: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <BadgeTech>v1.0.0</BadgeTech>
      <BadgeTech>Alpha</BadgeTech>
      <BadgeTech>Experimental</BadgeTech>
    </div>
  ),
};

export const InContext: Story = {
  render: () => (
    <div className="flex items-center gap-3 font-mono text-sm text-muted-foreground">
      <span>System Status:</span>
      <BadgeTech>Active</BadgeTech>
    </div>
  ),
};
