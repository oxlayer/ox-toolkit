import type { Meta, StoryObj } from "@storybook/react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectPopup,
  SelectItem,
  SelectGroup,
  SelectGroupLabel,
  SelectSeparator,
} from "../select";

const meta: Meta<typeof Select> = {
  title: "UI/Select",
  component: Select,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default select with basic options
 */
export const Default: Story = {
  args: {},
  render: () => (
    <Select defaultValue="apple">
      <SelectTrigger className="w-48">
        <SelectValue placeholder="Select a fruit" />
      </SelectTrigger>
      <SelectPopup>
        <SelectItem value="apple">Apple</SelectItem>
        <SelectItem value="banana">Banana</SelectItem>
        <SelectItem value="orange">Orange</SelectItem>
        <SelectItem value="grape">Grape</SelectItem>
      </SelectPopup>
    </Select>
  ),
};

/**
 * Select trigger sizes: small, default, and large
 */
export const Sizes: Story = {
  args: {},
  render: () => (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-xs text-muted-foreground mb-2">Small</p>
        <Select defaultValue="sm">
          <SelectTrigger size="sm" className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectPopup>
            <SelectItem value="sm">Small trigger</SelectItem>
          </SelectPopup>
        </Select>
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-2">Default</p>
        <Select defaultValue="default">
          <SelectTrigger size="default" className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectPopup>
            <SelectItem value="default">Default trigger</SelectItem>
          </SelectPopup>
        </Select>
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-2">Large</p>
        <Select defaultValue="lg">
          <SelectTrigger size="lg" className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectPopup>
            <SelectItem value="lg">Large trigger</SelectItem>
          </SelectPopup>
        </Select>
      </div>
    </div>
  ),
};

/**
 * Select with grouped options and separators
 */
export const WithGroups: Story = {
  args: {},
  render: () => (
    <Select>
      <SelectTrigger className="w-56">
        <SelectValue placeholder="Select a country" />
      </SelectTrigger>
      <SelectPopup>
        <SelectGroup>
          <SelectGroupLabel>North America</SelectGroupLabel>
          <SelectItem value="us">United States</SelectItem>
          <SelectItem value="ca">Canada</SelectItem>
          <SelectItem value="mx">Mexico</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectGroupLabel>Europe</SelectGroupLabel>
          <SelectItem value="uk">United Kingdom</SelectItem>
          <SelectItem value="de">Germany</SelectItem>
          <SelectItem value="fr">France</SelectItem>
        </SelectGroup>
      </SelectPopup>
    </Select>
  ),
};
