import type { Meta, StoryObj } from "@storybook/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../base/card";
import { StaticSlashBar } from "../static-slash-bar";

const meta: Meta<typeof StaticSlashBar> = {
  title: "Patterns/StaticSlashBar",
  component: StaticSlashBar,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default vertical static slash bar
 */
export const Default: Story = {
  args: {
    width: "w-2",
    backgroundColor: "bg-transparent",
  },
  render: args => (
    <div className="relative h-[400px] w-[600px] bg-stone-950 p-8">
      <StaticSlashBar {...args} />
      <div className="ml-4 flex h-full items-center">
        <span className="text-stone-400">Content with vertical slash bar</span>
      </div>
    </div>
  ),
};

/**
 * Static slash bar used in a title
 */
export const InTitle: Story = {
  args: {
    width: "w-1",
    backgroundColor: "bg-transparent",
  },
  render: args => (
    <div className="relative w-[600px] bg-stone-950 p-8">
      <div className="relative flex items-center gap-4">
        <StaticSlashBar {...args} className="!absolute !left-0 !top-0 !bottom-0 !h-12" />
        <div className="ml-5">
          <h2 className="text-2xl font-semibold text-white">Section Title</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            A decorative vertical slash bar adds visual interest to titles
          </p>
        </div>
      </div>
    </div>
  ),
};

/**
 * Static slash bar used in a card header
 */
export const InCardHeader: Story = {
  args: {
    width: "w-1",
    backgroundColor: "bg-transparent",
  },
  render: args => (
    <div className="relative w-[500px] bg-stone-950 p-8">
      <Card className="relative overflow-hidden">
        <StaticSlashBar {...args} className="!absolute !left-0 !top-0 !bottom-0" />
        <CardHeader className="relative pl-6">
          <CardTitle>Card with Slash Bar</CardTitle>
          <CardDescription>
            The vertical slash bar adds a decorative tech aesthetic to the card
          </CardDescription>
        </CardHeader>
        <CardContent className="relative pl-6">
          <p className="text-sm text-muted-foreground">
            This card demonstrates how the static slash bar can be used as a decorative element
            along the left edge of cards, providing visual separation and a technical design accent.
          </p>
        </CardContent>
      </Card>
    </div>
  ),
};

/**
 * Multiple cards with slash bars
 */
export const MultipleCards: Story = {
  args: {
    width: "w-1",
    backgroundColor: "bg-transparent",
  },
  render: args => (
    <div className="relative w-[600px] space-y-4 bg-stone-950 p-8">
      {[
        { title: "First Card", description: "Card with decorative slash bar" },
        { title: "Second Card", description: "Another card with the same pattern" },
        { title: "Third Card", description: "Consistent design across cards" },
      ].map((card, index) => (
        <Card key={index} className="relative overflow-hidden">
          <StaticSlashBar {...args} className="!absolute !left-0 !top-0 !bottom-0" />
          <CardHeader className="relative pl-6">
            <CardTitle>{card.title}</CardTitle>
            <CardDescription>{card.description}</CardDescription>
          </CardHeader>
        </Card>
      ))}
    </div>
  ),
};

/**
 * Thicker slash bar variant
 */
export const ThickBar: Story = {
  args: {
    width: "w-3",
    backgroundColor: "bg-transparent",
  },
  render: args => (
    <div className="relative h-[400px] w-[600px] bg-stone-950 p-8">
      <StaticSlashBar {...args} />
      <div className="ml-6 flex h-full items-center">
        <span className="text-stone-400">Thicker slash bar for more emphasis</span>
      </div>
    </div>
  ),
};

/**
 * Thicker and denser slash bar variant
 */
export const DenseAndThick: Story = {
  args: {
    width: "w-3",
    backgroundColor: "bg-transparent",
    size: 4,
    strokeWidth: 4,
  },
  render: args => (
    <div className="relative h-[400px] w-[600px] bg-stone-950 p-8">
      <StaticSlashBar {...args} />
      <div className="ml-6 flex h-full items-center">
        <span className="text-stone-400">Very dense and thick pattern</span>
      </div>
    </div>
  ),
};

/**
 * Custom color line
 */
export const CustomLineColor: Story = {
  args: {
    width: "w-4",
    backgroundColor: "bg-transparent",
    size: 8,
    strokeWidth: 2,
    lineClassName: "text-blue-500",
  },
  render: args => (
    <div className="relative h-[400px] w-[600px] bg-stone-950 p-8">
      <StaticSlashBar {...args} />
      <div className="ml-8 flex h-full items-center">
        <span className="text-stone-400">Custom blue line color</span>
      </div>
    </div>
  ),
};

/**
 * Slash bar with custom positioning
 */
export const CustomPosition: Story = {
  args: {
    width: "w-1",
    backgroundColor: "bg-transparent",
  },
  render: args => (
    <div className="relative h-[400px] w-[600px] bg-stone-950 p-8">
      <div className="relative flex h-full items-center gap-8">
        <StaticSlashBar {...args} className="!absolute !left-0 !top-1/2 !-translate-y-1/2 !h-32" />
        <div className="ml-5">
          <h3 className="text-xl font-semibold text-white">Custom Height</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            The slash bar can be positioned and sized to match your design needs
          </p>
        </div>
      </div>
    </div>
  ),
};

/**
 * Mission Board Style - High Tech Look
 */
export const MissionBoard: Story = {
  args: {
    width: "w-full",
    size: 4,
    strokeWidth: 3,
    backgroundColor: "bg-stone-900",
    lineClassName: "text-stone-300",
    fade: "right",
  },
  render: args => (
    <div className="relative w-[800px] bg-stone-950 p-8 font-mono">
      {/* Header Bar */}
      <div className="relative h-6 w-full mb-6 border-b border-stone-800 flex items-center">
        <div className="absolute top-0 left-0 bottom-0 w-2 bg-orange-500 mr-2" />
        <h1 className="text-xl font-bold text-white tracking-wider ml-4 uppercase">
          Mission Board
        </h1>
        <div className="flex-1 ml-4 relative h-4 overflow-hidden">
          {/* Tech strip */}
          <StaticSlashBar
            {...args}
            className="!relative !w-full !h-full"
            patternId="mission-header"
          />
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-stone-900/50 p-4 border border-stone-800">
          <h3 className="text-sm text-stone-400 mb-2 uppercase">Mission Info</h3>
          <p className="text-white">LOCATE SLUSHY SUBSURFACE SEAS IN KUMASI</p>
          <div className="mt-4 border-t border-stone-700 pt-2">
            <div className="flex justify-between text-xs text-stone-500">
              <span>TARGET SYSTEM</span>
              <span>TARGET TRAIT</span>
            </div>
            <div className="flex justify-between text-sm text-stone-300">
              <span>Kumasi</span>
              <span>Slushy Subsurface Seas</span>
            </div>
          </div>
        </div>

        <div className="bg-stone-900/50 p-0 border border-stone-800">
          <div className="bg-stone-800/50 p-2 px-4 border-b border-stone-800 text-xs font-bold text-stone-300 flex justify-between">
            <span>AVAILABLE MISSIONS</span>
            <span>REWARD</span>
          </div>
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="p-3 border-b border-stone-800/50 flex items-center hover:bg-stone-800/30"
            >
              <div className="w-8 h-8 rounded-full border border-stone-600 flex items-center justify-center mr-3">
                <div className="w-4 h-4 bg-stone-600 rounded-full opacity-50" />
              </div>
              <span className="text-sm text-stone-300 flex-1">SURVEY MAGNAR IN DELTA PAVONIS</span>
              <span className="text-sm font-mono text-white">8000 C</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
};

/**
 * Retro Futuristic UI Elements
 */
export const RetroFuturistic: Story = {
  render: () => (
    <div className="relative w-[600px] bg-black p-10 space-y-8">
      {/* Example 1: Dotted/Grid-like thick bar */}
      <div className="relative">
        <h3 className="text-xs text-stone-500 mb-1 font-mono">SYSTEM STATUS</h3>
        <div className="h-4 w-full relative border border-stone-800 bg-stone-900">
          <StaticSlashBar
            width="w-full"
            size={3}
            strokeWidth={2}
            lineClassName="text-emerald-500/80"
            angle={60}
            className="!relative !inset-0"
            patternId="status-bar"
          />
        </div>
      </div>

      {/* Example 2: Warning Strip */}
      <div className="relative">
        <h3 className="text-xs text-stone-500 mb-1 font-mono">WARNING LEVEL</h3>
        <div className="h-8 w-full relative flex gap-1">
          <div className="w-1/3 h-full relative border border-amber-900/30 bg-amber-950/10">
            <StaticSlashBar
              width="w-full"
              size={8}
              strokeWidth={4}
              lineClassName="text-amber-500"
              angle={-45}
              fade="right"
              className="!relative !inset-0"
              patternId="warning-1"
            />
          </div>
          <div className="w-2/3 h-full relative border border-amber-900/30 bg-amber-950/10">
            <StaticSlashBar
              width="w-full"
              size={4}
              strokeWidth={2}
              lineClassName="text-amber-500/50"
              angle={45}
              className="!relative !inset-0"
              patternId="warning-2"
            />
          </div>
        </div>
      </div>

      {/* Example 3: Vertical Data Columns */}
      <div className="grid grid-cols-4 gap-2 h-32">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="relative border border-stone-800 bg-stone-900/20">
            <StaticSlashBar
              width="w-full"
              size={2 + i}
              strokeWidth={i}
              lineClassName="text-cyan-500/40"
              angle={90} // Vertical lines
              direction={i % 2 === 0 ? "forward" : "backward"}
              className="!absolute !inset-0"
              patternId={`col-${i}`}
            />
            <div className="absolute bottom-2 left-2 text-[10px] text-cyan-500 font-mono">0{i}</div>
          </div>
        ))}
      </div>
    </div>
  ),
};
