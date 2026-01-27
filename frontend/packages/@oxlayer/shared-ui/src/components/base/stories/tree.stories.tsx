import type { Meta, StoryObj } from "@storybook/react";
import type { ItemInstance } from "@headless-tree/core";
import { Tree, TreeItem, TreeItemLabel } from "../tree";

const meta: Meta<typeof Tree> = {
  title: "UI/Tree",
  component: Tree,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    indent: {
      control: { type: "number", min: 10, max: 40 },
    },
    toggleIconType: {
      control: "select",
      options: ["chevron", "plus-minus"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Mock item that simulates headless-tree ItemInstance interface
 */
function createMockItem(options: {
  name: string;
  level: number;
  isFolder?: boolean;
  isExpanded?: boolean;
}): ItemInstance<unknown> {
  return {
    getItemName: () => options.name,
    getItemMeta: () => ({ level: options.level }),
    isFolder: () => options.isFolder ?? false,
    isExpanded: () => options.isExpanded ?? false,
    isFocused: () => false,
    isSelected: () => false,
    isDragTarget: () => false,
    isMatchingSearch: () => false,
    getProps: () => ({}),
  } as unknown as ItemInstance<unknown>;
}

const rootFolder = createMockItem({ name: "src", level: 0, isFolder: true, isExpanded: true });
const componentsFolder = createMockItem({
  name: "components",
  level: 1,
  isFolder: true,
  isExpanded: true,
});
const buttonFile = createMockItem({ name: "button.tsx", level: 2 });
const cardFile = createMockItem({ name: "card.tsx", level: 2 });
const utilsFolder = createMockItem({ name: "utils", level: 1, isFolder: true, isExpanded: false });

/**
 * Default tree with chevron icons
 */
export const Default: Story = {
  args: {
    indent: 20,
    toggleIconType: "chevron",
  },
  render: args => (
    <div className="w-[300px] rounded-md border bg-background p-2">
      <Tree {...args}>
        <TreeItem item={rootFolder}>
          <TreeItemLabel>{rootFolder.getItemName()}</TreeItemLabel>
        </TreeItem>
        <TreeItem item={componentsFolder}>
          <TreeItemLabel>{componentsFolder.getItemName()}</TreeItemLabel>
        </TreeItem>
        <TreeItem item={buttonFile}>
          <TreeItemLabel>{buttonFile.getItemName()}</TreeItemLabel>
        </TreeItem>
        <TreeItem item={cardFile}>
          <TreeItemLabel>{cardFile.getItemName()}</TreeItemLabel>
        </TreeItem>
        <TreeItem item={utilsFolder}>
          <TreeItemLabel>{utilsFolder.getItemName()}</TreeItemLabel>
        </TreeItem>
      </Tree>
    </div>
  ),
};

/**
 * Tree with plus-minus toggle icons
 */
export const PlusMinusIcons: Story = {
  args: {
    indent: 20,
    toggleIconType: "plus-minus",
  },
  render: args => (
    <div className="w-[300px] rounded-md border bg-background p-2">
      <Tree {...args}>
        <TreeItem item={rootFolder}>
          <TreeItemLabel>{rootFolder.getItemName()}</TreeItemLabel>
        </TreeItem>
        <TreeItem item={componentsFolder}>
          <TreeItemLabel>{componentsFolder.getItemName()}</TreeItemLabel>
        </TreeItem>
        <TreeItem item={buttonFile}>
          <TreeItemLabel>{buttonFile.getItemName()}</TreeItemLabel>
        </TreeItem>
        <TreeItem item={cardFile}>
          <TreeItemLabel>{cardFile.getItemName()}</TreeItemLabel>
        </TreeItem>
      </Tree>
    </div>
  ),
};

/**
 * Tree with custom indentation
 */
export const CustomIndent: Story = {
  args: {
    indent: 32,
    toggleIconType: "chevron",
  },
  render: args => (
    <div className="w-[300px] rounded-md border bg-background p-2">
      <Tree {...args}>
        <TreeItem item={rootFolder}>
          <TreeItemLabel>{rootFolder.getItemName()}</TreeItemLabel>
        </TreeItem>
        <TreeItem item={componentsFolder}>
          <TreeItemLabel>{componentsFolder.getItemName()}</TreeItemLabel>
        </TreeItem>
        <TreeItem item={buttonFile}>
          <TreeItemLabel>{buttonFile.getItemName()}</TreeItemLabel>
        </TreeItem>
      </Tree>
    </div>
  ),
};
