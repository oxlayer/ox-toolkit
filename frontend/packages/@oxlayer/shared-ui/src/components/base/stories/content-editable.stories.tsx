import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { ContentEditable } from "../content-editable";

const meta: Meta<typeof ContentEditable> = {
  title: "UI/ContentEditable",
  component: ContentEditable,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A content-editable heading component for inline text editing with placeholder support.",
      },
    },
  },
  decorators: [
    Story => (
      <div className="w-[400px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default content editable with initial value
 */
export const Default: Story = {
  args: {},
  render: () => {
    const [value, setValue] = useState("Click to edit this heading");
    return <ContentEditable value={value} onChange={setValue} className="text-2xl font-bold" />;
  },
};

/**
 * Content editable with placeholder
 */
export const WithPlaceholder: Story = {
  args: {},
  render: () => {
    const [value, setValue] = useState("");
    return (
      <ContentEditable
        value={value}
        onChange={setValue}
        placeholder="Enter a title..."
        className="text-2xl font-bold"
      />
    );
  },
};

/**
 * Styled content editable
 */
export const CustomStyling: Story = {
  args: {},
  render: () => {
    const [value, setValue] = useState("Custom styled heading");
    return (
      <ContentEditable
        value={value}
        onChange={setValue}
        className="text-3xl font-extrabold text-primary"
      />
    );
  },
};
