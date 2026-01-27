import type { Meta, StoryObj } from "@storybook/react";
import { FileIcon, MoreHorizontalIcon, StarIcon } from "lucide-react";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemHeader,
  ItemMedia,
  ItemTitle,
} from "../item";
import { Badge } from "../badge";
import { Button } from "../button";

const meta: Meta<typeof Item> = {
  title: "UI/Item",
  component: Item,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "outline", "muted"],
    },
    size: {
      control: "select",
      options: ["default", "sm"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default item with title and description
 */
export const Default: Story = {
  args: {
    variant: "default",
    size: "default",
  },
  render: args => (
    <div className="w-[400px]">
      <Item {...args}>
        <ItemContent>
          <ItemTitle>Item Title</ItemTitle>
          <ItemDescription>This is a description of the item.</ItemDescription>
        </ItemContent>
      </Item>
    </div>
  ),
};

/**
 * Item with media icon
 */
export const WithMedia: Story = {
  args: {},
  render: () => (
    <div className="w-[400px]">
      <Item variant="outline">
        <ItemMedia variant="icon">
          <FileIcon className="size-4" />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Document.pdf</ItemTitle>
          <ItemDescription>Last modified 2 days ago</ItemDescription>
        </ItemContent>
        <ItemActions>
          <Button variant="ghost" size="icon-sm">
            <MoreHorizontalIcon className="size-4" />
          </Button>
        </ItemActions>
      </Item>
    </div>
  ),
};

/**
 * Item group with multiple items
 */
export const ItemGroupExample: Story = {
  args: {},
  render: () => (
    <div className="w-[400px]">
      <ItemGroup>
        <Item variant="outline">
          <ItemMedia variant="icon">
            <FileIcon className="size-4" />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>
              First Item
              <Badge variant="secondary">New</Badge>
            </ItemTitle>
            <ItemDescription>Description for the first item</ItemDescription>
          </ItemContent>
        </Item>
        <Item variant="outline">
          <ItemMedia variant="icon">
            <StarIcon className="size-4" />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Second Item</ItemTitle>
            <ItemDescription>Description for the second item</ItemDescription>
          </ItemContent>
        </Item>
      </ItemGroup>
    </div>
  ),
};

/**
 * Item with header and footer sections
 */
export const WithHeaderFooter: Story = {
  args: {},
  render: () => (
    <div className="w-[400px]">
      <Item variant="muted">
        <ItemHeader>
          <ItemTitle>Header Title</ItemTitle>
          <Badge>Status</Badge>
        </ItemHeader>
        <ItemContent>
          <ItemDescription>
            This item has both header and footer sections for additional context.
          </ItemDescription>
        </ItemContent>
      </Item>
    </div>
  ),
};
