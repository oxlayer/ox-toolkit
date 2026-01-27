import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Tags, TagsTrigger, TagsContent, TagsList, TagsEmpty, TagsItem } from "../select-tags";

const meta: Meta<typeof Tags> = {
  title: "UI/Tags",
  component: Tags,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const tagItems = [
  { label: "React", value: "react" },
  { label: "TypeScript", value: "typescript" },
  { label: "JavaScript", value: "javascript" },
  { label: "Node.js", value: "nodejs" },
  { label: "Python", value: "python" },
  { label: "Go", value: "go" },
];

/**
 * Default tags selector for multi-select scenarios
 */
export const Default: Story = {
  args: {},
  render: function TagsDemo() {
    const [selected, setSelected] = useState<string[]>(["react", "typescript"]);

    return (
      <div className="w-80">
        <Tags items={tagItems} value={selected} setValue={setSelected}>
          <TagsTrigger placeholder="Select technologies..." />
          <TagsContent>
            <TagsList>
              <TagsEmpty />
              {tagItems.map(item => (
                <TagsItem key={item.value} value={item.value}>
                  {item.label}
                </TagsItem>
              ))}
            </TagsList>
          </TagsContent>
        </Tags>
      </div>
    );
  },
};

/**
 * Empty state with no selections
 */
export const Empty: Story = {
  args: {},
  render: function TagsEmptyDemo() {
    const [selected, setSelected] = useState<string[]>([]);

    return (
      <div className="w-80">
        <Tags items={tagItems} value={selected} setValue={setSelected}>
          <TagsTrigger placeholder="Select technologies..." />
          <TagsContent>
            <TagsList>
              <TagsEmpty />
              {tagItems.map(item => (
                <TagsItem key={item.value} value={item.value}>
                  {item.label}
                </TagsItem>
              ))}
            </TagsList>
          </TagsContent>
        </Tags>
      </div>
    );
  },
};

/**
 * Multiple items pre-selected
 */
export const WithMultipleSelections: Story = {
  args: {},
  render: function TagsMultipleDemo() {
    const [selected, setSelected] = useState<string[]>(["react", "typescript", "nodejs", "python"]);

    return (
      <div className="w-80">
        <Tags items={tagItems} value={selected} setValue={setSelected}>
          <TagsTrigger placeholder="Select technologies..." />
          <TagsContent>
            <TagsList>
              <TagsEmpty />
              {tagItems.map(item => (
                <TagsItem key={item.value} value={item.value}>
                  {item.label}
                </TagsItem>
              ))}
            </TagsList>
          </TagsContent>
        </Tags>
      </div>
    );
  },
};
