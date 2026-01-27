import type { Meta, StoryObj } from "@storybook/react";
import { Label } from "../label";
import { Radio, RadioGroup } from "../radio-group";

const meta: Meta<typeof RadioGroup> = {
  title: "UI/RadioGroup",
  component: RadioGroup,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default radio group with multiple options
 */
export const Default: Story = {
  args: {},
  render: () => (
    <RadioGroup defaultValue="option-1">
      <div className="flex items-center gap-2">
        <Radio id="option-1" value="option-1" />
        <Label htmlFor="option-1">Option 1</Label>
      </div>
      <div className="flex items-center gap-2">
        <Radio id="option-2" value="option-2" />
        <Label htmlFor="option-2">Option 2</Label>
      </div>
      <div className="flex items-center gap-2">
        <Radio id="option-3" value="option-3" />
        <Label htmlFor="option-3">Option 3</Label>
      </div>
    </RadioGroup>
  ),
};

/**
 * Horizontal layout radio group
 */
export const Horizontal: Story = {
  args: {},
  render: () => (
    <RadioGroup defaultValue="monthly" className="flex-row gap-4">
      <div className="flex items-center gap-2">
        <Radio id="monthly" value="monthly" />
        <Label htmlFor="monthly">Monthly</Label>
      </div>
      <div className="flex items-center gap-2">
        <Radio id="yearly" value="yearly" />
        <Label htmlFor="yearly">Yearly</Label>
      </div>
    </RadioGroup>
  ),
};

/**
 * Radio group with disabled options
 */
export const WithDisabled: Story = {
  args: {},
  render: () => (
    <RadioGroup defaultValue="available">
      <div className="flex items-center gap-2">
        <Radio id="available" value="available" />
        <Label htmlFor="available">Available</Label>
      </div>
      <div className="flex items-center gap-2">
        <Radio id="unavailable" value="unavailable" disabled />
        <Label htmlFor="unavailable" className="opacity-64">
          Unavailable (disabled)
        </Label>
      </div>
      <div className="flex items-center gap-2">
        <Radio id="pending" value="pending" />
        <Label htmlFor="pending">Pending</Label>
      </div>
    </RadioGroup>
  ),
};
