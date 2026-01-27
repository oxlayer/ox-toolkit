import type { Meta, StoryObj } from "@storybook/react";
import { Checkbox } from "../checkbox";
import { Label } from "../label";

const meta: Meta<typeof Checkbox> = {
  title: "UI/Checkbox",
  component: Checkbox,
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
    indeterminate: {
      control: "boolean",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default checkbox in unchecked state
 */
export const Default: Story = {
  args: {},
};

/**
 * Checkbox in checked state
 */
export const Checked: Story = {
  args: {
    defaultChecked: true,
  },
};

/**
 * Checkbox in indeterminate state
 */
export const Indeterminate: Story = {
  args: {
    indeterminate: true,
  },
};

/**
 * Checkbox with label
 */
export const WithLabel: Story = {
  args: {},
  render: () => (
    <div className="flex items-center gap-2">
      <Checkbox id="terms" />
      <Label htmlFor="terms">Accept terms and conditions</Label>
    </div>
  ),
};

/**
 * Disabled checkbox states
 */
export const Disabled: Story = {
  args: {},
  render: () => (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Checkbox id="disabled-unchecked" disabled />
        <Label htmlFor="disabled-unchecked" className="opacity-64">
          Disabled unchecked
        </Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="disabled-checked" disabled defaultChecked />
        <Label htmlFor="disabled-checked" className="opacity-64">
          Disabled checked
        </Label>
      </div>
    </div>
  ),
};
