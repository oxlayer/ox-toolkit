import type { Meta, StoryObj } from "@storybook/react";

import { ThemeSwitcher } from "../theme-switcher";

const meta: Meta<typeof ThemeSwitcher> = {
  title: "UI/ThemeSwitcher",
  component: ThemeSwitcher,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A theme toggle button that cycles through system, light, and dark themes. Click to cycle between modes.",
      },
    },
  },
  argTypes: {
    value: {
      control: "select",
      options: ["system", "light", "dark"],
    },
    defaultValue: {
      control: "select",
      options: ["system", "light", "dark"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default theme switcher starting with system theme
 */
export const Default: Story = {
  args: {
    defaultValue: "system",
  },
};

/**
 * Theme switcher with different initial states
 */
export const InitialStates: Story = {
  args: {},
  render: () => (
    <div className="flex items-center gap-6 rounded-lg border border-border bg-background p-4">
      <div className="flex flex-col items-center gap-2">
        <ThemeSwitcher defaultValue="system" />
        <span className="text-xs text-muted-foreground">System</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <ThemeSwitcher defaultValue="light" />
        <span className="text-xs text-muted-foreground">Light</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <ThemeSwitcher defaultValue="dark" />
        <span className="text-xs text-muted-foreground">Dark</span>
      </div>
    </div>
  ),
};
