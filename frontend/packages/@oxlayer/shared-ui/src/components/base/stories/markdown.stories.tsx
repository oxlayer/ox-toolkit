import type { Meta, StoryObj } from "@storybook/react";
import { Markdown } from "../markdown";

const meta: Meta<typeof Markdown> = {
  title: "UI/Markdown",
  component: Markdown,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "A markdown renderer component with custom styling for workbench typography.",
      },
    },
  },
  decorators: [
    Story => (
      <div className="w-[600px] p-4 bg-background border border-border rounded-lg">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default markdown with basic formatting
 */
export const Default: Story = {
  args: {
    children: `# Hello World

This is a paragraph with **bold** and *italic* text.

- First item
- Second item
- Third item
`,
  },
};

/**
 * Markdown with code blocks
 */
export const WithCode: Story = {
  args: {
    children: `Here's some inline code: \`const x = 1\`

\`\`\`typescript
function greet(name: string) {
  return \`Hello, \${name}!\`;
}
\`\`\`
`,
  },
};

/**
 * Markdown with various elements
 */
export const FullExample: Story = {
  args: {
    children: `## Features

This component supports:

1. **Headers** at multiple levels
2. **Lists** - both ordered and unordered
3. **Links** like [this one](https://example.com)

> This is a blockquote for important notes.

| Column 1 | Column 2 |
|----------|----------|
| Cell 1   | Cell 2   |
| Cell 3   | Cell 4   |
`,
  },
};
