import type { Meta, StoryObj } from "@storybook/react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "../resizable";

const meta: Meta<typeof ResizablePanelGroup> = {
  title: "UI/Resizable",
  component: ResizablePanelGroup,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "A resizable panel group for creating adjustable split views.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default horizontal resizable panels
 */
export const Default: Story = {
  args: {},
  render: () => (
    <ResizablePanelGroup
      direction="horizontal"
      className="min-h-[200px] w-[500px] rounded-lg border border-border"
    >
      <ResizablePanel defaultSize={50}>
        <div className="flex h-full items-center justify-center p-6">
          <span className="text-sm font-medium">Left Panel</span>
        </div>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={50}>
        <div className="flex h-full items-center justify-center p-6">
          <span className="text-sm font-medium">Right Panel</span>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  ),
};

/**
 * Vertical resizable panels
 */
export const Vertical: Story = {
  args: {},
  render: () => (
    <ResizablePanelGroup
      direction="vertical"
      className="min-h-[300px] w-[300px] rounded-lg border border-border"
    >
      <ResizablePanel defaultSize={50}>
        <div className="flex h-full items-center justify-center p-6">
          <span className="text-sm font-medium">Top Panel</span>
        </div>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={50}>
        <div className="flex h-full items-center justify-center p-6">
          <span className="text-sm font-medium">Bottom Panel</span>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  ),
};

/**
 * Resizable with visible handle grip
 */
export const WithHandle: Story = {
  args: {},
  render: () => (
    <ResizablePanelGroup
      direction="horizontal"
      className="min-h-[200px] w-[500px] rounded-lg border border-border"
    >
      <ResizablePanel defaultSize={30} minSize={20}>
        <div className="flex h-full items-center justify-center p-6">
          <span className="text-sm font-medium">Sidebar</span>
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={70}>
        <div className="flex h-full items-center justify-center p-6">
          <span className="text-sm font-medium">Content</span>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  ),
};
