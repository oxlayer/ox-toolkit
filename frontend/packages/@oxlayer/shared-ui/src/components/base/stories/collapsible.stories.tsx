import type { Meta, StoryObj } from "@storybook/react";
import { ChevronDownIcon } from "lucide-react";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "../collapsible";

const meta: Meta<typeof Collapsible> = {
  title: "UI/Collapsible",
  component: Collapsible,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A collapsible component for toggling visibility of content with smooth transitions.",
      },
    },
  },
  decorators: [
    Story => (
      <div className="w-[350px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default collapsible with button trigger
 */
export const Default: Story = {
  args: {},
  render: () => (
    <Collapsible className="space-y-2">
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted">
        Toggle content
        <ChevronDownIcon className="size-4 transition-transform [[data-panel-open]_&]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="rounded-md border border-border bg-muted p-4">
          <p className="text-sm text-muted-foreground">
            This content can be shown or hidden by clicking the trigger above.
          </p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  ),
};

/**
 * Collapsible with multiple content items
 */
export const WithList: Story = {
  args: {},
  render: () => (
    <Collapsible className="space-y-2">
      <div className="flex items-center justify-between rounded-md border border-border px-4 py-2">
        <span className="text-sm font-medium">Show more items</span>
        <CollapsibleTrigger className="rounded-md p-1 hover:bg-muted">
          <ChevronDownIcon className="size-4 transition-transform [[data-panel-open]_&]:rotate-180" />
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent>
        <div className="space-y-2">
          <div className="rounded-md border border-border px-4 py-2 text-sm">Item 1</div>
          <div className="rounded-md border border-border px-4 py-2 text-sm">Item 2</div>
          <div className="rounded-md border border-border px-4 py-2 text-sm">Item 3</div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  ),
};
