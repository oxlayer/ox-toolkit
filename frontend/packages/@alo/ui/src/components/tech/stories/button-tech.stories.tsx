import type { Meta, StoryObj } from "@storybook/react";
import { ButtonTech } from "../button-tech";

const meta: Meta<typeof ButtonTech> = {
  title: "Tech/ButtonTech",
  component: ButtonTech,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <ButtonTech>Execute</ButtonTech>,
};

export const Variants: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <ButtonTech variant="outline">Outline</ButtonTech>
      <ButtonTech variant="solid">Solid</ButtonTech>
    </div>
  ),
};

export const Solid: Story = {
  render: () => <ButtonTech variant="solid">Join Waitlist</ButtonTech>,
};

export const SolidWithIcon: Story = {
  render: () => (
    <ButtonTech variant="solid">
      Join Waitlist
      <svg
        width="10"
        height="10"
        viewBox="0 0 10 10"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M1 9L9 1M9 1H3M9 1V7" />
      </svg>
    </ButtonTech>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <ButtonTech size="xs">XS</ButtonTech>
      <ButtonTech size="sm">Small</ButtonTech>
      <ButtonTech size="default">Default</ButtonTech>
      <ButtonTech size="lg">Large</ButtonTech>
      <ButtonTech size="xl">XL</ButtonTech>
    </div>
  ),
};

export const SolidSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <ButtonTech variant="solid" size="xs">
        XS
      </ButtonTech>
      <ButtonTech variant="solid" size="sm">
        Small
      </ButtonTech>
      <ButtonTech variant="solid" size="default">
        Default
      </ButtonTech>
      <ButtonTech variant="solid" size="lg">
        Large
      </ButtonTech>
      <ButtonTech variant="solid" size="xl">
        XL
      </ButtonTech>
    </div>
  ),
};

export const Actions: Story = {
  render: () => (
    <div className="flex gap-4">
      <ButtonTech>Initialize</ButtonTech>
      <ButtonTech>Deploy</ButtonTech>
      <ButtonTech>Terminate</ButtonTech>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="flex gap-4">
      <ButtonTech disabled>Disabled Outline</ButtonTech>
      <ButtonTech variant="solid" disabled>
        Disabled Solid
      </ButtonTech>
    </div>
  ),
};

export const WithIcon: Story = {
  render: () => (
    <ButtonTech>
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
      Power On
    </ButtonTech>
  ),
};
