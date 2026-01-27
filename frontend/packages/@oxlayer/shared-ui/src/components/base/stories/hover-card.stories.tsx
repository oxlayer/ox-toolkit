import type { Meta, StoryObj } from "@storybook/react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../hover-card";
import { Avatar, AvatarFallback } from "../avatar";

const meta: Meta<typeof HoverCard> = {
  title: "UI/HoverCard",
  component: HoverCard,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A card that appears when hovering over a trigger element, useful for previews and additional info.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default hover card with user preview
 */
export const Default: Story = {
  args: {},
  render: () => (
    <HoverCard>
      <HoverCardTrigger asChild>
        <a href="#" className="text-sm font-medium underline underline-offset-4">
          @johndoe
        </a>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="flex gap-4">
          <Avatar>
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold">@johndoe</h4>
            <p className="text-sm text-muted-foreground">Software engineer building cool stuff.</p>
            <div className="flex items-center pt-2">
              <span className="text-xs text-muted-foreground">Joined December 2021</span>
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  ),
};

/**
 * Hover card with different alignments
 */
export const Alignments: Story = {
  args: {},
  render: () => (
    <div className="flex gap-8">
      <HoverCard>
        <HoverCardTrigger asChild>
          <span className="cursor-pointer text-sm underline">Start aligned</span>
        </HoverCardTrigger>
        <HoverCardContent align="start">
          <p className="text-sm">This card is aligned to the start.</p>
        </HoverCardContent>
      </HoverCard>
      <HoverCard>
        <HoverCardTrigger asChild>
          <span className="cursor-pointer text-sm underline">Center aligned</span>
        </HoverCardTrigger>
        <HoverCardContent align="center">
          <p className="text-sm">This card is aligned to the center.</p>
        </HoverCardContent>
      </HoverCard>
      <HoverCard>
        <HoverCardTrigger asChild>
          <span className="cursor-pointer text-sm underline">End aligned</span>
        </HoverCardTrigger>
        <HoverCardContent align="end">
          <p className="text-sm">This card is aligned to the end.</p>
        </HoverCardContent>
      </HoverCard>
    </div>
  ),
};

/**
 * Hover card with rich content preview
 */
export const RichContent: Story = {
  args: {},
  render: () => (
    <HoverCard>
      <HoverCardTrigger asChild>
        <span className="cursor-pointer text-sm font-medium text-primary underline underline-offset-4">
          Project Documentation
        </span>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Getting Started Guide</h4>
          <p className="text-sm text-muted-foreground">
            Learn how to set up and configure your project with our comprehensive documentation.
          </p>
          <div className="flex gap-2 pt-2">
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
              Tutorial
            </span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              5 min read
            </span>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  ),
};
