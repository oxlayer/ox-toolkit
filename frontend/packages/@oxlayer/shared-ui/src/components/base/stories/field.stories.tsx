import type { Meta, StoryObj } from "@storybook/react";
import {
  Field,
  FieldControl,
  FieldDescription,
  FieldError,
  FieldErrorList,
  FieldLabel,
} from "../field";
import { Input } from "../input";

const meta: Meta<typeof Field> = {
  title: "UI/Field",
  component: Field,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A form field component that provides structure for form inputs with labels, descriptions, and error states.",
      },
    },
  },
  decorators: [
    Story => (
      <div className="w-[320px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default field with label and input
 */
export const Default: Story = {
  args: {},
  render: () => (
    <Field>
      <FieldLabel>Email</FieldLabel>
      <FieldControl render={<Input type="email" placeholder="Enter your email" />} />
    </Field>
  ),
};

/**
 * Field with description text
 */
export const WithDescription: Story = {
  args: {},
  render: () => (
    <Field>
      <FieldLabel>Username</FieldLabel>
      <FieldControl render={<Input placeholder="Enter username" />} />
      <FieldDescription>Must be at least 3 characters long</FieldDescription>
    </Field>
  ),
};

/**
 * Field with error state
 */
export const WithError: Story = {
  args: {},
  render: () => (
    <Field>
      <FieldLabel>Password</FieldLabel>
      <FieldControl render={<Input type="password" placeholder="Enter password" />} />
      <FieldError>Password is required</FieldError>
    </Field>
  ),
};

/**
 * Field with multiple errors using FieldErrorList
 */
export const WithErrorList: Story = {
  args: {},
  render: () => (
    <Field>
      <FieldLabel>Password</FieldLabel>
      <FieldControl render={<Input type="password" placeholder="Enter password" />} />
      <FieldErrorList
        errors={[
          { message: "Password must be at least 8 characters" },
          { message: "Password must contain a number" },
        ]}
      />
    </Field>
  ),
};
