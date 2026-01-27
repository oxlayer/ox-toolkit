import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { CircleUser, FolderKanban, Tag } from "lucide-react";
import { createFilter, Filters, type Filter, type FilterFieldConfig } from "../filters";

const meta: Meta<typeof Filters> = {
  title: "UI/Filters",
  component: Filters,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A flexible filtering system with support for various field types including select, multiselect, text, number, date, and boolean.",
      },
    },
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["solid", "outline"],
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
    radius: {
      control: "select",
      options: ["md", "full"],
    },
  },
  decorators: [
    Story => (
      <div className="w-[600px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

const statusOptions = [
  { value: "active", label: "Active", icon: <Tag className="size-4 text-green-500" /> },
  { value: "pending", label: "Pending", icon: <Tag className="size-4 text-yellow-500" /> },
  { value: "inactive", label: "Inactive", icon: <Tag className="size-4 text-red-500" /> },
];

const assigneeOptions = [
  { value: "john", label: "John Doe", icon: <CircleUser className="size-4" /> },
  { value: "jane", label: "Jane Smith", icon: <CircleUser className="size-4" /> },
  { value: "bob", label: "Bob Wilson", icon: <CircleUser className="size-4" /> },
];

const projectOptions = [
  { value: "proj1", label: "Project Alpha", icon: <FolderKanban className="size-4" /> },
  { value: "proj2", label: "Project Beta", icon: <FolderKanban className="size-4" /> },
];

const defaultFields: FilterFieldConfig<string>[] = [
  {
    key: "status",
    label: "Status",
    type: "select",
    options: statusOptions,
    icon: <Tag className="size-4" />,
  },
  {
    key: "assignee",
    label: "Assignee",
    type: "multiselect",
    options: assigneeOptions,
    icon: <CircleUser className="size-4" />,
  },
  {
    key: "project",
    label: "Project",
    type: "select",
    options: projectOptions,
    icon: <FolderKanban className="size-4" />,
  },
];

/**
 * Default filters with select fields
 */
export const Default: Story = {
  args: {
    variant: "outline",
    size: "md",
  },
  render: args => {
    const [filters, setFilters] = useState<Filter<string>[]>([
      createFilter("status", "is", ["active"]),
    ]);
    return <Filters {...args} filters={filters} fields={defaultFields} onChange={setFilters} />;
  },
};

/**
 * Filters with text and number fields
 */
export const TextAndNumber: Story = {
  args: {},
  render: () => {
    const fields: FilterFieldConfig<string | number>[] = [
      { key: "name", label: "Name", type: "text" },
      { key: "age", label: "Age", type: "number", min: 0, max: 120 },
      { key: "email", label: "Email", type: "email" },
    ];
    const [filters, setFilters] = useState<Filter<string | number>[]>([
      createFilter("name", "contains", ["John"]),
    ]);
    return (
      <Filters
        filters={filters}
        fields={fields}
        onChange={setFilters}
        variant="outline"
        size="md"
      />
    );
  },
};

/**
 * Solid variant style
 */
export const SolidVariant: Story = {
  args: {},
  render: () => {
    const [filters, setFilters] = useState<Filter<string>[]>([
      createFilter("status", "is", ["pending"]),
    ]);
    return (
      <Filters
        filters={filters}
        fields={defaultFields}
        onChange={setFilters}
        variant="solid"
        size="md"
      />
    );
  },
};

/**
 * Multiple active filters
 */
export const MultipleFilters: Story = {
  args: {},
  render: () => {
    const [filters, setFilters] = useState<Filter<string>[]>([
      createFilter("status", "is", ["active"]),
      createFilter("assignee", "is_any_of", ["john", "jane"]),
      createFilter("project", "is", ["proj1"]),
    ]);
    return (
      <Filters
        filters={filters}
        fields={defaultFields}
        onChange={setFilters}
        variant="outline"
        size="md"
      />
    );
  },
};
