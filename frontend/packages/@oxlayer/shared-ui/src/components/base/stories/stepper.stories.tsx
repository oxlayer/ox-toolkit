import type { Meta, StoryObj } from "@storybook/react";
import { Loader2 } from "lucide-react";
import {
  Stepper,
  StepperContent,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from "../stepper";

const meta: Meta<typeof Stepper> = {
  title: "UI/Stepper",
  component: Stepper,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A multi-step wizard component for guiding users through a process with visual progress indicators.",
      },
    },
  },
  argTypes: {
    orientation: {
      control: "select",
      options: ["horizontal", "vertical"],
    },
    defaultValue: {
      control: "number",
    },
  },
  decorators: [
    Story => (
      <div className="w-[500px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default horizontal stepper
 */
export const Default: Story = {
  args: {
    defaultValue: 2,
  },
  render: args => (
    <Stepper
      {...args}
      indicators={{
        loading: <Loader2 className="size-4 animate-spin" />,
      }}
    >
      <StepperNav>
        <StepperItem step={1}>
          <StepperTrigger>
            <StepperIndicator>1</StepperIndicator>
            <div>
              <StepperTitle>Account</StepperTitle>
              <StepperDescription>Create account</StepperDescription>
            </div>
          </StepperTrigger>
          <StepperSeparator />
        </StepperItem>
        <StepperItem step={2}>
          <StepperTrigger>
            <StepperIndicator>2</StepperIndicator>
            <div>
              <StepperTitle>Profile</StepperTitle>
              <StepperDescription>Set up profile</StepperDescription>
            </div>
          </StepperTrigger>
          <StepperSeparator />
        </StepperItem>
        <StepperItem step={3}>
          <StepperTrigger>
            <StepperIndicator>3</StepperIndicator>
            <div>
              <StepperTitle>Complete</StepperTitle>
              <StepperDescription>All done</StepperDescription>
            </div>
          </StepperTrigger>
        </StepperItem>
      </StepperNav>
    </Stepper>
  ),
};

/**
 * Stepper with content panels
 */
export const WithContent: Story = {
  args: {
    defaultValue: 1,
  },
  render: args => (
    <Stepper {...args}>
      <StepperNav>
        <StepperItem step={1}>
          <StepperTrigger>
            <StepperIndicator>1</StepperIndicator>
            <StepperTitle>Step 1</StepperTitle>
          </StepperTrigger>
          <StepperSeparator />
        </StepperItem>
        <StepperItem step={2}>
          <StepperTrigger>
            <StepperIndicator>2</StepperIndicator>
            <StepperTitle>Step 2</StepperTitle>
          </StepperTrigger>
          <StepperSeparator />
        </StepperItem>
        <StepperItem step={3}>
          <StepperTrigger>
            <StepperIndicator>3</StepperIndicator>
            <StepperTitle>Step 3</StepperTitle>
          </StepperTrigger>
        </StepperItem>
      </StepperNav>
      <div className="mt-6 p-4 border border-border rounded-lg">
        <StepperContent value={1}>
          <p className="text-foreground">Content for step 1</p>
        </StepperContent>
        <StepperContent value={2}>
          <p className="text-foreground">Content for step 2</p>
        </StepperContent>
        <StepperContent value={3}>
          <p className="text-foreground">Content for step 3</p>
        </StepperContent>
      </div>
    </Stepper>
  ),
};

/**
 * Vertical orientation
 */
export const Vertical: Story = {
  args: {
    orientation: "vertical",
    defaultValue: 2,
  },
  render: args => (
    <Stepper {...args}>
      <StepperNav>
        <StepperItem step={1}>
          <StepperTrigger>
            <StepperIndicator>1</StepperIndicator>
            <div>
              <StepperTitle>First Step</StepperTitle>
              <StepperDescription>Getting started</StepperDescription>
            </div>
          </StepperTrigger>
          <StepperSeparator />
        </StepperItem>
        <StepperItem step={2}>
          <StepperTrigger>
            <StepperIndicator>2</StepperIndicator>
            <div>
              <StepperTitle>Second Step</StepperTitle>
              <StepperDescription>In progress</StepperDescription>
            </div>
          </StepperTrigger>
          <StepperSeparator />
        </StepperItem>
        <StepperItem step={3}>
          <StepperTrigger>
            <StepperIndicator>3</StepperIndicator>
            <div>
              <StepperTitle>Final Step</StepperTitle>
              <StepperDescription>Complete setup</StepperDescription>
            </div>
          </StepperTrigger>
        </StepperItem>
      </StepperNav>
    </Stepper>
  ),
};

/**
 * Stepper with disabled step
 */
export const WithDisabledStep: Story = {
  args: {
    defaultValue: 1,
  },
  render: args => (
    <Stepper {...args}>
      <StepperNav>
        <StepperItem step={1}>
          <StepperTrigger>
            <StepperIndicator>1</StepperIndicator>
            <StepperTitle>Available</StepperTitle>
          </StepperTrigger>
          <StepperSeparator />
        </StepperItem>
        <StepperItem step={2} disabled disabledInfo="Complete step 1 first">
          <StepperTrigger>
            <StepperIndicator>2</StepperIndicator>
            <StepperTitle>Locked</StepperTitle>
          </StepperTrigger>
          <StepperSeparator />
        </StepperItem>
        <StepperItem step={3} disabled disabledInfo="Complete step 2 first">
          <StepperTrigger>
            <StepperIndicator>3</StepperIndicator>
            <StepperTitle>Locked</StepperTitle>
          </StepperTrigger>
        </StepperItem>
      </StepperNav>
    </Stepper>
  ),
};
