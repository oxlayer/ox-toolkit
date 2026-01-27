import type { Meta, StoryObj } from "@storybook/react";
import { Editable, EditableArea, EditableInput, EditableLabel, EditablePreview } from "../editable";

const meta: Meta<typeof Editable> = {
  title: "UI/Editable",
  component: Editable,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "An inline editable text component that allows users to edit content by clicking on it.",
      },
    },
  },
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
    triggerMode: {
      control: "select",
      options: ["click", "dblclick", "focus"],
    },
  },
  decorators: [
    Story => (
      <div className="w-[300px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default editable with click to edit
 */
export const Default: Story = {
  args: {
    defaultValue: "Click to edit",
    size: "md",
  },
  render: args => (
    <Editable {...args}>
      <EditableLabel>Title</EditableLabel>
      <EditableArea>
        <EditablePreview />
        <EditableInput />
      </EditableArea>
    </Editable>
  ),
};

/**
 * All sizes comparison
 */
export const Sizes: Story = {
  args: {},
  render: () => (
    <div className="flex flex-col gap-6">
      <Editable defaultValue="Small text" size="sm">
        <EditableLabel>Small</EditableLabel>
        <EditableArea>
          <EditablePreview />
          <EditableInput />
        </EditableArea>
      </Editable>
      <Editable defaultValue="Medium text" size="md">
        <EditableLabel>Medium</EditableLabel>
        <EditableArea>
          <EditablePreview />
          <EditableInput />
        </EditableArea>
      </Editable>
      <Editable defaultValue="Large text" size="lg">
        <EditableLabel>Large</EditableLabel>
        <EditableArea>
          <EditablePreview />
          <EditableInput />
        </EditableArea>
      </Editable>
    </div>
  ),
};

/**
 * Editable with placeholder for empty value
 */
export const WithPlaceholder: Story = {
  args: {
    placeholder: "Enter your name...",
    size: "md",
  },
  render: args => (
    <Editable {...args}>
      <EditableLabel>Name</EditableLabel>
      <EditableArea>
        <EditablePreview />
        <EditableInput />
      </EditableArea>
    </Editable>
  ),
};

/**
 * Disabled editable
 */
export const Disabled: Story = {
  args: {
    defaultValue: "Cannot edit this",
    disabled: true,
  },
  render: args => (
    <Editable {...args}>
      <EditableLabel>Disabled</EditableLabel>
      <EditableArea>
        <EditablePreview />
        <EditableInput />
      </EditableArea>
    </Editable>
  ),
};
