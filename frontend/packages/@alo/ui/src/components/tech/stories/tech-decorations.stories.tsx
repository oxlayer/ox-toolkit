import type { Meta, StoryObj } from "@storybook/react";
import {
  TechCrosshair,
  TechCorner,
  TechLine,
  TechDivider,
  TechBarcode,
  TechConnector,
} from "../tech-decorations";
import { BadgeTech } from "../badge-tech";
import { ButtonTech } from "../button-tech";
import {
  CardTech,
  CardTechHeader,
  CardTechTitle,
  CardTechDescription,
  CardTechFooter,
} from "../card-tech";

const meta: Meta = {
  title: "Tech/TechDecorations",
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj;

export const Crosshair: Story = {
  render: () => (
    <div className="flex gap-8 items-center">
      <TechCrosshair />
      <TechCrosshair size={32} />
      <TechCrosshair size={48} className="text-lime-500" />
    </div>
  ),
};

export const Corners: Story = {
  render: () => (
    <div className="relative w-48 h-32 border border-stone-700 bg-stone-900">
      <TechCorner position="top-left" />
      <TechCorner position="top-right" />
      <TechCorner position="bottom-left" />
      <TechCorner position="bottom-right" />
      <div className="flex items-center justify-center h-full">
        <span className="text-stone-400 text-sm">Content</span>
      </div>
    </div>
  ),
};

export const Line: Story = {
  render: () => (
    <div className="w-64 space-y-4">
      <TechLine />
      <TechLine className="w-32" />
      <TechLine className="bg-lime-500/30" />
    </div>
  ),
};

export const Divider: Story = {
  render: () => (
    <div className="w-80 space-y-4">
      <TechDivider />
      <TechDivider>Section</TechDivider>
      <TechDivider>Features</TechDivider>
    </div>
  ),
};

export const Barcode: Story = {
  render: () => (
    <div className="flex gap-8">
      <TechBarcode />
      <TechBarcode className="text-lime-500" />
    </div>
  ),
};

export const ConnectorVertical: Story = {
  render: () => (
    <div className="flex gap-8 items-center">
      <TechConnector direction="vertical" length="80px" />
      <TechConnector direction="vertical" length="120px" className="bg-lime-500/30" />
    </div>
  ),
};

export const ConnectorHorizontal: Story = {
  render: () => (
    <div className="space-y-4">
      <TechConnector direction="horizontal" length="120px" />
      <TechConnector direction="horizontal" length="200px" className="bg-lime-500/30" />
    </div>
  ),
};

export const CompleteShowcase: Story = {
  render: () => (
    <div className="space-y-8 p-8 bg-stone-950 rounded-lg border border-stone-800">
      <div className="flex items-center gap-4">
        <TechCrosshair className="text-lime-500" />
        <TechDivider>Component Showcase</TechDivider>
        <TechCrosshair className="text-lime-500" />
      </div>

      <div className="flex gap-4">
        <BadgeTech>Status</BadgeTech>
        <BadgeTech className="text-lime-500 border-lime-500/30">Online</BadgeTech>
      </div>

      <CardTech className="max-w-md">
        <CardTechHeader>
          <CardTechTitle>System Status</CardTechTitle>
          <CardTechDescription>
            All systems operational. Last checked 2 minutes ago.
          </CardTechDescription>
        </CardTechHeader>
        <CardTechFooter className="flex gap-4">
          <ButtonTech>Refresh</ButtonTech>
          <ButtonTech className="text-lime-400">Details</ButtonTech>
        </CardTechFooter>
      </CardTech>

      <div className="flex items-center justify-between">
        <TechBarcode />
        <TechConnector direction="horizontal" length="100px" />
        <TechBarcode className="text-lime-500/50" />
      </div>
    </div>
  ),
};
