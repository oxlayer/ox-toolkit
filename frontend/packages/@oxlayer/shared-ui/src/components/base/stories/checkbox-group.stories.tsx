import type { Meta, StoryObj } from "@storybook/react";
import { Checkbox } from "../checkbox";
import { CheckboxGroup } from "../checkbox-group";
import { Label } from "../label";

const meta: Meta<typeof CheckboxGroup> = {
  title: "UI/CheckboxGroup",
  component: CheckboxGroup,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default checkbox group with multiple options
 */
export const Default: Story = {
  args: {},
  render: () => (
    <CheckboxGroup>
      <div className="flex items-center gap-2">
        <Checkbox id="option-1" name="options" value="1" />
        <Label htmlFor="option-1">Option 1</Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="option-2" name="options" value="2" />
        <Label htmlFor="option-2">Option 2</Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="option-3" name="options" value="3" />
        <Label htmlFor="option-3">Option 3</Label>
      </div>
    </CheckboxGroup>
  ),
};

/**
 * Checkbox group with some pre-selected options
 */
export const WithDefaultValues: Story = {
  args: {
    defaultValue: ["1", "3"],
  },
  render: args => (
    <CheckboxGroup {...args}>
      <div className="flex items-center gap-2">
        <Checkbox id="fruit-apple" name="fruits" value="1" />
        <Label htmlFor="fruit-apple">Apple</Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="fruit-banana" name="fruits" value="2" />
        <Label htmlFor="fruit-banana">Banana</Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="fruit-orange" name="fruits" value="3" />
        <Label htmlFor="fruit-orange">Orange</Label>
      </div>
    </CheckboxGroup>
  ),
};

/**
 * Horizontal layout checkbox group
 */
export const Horizontal: Story = {
  args: {},
  render: () => (
    <CheckboxGroup className="flex-row gap-4">
      <div className="flex items-center gap-2">
        <Checkbox id="size-s" name="sizes" value="s" />
        <Label htmlFor="size-s">S</Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="size-m" name="sizes" value="m" />
        <Label htmlFor="size-m">M</Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="size-l" name="sizes" value="l" />
        <Label htmlFor="size-l">L</Label>
      </div>
    </CheckboxGroup>
  ),
};
