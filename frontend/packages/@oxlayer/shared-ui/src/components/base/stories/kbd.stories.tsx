import type { Meta, StoryObj } from "@storybook/react";
import { CommandIcon } from "lucide-react";
import { Kbd, KbdGroup } from "../kbd";

const meta: Meta<typeof Kbd> = {
  title: "UI/Kbd",
  component: Kbd,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A keyboard key component for displaying keyboard shortcuts and key combinations.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default keyboard key
 */
export const Default: Story = {
  args: {
    children: "K",
  },
};

/**
 * Keyboard shortcut group with modifier key
 */
export const KeyboardShortcut: Story = {
  args: {},
  render: () => (
    <KbdGroup>
      <Kbd>
        <CommandIcon />
      </Kbd>
      <Kbd>K</Kbd>
    </KbdGroup>
  ),
};

/**
 * Common keyboard shortcuts
 */
export const CommonShortcuts: Story = {
  args: {},
  render: () => (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-8">
        <span className="text-sm text-muted-foreground">Save</span>
        <KbdGroup>
          <Kbd>⌘</Kbd>
          <Kbd>S</Kbd>
        </KbdGroup>
      </div>
      <div className="flex items-center justify-between gap-8">
        <span className="text-sm text-muted-foreground">Copy</span>
        <KbdGroup>
          <Kbd>⌘</Kbd>
          <Kbd>C</Kbd>
        </KbdGroup>
      </div>
      <div className="flex items-center justify-between gap-8">
        <span className="text-sm text-muted-foreground">Undo</span>
        <KbdGroup>
          <Kbd>⌘</Kbd>
          <Kbd>Z</Kbd>
        </KbdGroup>
      </div>
    </div>
  ),
};
