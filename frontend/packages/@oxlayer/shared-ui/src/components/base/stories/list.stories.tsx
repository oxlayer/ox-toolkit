import type { Meta, StoryObj } from "@storybook/react";
import {
  ListProvider,
  ListGroup,
  ListHeader,
  ListItems,
  ListItem,
  type DragEndEvent,
} from "../list";

const meta: Meta<typeof ListProvider> = {
  title: "UI/List",
  component: ListProvider,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockItems = [
  { id: "1", name: "First Item" },
  { id: "2", name: "Second Item" },
  { id: "3", name: "Third Item" },
];

const handleDragEnd = (event: DragEndEvent) => {
  console.log("Drag ended:", event);
};

/**
 * Default sortable list with drag-and-drop
 */
export const Default: Story = {
  args: {},
  render: () => (
    <div className="w-[300px]">
      <ListProvider onDragEnd={handleDragEnd} items={mockItems.map(i => i.id)}>
        <ListGroup id="group-1">
          <ListHeader name="My List" color="#3b82f6" />
          <ListItems>
            {mockItems.map((item, index) => (
              <ListItem
                key={item.id}
                id={item.id}
                name={item.name}
                index={index}
                parent="group-1"
              />
            ))}
          </ListItems>
        </ListGroup>
      </ListProvider>
    </div>
  ),
};

/**
 * List with custom header using children
 */
export const WithCustomHeader: Story = {
  args: {},
  render: () => (
    <div className="w-[300px]">
      <ListProvider onDragEnd={handleDragEnd} items={mockItems.map(i => i.id)}>
        <ListGroup id="group-1">
          <ListHeader>
            <div className="flex items-center gap-2 bg-muted p-3">
              <div className="size-3 rounded-full bg-primary" />
              <span className="font-semibold text-sm">Custom Header</span>
            </div>
          </ListHeader>
          <ListItems>
            {mockItems.map((item, index) => (
              <ListItem
                key={item.id}
                id={item.id}
                name={item.name}
                index={index}
                parent="group-1"
              />
            ))}
          </ListItems>
        </ListGroup>
      </ListProvider>
    </div>
  ),
};

/**
 * Multiple lists side by side
 */
export const MultipleLists: Story = {
  args: {},
  render: () => (
    <div className="flex gap-4">
      <div className="w-[200px]">
        <ListProvider onDragEnd={handleDragEnd} items={["1", "2"]}>
          <ListGroup id="backlog">
            <ListHeader name="Backlog" color="#6b7280" />
            <ListItems>
              <ListItem id="1" name="Task A" index={0} parent="backlog" />
              <ListItem id="2" name="Task B" index={1} parent="backlog" />
            </ListItems>
          </ListGroup>
        </ListProvider>
      </div>
      <div className="w-[200px]">
        <ListProvider onDragEnd={handleDragEnd} items={["3", "4"]}>
          <ListGroup id="done">
            <ListHeader name="Done" color="#22c55e" />
            <ListItems>
              <ListItem id="3" name="Task C" index={0} parent="done" />
              <ListItem id="4" name="Task D" index={1} parent="done" />
            </ListItems>
          </ListGroup>
        </ListProvider>
      </div>
    </div>
  ),
};
