import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "../button";
import { Input } from "../input";
import { Group, GroupText, GroupSeparator } from "../group";

const meta: Meta<typeof Group> = {
  title: "UI/Group",
  component: Group,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "A group component for visually connecting related elements together.",
      },
    },
  },
  argTypes: {
    orientation: {
      control: "select",
      options: ["horizontal", "vertical"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default button group
 */
export const Default: Story = {
  args: {
    orientation: "horizontal",
  },
  render: args => (
    <Group {...args}>
      <Button variant="outline">Left</Button>
      <Button variant="outline">Center</Button>
      <Button variant="outline">Right</Button>
    </Group>
  ),
};

/**
 * Group with input and text addon
 */
export const WithInputAddon: Story = {
  args: {},
  render: () => (
    <Group orientation="horizontal">
      <GroupText>https://</GroupText>
      <Input placeholder="example.com" className="rounded-l-none" />
    </Group>
  ),
};

/**
 * Group with separator between buttons
 */
export const WithSeparator: Story = {
  args: {},
  render: () => (
    <Group orientation="horizontal">
      <Button variant="outline">Copy</Button>
      <GroupSeparator />
      <Button variant="outline">Paste</Button>
      <GroupSeparator />
      <Button variant="outline">Delete</Button>
    </Group>
  ),
};
