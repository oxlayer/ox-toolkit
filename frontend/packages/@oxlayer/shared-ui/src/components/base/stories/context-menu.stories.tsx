import type { Meta, StoryObj } from "@storybook/react";
import { CopyIcon, DownloadIcon, PencilIcon, TrashIcon } from "lucide-react";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "../context-menu";

const meta: Meta<typeof ContextMenu> = {
  title: "UI/ContextMenu",
  component: ContextMenu,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default context menu - right-click to open
 */
export const Default: Story = {
  args: {},
  render: () => (
    <ContextMenu>
      <ContextMenuTrigger>
        <div className="flex h-[150px] w-[300px] items-center justify-center rounded-md border border-dashed border-border bg-muted/40 text-sm text-muted-foreground">
          Right-click here
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem>
          <CopyIcon />
          Copy
          <ContextMenuShortcut>⌘C</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem>
          <PencilIcon />
          Edit
          <ContextMenuShortcut>⌘E</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem>
          <DownloadIcon />
          Download
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem variant="destructive">
          <TrashIcon />
          Delete
          <ContextMenuShortcut>⌘⌫</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  ),
};

/**
 * Context menu with labeled groups
 */
export const WithLabels: Story = {
  args: {},
  render: () => (
    <ContextMenu>
      <ContextMenuTrigger>
        <div className="flex h-[150px] w-[300px] items-center justify-center rounded-md border border-dashed border-border bg-muted/40 text-sm text-muted-foreground">
          Right-click here
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuLabel>Actions</ContextMenuLabel>
        <ContextMenuItem>
          <CopyIcon />
          Copy
        </ContextMenuItem>
        <ContextMenuItem>
          <PencilIcon />
          Edit
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuLabel>Danger Zone</ContextMenuLabel>
        <ContextMenuItem variant="destructive">
          <TrashIcon />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  ),
};
