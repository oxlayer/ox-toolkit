import type { Meta, StoryObj } from "@storybook/react";
import {
  CardTech,
  CardTechHeader,
  CardTechTitle,
  CardTechDescription,
  CardTechContent,
  CardTechFooter,
} from "../card-tech";

const meta: Meta<typeof CardTech> = {
  title: "Tech/CardTech",
  component: CardTech,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <CardTech className="w-80">
      <CardTechHeader>
        <CardTechTitle>Card Tech (Fiducials)</CardTechTitle>
        <CardTechDescription>
          Hover over this card to see the corner fiducials animate.
        </CardTechDescription>
      </CardTechHeader>
    </CardTech>
  ),
};

export const TechlineCorners: Story = {
  render: () => (
    <CardTech corner="techline" className="w-80">
      <CardTechHeader>
        <CardTechTitle>Techline Corners</CardTechTitle>
        <CardTechDescription>
          This card uses animated techline corners - ideal for app interfaces.
        </CardTechDescription>
      </CardTechHeader>
    </CardTech>
  ),
};

export const CornerComparison: Story = {
  render: () => (
    <div className="flex gap-4">
      <CardTech corner="fiducials" className="w-64">
        <CardTechHeader>
          <CardTechTitle className="text-sm">Fiducials</CardTechTitle>
          <CardTechDescription className="text-xs">
            For landing pages with crosshair SVGs
          </CardTechDescription>
        </CardTechHeader>
      </CardTech>
      <CardTech corner="techline" className="w-64">
        <CardTechHeader>
          <CardTechTitle className="text-sm">Techline</CardTechTitle>
          <CardTechDescription className="text-xs">
            For app interfaces with clean lines
          </CardTechDescription>
        </CardTechHeader>
      </CardTech>
    </div>
  ),
};

export const AllCorners: Story = {
  render: () => (
    <CardTech className="w-80" corners={["top-left", "top-right", "bottom-left", "bottom-right"]}>
      <CardTechHeader>
        <CardTechTitle>All Corners</CardTechTitle>
        <CardTechDescription>This card shows fiducials on all four corners.</CardTechDescription>
      </CardTechHeader>
    </CardTech>
  ),
};

export const TopCornersOnly: Story = {
  render: () => (
    <CardTech className="w-80" corners={["top-left", "top-right"]}>
      <CardTechHeader>
        <CardTechTitle>Top Corners</CardTechTitle>
        <CardTechDescription>Only top corners have fiducials.</CardTechDescription>
      </CardTechHeader>
    </CardTech>
  ),
};

export const WithContent: Story = {
  render: () => (
    <CardTech className="w-80">
      <CardTechHeader>
        <CardTechTitle>Card with Content</CardTechTitle>
        <CardTechDescription>A card demonstrating the content area.</CardTechDescription>
      </CardTechHeader>
      <CardTechContent>
        <p className="text-sm text-muted-foreground">
          This is the main content area of the card where you can place any content.
        </p>
      </CardTechContent>
      <CardTechFooter>
        <span className="text-xs text-muted-foreground">Footer content</span>
      </CardTechFooter>
    </CardTech>
  ),
};

export const FeatureCard: Story = {
  render: () => (
    <CardTech className="w-72">
      <CardTechHeader>
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded bg-lime-500/20 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-lime-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <div>
            <CardTechTitle>Fast Performance</CardTechTitle>
            <CardTechDescription>
              Lightning-fast execution with optimized algorithms.
            </CardTechDescription>
          </div>
        </div>
      </CardTechHeader>
    </CardTech>
  ),
};

export const CardGrid: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4 w-[400px]">
      <CardTech>
        <CardTechHeader>
          <CardTechTitle className="text-sm">Card 1</CardTechTitle>
          <CardTechDescription className="text-xs">Description text</CardTechDescription>
        </CardTechHeader>
      </CardTech>
      <CardTech>
        <CardTechHeader>
          <CardTechTitle className="text-sm">Card 2</CardTechTitle>
          <CardTechDescription className="text-xs">Description text</CardTechDescription>
        </CardTechHeader>
      </CardTech>
      <CardTech>
        <CardTechHeader>
          <CardTechTitle className="text-sm">Card 3</CardTechTitle>
          <CardTechDescription className="text-xs">Description text</CardTechDescription>
        </CardTechHeader>
      </CardTech>
      <CardTech>
        <CardTechHeader>
          <CardTechTitle className="text-sm">Card 4</CardTechTitle>
          <CardTechDescription className="text-xs">Description text</CardTechDescription>
        </CardTechHeader>
      </CardTech>
    </div>
  ),
};
