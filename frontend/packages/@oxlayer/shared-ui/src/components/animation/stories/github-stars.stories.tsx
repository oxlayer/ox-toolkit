import type { Meta, StoryObj } from "@storybook/react";
import { Star } from "lucide-react";
import {
  GithubStars,
  GithubStarsIcon,
  GithubStarsLogo,
  GithubStarsNumber,
  GithubStarsParticles,
} from "../github-stars";

const meta = {
  title: "Animation/GithubStars",
  component: GithubStars,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof GithubStars>;

export default meta;
type Story = StoryObj<typeof GithubStars>;

export const Default: Story = {
  args: {},
  render: () => (
    <GithubStars value={1234} className="flex items-center gap-3 p-4 bg-stone-900 rounded-lg">
      <GithubStarsParticles size={4}>
        <GithubStarsIcon
          icon={Star}
          color="#fbbf24"
          className="w-6 h-6 text-stone-600"
          activeClassName="text-amber-400"
        />
      </GithubStarsParticles>
      <GithubStarsNumber className="text-2xl font-mono" />
    </GithubStars>
  ),
};

export const WithGithubLogo: Story = {
  args: {},
  render: () => (
    <GithubStars
      value={5678}
      className="flex items-center gap-4 p-4 bg-stone-900 border border-stone-800 rounded-lg"
    >
      <GithubStarsLogo className="w-8 h-8" />
      <div className="flex items-center gap-2">
        <GithubStarsParticles size={3}>
          <GithubStarsIcon
            icon={Star}
            color="#fbbf24"
            className="w-5 h-5 text-stone-600"
            activeClassName="text-amber-400"
          />
        </GithubStarsParticles>
        <GithubStarsNumber className="text-xl font-mono font-semibold" />
      </div>
    </GithubStars>
  ),
};

export const LargeNumber: Story = {
  args: {},
  render: () => (
    <GithubStars value={42567} className="flex flex-col items-center gap-4 p-6">
      <GithubStarsParticles size={6} count={10} radius={60}>
        <GithubStarsIcon
          icon={Star}
          color="#84cc16"
          className="w-12 h-12 text-stone-700"
          activeClassName="text-lime-400"
        />
      </GithubStarsParticles>
      <GithubStarsNumber
        className="text-4xl font-mono font-bold text-lime-400"
        thousandSeparator=","
      />
    </GithubStars>
  ),
};

export const Compact: Story = {
  args: {},
  render: () => (
    <GithubStars
      value={890}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 rounded-full"
    >
      <GithubStarsIcon
        icon={Star}
        color="#fbbf24"
        className="w-4 h-4 text-stone-500"
        activeClassName="text-amber-400"
      />
      <GithubStarsNumber className="text-sm font-mono" />
    </GithubStars>
  ),
};

export const WithLabel: Story = {
  args: {},
  render: () => (
    <GithubStars
      value={15432}
      className="flex items-center gap-3 p-4 bg-gradient-to-r from-stone-900 to-stone-800 rounded-lg border border-stone-700"
    >
      <GithubStarsLogo className="w-6 h-6" />
      <div className="flex flex-col">
        <span className="text-xs text-stone-400 uppercase tracking-wider">Stars</span>
        <GithubStarsNumber className="text-xl font-mono font-bold" thousandSeparator="," />
      </div>
      <GithubStarsParticles size={4}>
        <GithubStarsIcon
          icon={Star}
          color="#fbbf24"
          className="w-5 h-5 text-stone-600"
          activeClassName="text-amber-400"
        />
      </GithubStarsParticles>
    </GithubStars>
  ),
};
