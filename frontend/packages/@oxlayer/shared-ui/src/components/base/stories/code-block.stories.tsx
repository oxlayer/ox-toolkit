import type { Meta, StoryObj } from "@storybook/react";
import { CodeBlock, CodeBlockCopyButton, CodeBlockDownloadButton } from "../code-block";

const meta: Meta<typeof CodeBlock> = {
  title: "UI/CodeBlock",
  component: CodeBlock,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A syntax-highlighted code block component with copy and download functionality.",
      },
    },
  },
  decorators: [
    Story => (
      <div className="w-[600px]">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    language: {
      control: "select",
      options: ["typescript", "javascript", "python", "rust", "go", "json", "css", "html"],
    },
    height: {
      control: { type: "number", min: 100, max: 800, step: 50 },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const sampleCode = `function greet(name: string): string {
  return \`Hello, \${name}!\`;
}

const message = greet("World");
console.log(message);`;

/**
 * Default code block with TypeScript
 */
export const Default: Story = {
  args: {
    code: sampleCode,
    language: "typescript",
    height: 200,
  },
  render: args => (
    <CodeBlock {...args}>
      <CodeBlockCopyButton />
      <CodeBlockDownloadButton language={args.language} />
    </CodeBlock>
  ),
};

/**
 * Code block with different languages
 */
export const Languages: Story = {
  args: {},
  render: () => (
    <div className="flex flex-col gap-4">
      <CodeBlock code={`const x = { name: "test", value: 42 };`} language="javascript" height={100}>
        <CodeBlockCopyButton />
      </CodeBlock>
      <CodeBlock
        code={`def hello(name):\n    print(f"Hello, {name}!")`}
        language="python"
        height={100}
      >
        <CodeBlockCopyButton />
      </CodeBlock>
      <CodeBlock code={`{ "name": "test", "version": "1.0.0" }`} language="json" height={80}>
        <CodeBlockCopyButton />
      </CodeBlock>
    </div>
  ),
};

/**
 * Code block with longer content demonstrating scroll
 */
export const WithScroll: Story = {
  args: {},
  render: () => (
    <CodeBlock
      code={`import { Effect, pipe } from "effect";

// Define a service
interface Logger {
  log: (message: string) => Effect.Effect<void>;
}

const LoggerService = Effect.Tag<Logger>();

// Create a program
const program = pipe(
  LoggerService,
  Effect.flatMap((logger) => logger.log("Hello, Effect!"))
);

// Provide the implementation
const runnable = Effect.provideService(
  program,
  LoggerService,
  { log: (message) => Effect.sync(() => console.log(message)) }
);

// Run the effect
Effect.runSync(runnable);`}
      language="typescript"
      height={250}
    >
      <CodeBlockCopyButton />
      <CodeBlockDownloadButton language="typescript" />
    </CodeBlock>
  ),
};
