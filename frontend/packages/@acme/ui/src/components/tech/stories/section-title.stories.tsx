import type { Meta, StoryObj } from "@storybook/react";
import { SectionTitle } from "../section-title";

const meta: Meta<typeof SectionTitle> = {
  title: "Tech/SectionTitle",
  component: SectionTitle,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    badge: "Features",
    title: "Build the Future",
    description: "Create innovative solutions with cutting-edge technology",
  },
};

export const WithoutBadge: Story = {
  args: {
    title: "Our Mission",
    description: "Empowering developers to build amazing things",
  },
};

export const WithoutDescription: Story = {
  args: {
    badge: "Section",
    title: "Section Title Only",
  },
};

export const TitleOnly: Story = {
  args: {
    title: "Simple Title",
  },
};

export const LongDescription: Story = {
  args: {
    badge: "About",
    title: "Who We Are",
    description:
      "We are a team of passionate engineers and designers dedicated to building tools that help developers create better software faster. Our platform combines the power of AI with intuitive design to deliver an exceptional development experience.",
  },
};

export const ReactNodeTitle: Story = {
  args: {
    badge: "Highlight",
    title: (
      <>
        Build <span className="text-lime-400">Faster</span>
      </>
    ),
    description: "Accelerate your development workflow",
  },
};
