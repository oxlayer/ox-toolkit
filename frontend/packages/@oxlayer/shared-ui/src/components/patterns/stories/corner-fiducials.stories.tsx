import type { Meta, StoryObj } from "@storybook/react";
import { motion } from "motion/react";
import { CornerFiducials } from "../corner-fiducials";

const meta: Meta<typeof CornerFiducials> = {
  title: "Patterns/CornerFiducials",
  component: CornerFiducials,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const AllCorners: Story = {
  args: {
    corners: ["top-left", "top-right", "bottom-left", "bottom-right"],
  },
  render: args => (
    <motion.div
      initial="initial"
      whileHover="hover"
      className="relative w-64 h-40 border border-stone-700 bg-stone-900 flex items-center justify-center"
    >
      <CornerFiducials {...args} />
      <span className="text-stone-400 text-sm">Hover to see effect</span>
    </motion.div>
  ),
};

export const TopCornersOnly: Story = {
  args: {
    corners: ["top-left", "top-right"],
  },
  render: args => (
    <motion.div
      initial="initial"
      whileHover="hover"
      className="relative w-64 h-40 border border-stone-700 bg-stone-900 flex items-center justify-center"
    >
      <CornerFiducials {...args} />
      <span className="text-stone-400 text-sm">Top corners only</span>
    </motion.div>
  ),
};

export const BottomCornersOnly: Story = {
  args: {
    corners: ["bottom-left", "bottom-right"],
  },
  render: args => (
    <motion.div
      initial="initial"
      whileHover="hover"
      className="relative w-64 h-40 border border-stone-700 bg-stone-900 flex items-center justify-center"
    >
      <CornerFiducials {...args} />
      <span className="text-stone-400 text-sm">Bottom corners only</span>
    </motion.div>
  ),
};

export const DiagonalCorners: Story = {
  args: {
    corners: ["top-left", "bottom-right"],
  },
  render: args => (
    <motion.div
      initial="initial"
      whileHover="hover"
      className="relative w-64 h-40 border border-stone-700 bg-stone-900 flex items-center justify-center"
    >
      <CornerFiducials {...args} />
      <span className="text-stone-400 text-sm">Diagonal corners</span>
    </motion.div>
  ),
};

export const InCard: Story = {
  render: () => (
    <motion.div
      initial="initial"
      whileHover="hover"
      className="relative w-80 p-6 border border-stone-700 bg-stone-900"
    >
      <CornerFiducials />
      <h3 className="text-lg font-medium text-stone-200 mb-2">Card Title</h3>
      <p className="text-sm text-stone-400">
        This card has corner fiducials that animate on hover.
      </p>
    </motion.div>
  ),
};
