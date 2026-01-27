import type { Meta, StoryObj } from "@storybook/react";
import { GripVerticalIcon, FileIcon } from "lucide-react";
import {
  ItemListProvider,
  ItemListGroup,
  ItemListHeader,
  ItemListTitle,
  ItemListTitleDot,
  ItemListTitleText,
  ItemListActions,
  ItemListItems,
  ItemListItem,
  useItemListDragHandle,
  type DragEndEvent,
} from "../item-list";
import { ItemContent, ItemMedia, ItemTitle, ItemDescription } from "../item";
import { Button } from "../button";

const meta: Meta<typeof ItemListProvider> = {
  title: "UI/ItemList",
  component: ItemListProvider,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Drag handle component for sortable items
 */
function DragHandle() {
  const { attributes, listeners } = useItemListDragHandle();
  return (
    <Button variant="ghost" size="icon-sm" className="cursor-grab" {...attributes} {...listeners}>
      <GripVerticalIcon className="size-4" />
    </Button>
  );
}

const mockItems = [
  { id: "1", title: "Task One", description: "First task description" },
  { id: "2", title: "Task Two", description: "Second task description" },
  { id: "3", title: "Task Three", description: "Third task description" },
];

const handleDragEnd = (event: DragEndEvent) => {
  console.log("Drag ended:", event);
};

/**
 * Default sortable item list with drag handles
 */
export const Default: Story = {
  args: {},
  render: () => (
    <div className="w-[400px]">
      <ItemListProvider onDragEnd={handleDragEnd} items={mockItems.map(i => i.id)}>
        <ItemListGroup id="group-1">
          <ItemListHeader>
            <ItemListTitle>
              <ItemListTitleDot color="#3b82f6" />
              <ItemListTitleText>Tasks</ItemListTitleText>
            </ItemListTitle>
            <ItemListActions>
              <Button variant="ghost" size="sm">
                Add
              </Button>
            </ItemListActions>
          </ItemListHeader>
          <ItemListItems>
            {mockItems.map((item, index) => (
              <ItemListItem key={item.id} id={item.id} index={index} parent="group-1">
                <DragHandle />
                <ItemMedia variant="icon">
                  <FileIcon className="size-4" />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>{item.title}</ItemTitle>
                  <ItemDescription>{item.description}</ItemDescription>
                </ItemContent>
              </ItemListItem>
            ))}
          </ItemListItems>
        </ItemListGroup>
      </ItemListProvider>
    </div>
  ),
};

/**
 * Item list with multiple groups
 */
export const MultipleGroups: Story = {
  args: {},
  render: () => (
    <div className="w-[400px] flex flex-col gap-4">
      <ItemListProvider onDragEnd={handleDragEnd} items={["1", "2", "3", "4"]}>
        <ItemListGroup id="todo">
          <ItemListHeader>
            <ItemListTitle>
              <ItemListTitleDot color="#f59e0b" />
              <ItemListTitleText>To Do</ItemListTitleText>
            </ItemListTitle>
          </ItemListHeader>
          <ItemListItems>
            <ItemListItem id="1" index={0} parent="todo">
              <DragHandle />
              <ItemContent>
                <ItemTitle>Review PR</ItemTitle>
              </ItemContent>
            </ItemListItem>
            <ItemListItem id="2" index={1} parent="todo">
              <DragHandle />
              <ItemContent>
                <ItemTitle>Write tests</ItemTitle>
              </ItemContent>
            </ItemListItem>
          </ItemListItems>
        </ItemListGroup>
        <ItemListGroup id="done">
          <ItemListHeader>
            <ItemListTitle>
              <ItemListTitleDot color="#22c55e" />
              <ItemListTitleText>Done</ItemListTitleText>
            </ItemListTitle>
          </ItemListHeader>
          <ItemListItems>
            <ItemListItem id="3" index={0} parent="done">
              <DragHandle />
              <ItemContent>
                <ItemTitle>Setup project</ItemTitle>
              </ItemContent>
            </ItemListItem>
            <ItemListItem id="4" index={1} parent="done">
              <DragHandle />
              <ItemContent>
                <ItemTitle>Create components</ItemTitle>
              </ItemContent>
            </ItemListItem>
          </ItemListItems>
        </ItemListGroup>
      </ItemListProvider>
    </div>
  ),
};
