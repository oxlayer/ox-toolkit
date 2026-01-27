import type { Meta, StoryObj } from "@storybook/react";
import { Label } from "../label";
import { Switch } from "../switch";

const meta: Meta<typeof Switch> = {
  title: "UI/Switch",
  component: Switch,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    checked: {
      control: "boolean",
    },
    disabled: {
      control: "boolean",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default switch in off state
 */
export const Default: Story = {
  args: {},
};

/**
 * Switch in checked state
 */
export const Checked: Story = {
  args: {
    defaultChecked: true,
  },
};

/**
 * Switch with label
 */
export const WithLabel: Story = {
  args: {},
  render: () => (
    <div className="flex items-center gap-2">
      <Switch id="notifications" />
      <Label htmlFor="notifications">Enable notifications</Label>
    </div>
  ),
};

/**
 * Disabled switch states
 */
export const Disabled: Story = {
  args: {},
  render: () => (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Switch id="disabled-off" disabled />
        <Label htmlFor="disabled-off" className="opacity-64">
          Disabled off
        </Label>
      </div>
      <div className="flex items-center gap-2">
        <Switch id="disabled-on" disabled defaultChecked />
        <Label htmlFor="disabled-on" className="opacity-64">
          Disabled on
        </Label>
      </div>
    </div>
  ),
};
