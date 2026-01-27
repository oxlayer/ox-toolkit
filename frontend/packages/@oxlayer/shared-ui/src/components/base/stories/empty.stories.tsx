import type { Meta, StoryObj } from "@storybook/react";
import { InboxIcon, SearchIcon, FileIcon } from "lucide-react";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  EmptyMedia,
} from "../empty";
import { Button } from "../button";

const meta: Meta<typeof Empty> = {
  title: "UI/Empty",
  component: Empty,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default empty state with icon and message
 */
export const Default: Story = {
  args: {},
  render: () => (
    <div className="w-[400px] border rounded-lg">
      <Empty>
        <EmptyMedia variant="icon">
          <InboxIcon className="size-4" />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>No items found</EmptyTitle>
          <EmptyDescription>
            There are no items to display. Try adding some content.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  ),
};

/**
 * Empty state with action button
 */
export const WithAction: Story = {
  args: {},
  render: () => (
    <div className="w-[400px] border rounded-lg">
      <Empty>
        <EmptyMedia variant="icon">
          <FileIcon className="size-4" />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>No documents</EmptyTitle>
          <EmptyDescription>You haven't uploaded any documents yet.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button>Upload Document</Button>
        </EmptyContent>
      </Empty>
    </div>
  ),
};

/**
 * Search empty state
 */
export const SearchEmpty: Story = {
  args: {},
  render: () => (
    <div className="w-[400px] border rounded-lg">
      <Empty>
        <EmptyMedia variant="icon">
          <SearchIcon className="size-4" />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>No results</EmptyTitle>
          <EmptyDescription>
            No results found for your search. Try a different query.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="outline">Clear Search</Button>
        </EmptyContent>
      </Empty>
    </div>
  ),
};

/**
 * Minimal empty state without icon decoration
 */
export const Minimal: Story = {
  args: {},
  render: () => (
    <div className="w-[400px] border rounded-lg">
      <Empty>
        <EmptyMedia variant="default">
          <InboxIcon className="size-8 text-muted-foreground" />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>Empty</EmptyTitle>
          <EmptyDescription>Nothing here yet.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  ),
};
