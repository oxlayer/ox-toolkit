import type { Meta, StoryObj } from "@storybook/react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "../accordion";

const meta: Meta<typeof Accordion> = {
  title: "UI/Accordion",
  component: Accordion,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "An accordion component for showing and hiding content sections.",
      },
    },
  },
  decorators: [
    Story => (
      <div className="w-[400px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default accordion with multiple items
 */
export const Default: Story = {
  args: {},
  render: () => (
    <Accordion>
      <AccordionItem value="item-1">
        <AccordionTrigger>What is this component?</AccordionTrigger>
        <AccordionContent>
          This is an accordion component that allows you to show and hide content sections with
          smooth animations.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>How do I use it?</AccordionTrigger>
        <AccordionContent>
          Use the AccordionItem, AccordionTrigger, and AccordionContent components to create
          expandable sections.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Is it accessible?</AccordionTrigger>
        <AccordionContent>
          Yes, this component follows WAI-ARIA patterns for accessibility and supports keyboard
          navigation.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

/**
 * Single item accordion
 */
export const SingleItem: Story = {
  args: {},
  render: () => (
    <Accordion>
      <AccordionItem value="single">
        <AccordionTrigger>Click to expand</AccordionTrigger>
        <AccordionContent>
          This is a single accordion item demonstrating the basic usage.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};
