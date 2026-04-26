import type { Meta, StoryObj } from "@storybook/react";
import { InputTech } from "../input-tech";
import { LabelTech } from "../label-tech";
import {
  FieldTech,
  FieldTechLabel,
  FieldTechControl,
  FieldTechDescription,
  FieldTechError,
} from "../field-tech";

const meta: Meta<typeof InputTech> = {
  title: "Tech/InputTech",
  component: InputTech,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="w-80">
      <InputTech placeholder="you@example.com" />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-80">
      <InputTech size="sm" placeholder="Small input" />
      <InputTech size="default" placeholder="Default input" />
      <InputTech size="lg" placeholder="Large input" />
    </div>
  ),
};

export const WithoutCorners: Story = {
  render: () => (
    <div className="w-80">
      <InputTech placeholder="No corner decorations" showCorners={false} />
    </div>
  ),
};

export const ErrorState: Story = {
  render: () => (
    <div className="w-80">
      <InputTech variant="error" placeholder="Invalid input" />
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="w-80">
      <InputTech placeholder="Disabled input" disabled />
    </div>
  ),
};

export const WithLabel: Story = {
  render: () => (
    <div className="flex flex-col gap-2 w-80">
      <LabelTech htmlFor="email">Email Address</LabelTech>
      <InputTech id="email" placeholder="you@example.com" />
    </div>
  ),
};

export const WithRequiredLabel: Story = {
  render: () => (
    <div className="flex flex-col gap-2 w-80">
      <LabelTech htmlFor="email" required>
        Email Address
      </LabelTech>
      <InputTech id="email" placeholder="you@example.com" />
    </div>
  ),
};

export const FieldTechExample: Story = {
  render: () => (
    <div className="w-80">
      <FieldTech>
        <FieldTechLabel htmlFor="username" required>
          Username
        </FieldTechLabel>
        <FieldTechControl id="username" placeholder="Enter username" />
        <FieldTechDescription>Choose a unique username</FieldTechDescription>
      </FieldTech>
    </div>
  ),
};

export const FieldTechWithError: Story = {
  render: () => (
    <div className="w-80">
      <FieldTech>
        <FieldTechLabel htmlFor="email" required>
          Email
        </FieldTechLabel>
        <FieldTechControl id="email" variant="error" placeholder="you@example.com" />
        <FieldTechError>Invalid email format</FieldTechError>
      </FieldTech>
    </div>
  ),
};

export const FormExample: Story = {
  render: () => (
    <div className="w-96 space-y-6">
      <FieldTech>
        <FieldTechLabel htmlFor="name" required>
          Display Name
        </FieldTechLabel>
        <FieldTechControl id="name" placeholder="John Doe" />
      </FieldTech>
      <FieldTech>
        <FieldTechLabel htmlFor="email" required>
          Email
        </FieldTechLabel>
        <FieldTechControl id="email" type="email" placeholder="john@example.com" />
        <FieldTechDescription>We&apos;ll never share your email</FieldTechDescription>
      </FieldTech>
      <FieldTech>
        <FieldTechLabel htmlFor="bio">Bio</FieldTechLabel>
        <FieldTechControl id="bio" placeholder="Tell us about yourself" />
      </FieldTech>
    </div>
  ),
};
