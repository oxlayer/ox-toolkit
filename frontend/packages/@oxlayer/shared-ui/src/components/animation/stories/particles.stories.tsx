import type { Meta, StoryObj } from "@storybook/react";
import { Star } from "lucide-react";
import { Particles, ParticlesEffect } from "../particles";

const meta = {
  title: "Animation/Particles",
  component: Particles,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof Particles>;

export default meta;
type Story = StoryObj<typeof Particles>;

export const Default: Story = {
  args: {},
  render: () => (
    <Particles className="p-8">
      <div className="w-16 h-16 bg-lime-500/20 border border-lime-500 rounded-lg flex items-center justify-center">
        <Star className="w-8 h-8 text-lime-500" />
      </div>
      <ParticlesEffect
        count={8}
        radius={40}
        spread={360}
        style={{
          backgroundColor: "#84cc16",
          borderRadius: "50%",
          width: 6,
          height: 6,
        }}
      />
    </Particles>
  ),
};

export const TopSide: Story = {
  args: {},
  render: () => (
    <Particles className="p-8">
      <div className="w-32 h-16 bg-stone-800 border border-stone-700 rounded-lg flex items-center justify-center">
        <span className="text-sm">Hover me</span>
      </div>
      <ParticlesEffect
        side="top"
        count={5}
        radius={30}
        spread={180}
        style={{
          backgroundColor: "#f59e0b",
          borderRadius: "50%",
          width: 4,
          height: 4,
        }}
      />
    </Particles>
  ),
};

export const MultipleEffects: Story = {
  args: {},
  render: () => (
    <Particles className="p-12">
      <div className="w-20 h-20 bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/50 rounded-full flex items-center justify-center">
        <span className="text-2xl">✨</span>
      </div>
      <ParticlesEffect
        side="top"
        count={4}
        radius={50}
        spread={120}
        style={{
          backgroundColor: "#a855f7",
          borderRadius: "50%",
          width: 5,
          height: 5,
        }}
      />
      <ParticlesEffect
        side="bottom"
        count={4}
        radius={50}
        spread={120}
        delay={0.2}
        style={{
          backgroundColor: "#ec4899",
          borderRadius: "50%",
          width: 5,
          height: 5,
        }}
      />
    </Particles>
  ),
};

export const CustomShape: Story = {
  args: {},
  render: () => (
    <Particles className="p-8">
      <div className="w-24 h-24 bg-blue-500/20 border border-blue-500 rounded-lg flex items-center justify-center">
        <span className="text-3xl">🚀</span>
      </div>
      <ParticlesEffect
        count={6}
        radius={60}
        spread={360}
        duration={1.2}
        style={{
          backgroundColor: "#3b82f6",
          width: 8,
          height: 8,
          transform: "rotate(45deg)",
        }}
      />
    </Particles>
  ),
};

export const SlowAnimation: Story = {
  args: {},
  render: () => (
    <Particles className="p-8">
      <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500 rounded-full flex items-center justify-center">
        <span className="text-xl">🌟</span>
      </div>
      <ParticlesEffect
        count={12}
        radius={50}
        spread={360}
        duration={2}
        holdDelay={0.1}
        style={{
          backgroundColor: "#10b981",
          borderRadius: "50%",
          width: 4,
          height: 4,
        }}
      />
    </Particles>
  ),
};
