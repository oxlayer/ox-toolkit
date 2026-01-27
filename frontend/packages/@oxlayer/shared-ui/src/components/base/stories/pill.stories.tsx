import type { Meta, StoryObj } from "@storybook/react";
import { XIcon, StarIcon } from "lucide-react";
import {
  Pill,
  PillAvatar,
  PillButton,
  PillStatus,
  PillIndicator,
  PillDelta,
  PillIcon,
  PillAvatarGroup,
} from "../pill";

const meta: Meta<typeof Pill> = {
  title: "UI/Pill",
  component: Pill,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A versatile pill/badge component with support for avatars, status indicators, and actions.",
      },
    },
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "secondary", "destructive", "outline"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default pill with simple text
 */
export const Default: Story = {
  args: {
    children: "Default Pill",
    variant: "secondary",
  },
};

/**
 * Pill with avatar and close button
 */
export const WithAvatarAndButton: Story = {
  args: {},
  render: () => (
    <Pill>
      <PillAvatar src="https://github.com/shadcn.png" fallback="CN" />
      <span>John Doe</span>
      <PillButton>
        <XIcon className="size-3" />
      </PillButton>
    </Pill>
  ),
};

/**
 * Pill with status indicator variants
 */
export const WithStatusIndicators: Story = {
  args: {},
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Pill>
        <PillIndicator variant="success" />
        <span>Online</span>
      </Pill>
      <Pill>
        <PillIndicator variant="error" />
        <span>Offline</span>
      </Pill>
      <Pill>
        <PillIndicator variant="warning" />
        <span>Away</span>
      </Pill>
      <Pill>
        <PillIndicator variant="info" pulse />
        <span>Syncing</span>
      </Pill>
    </div>
  ),
};

/**
 * Pill with delta indicators for changes
 */
export const WithDelta: Story = {
  args: {},
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Pill>
        <PillDelta delta={5} />
        <span>+5 this week</span>
      </Pill>
      <Pill>
        <PillDelta delta={-3} />
        <span>-3 this week</span>
      </Pill>
      <Pill>
        <PillDelta delta={0} />
        <span>No change</span>
      </Pill>
    </div>
  ),
};

/**
 * Pill with icon and avatar group
 */
export const WithIconAndAvatarGroup: Story = {
  args: {},
  render: () => (
    <Pill>
      <PillIcon icon={StarIcon} />
      <PillStatus>Featured</PillStatus>
      <PillAvatarGroup>
        <PillAvatar src="https://github.com/shadcn.png" fallback="A" className="ml-0" />
        <PillAvatar src="https://github.com/vercel.png" fallback="B" className="ml-0" />
        <PillAvatar fallback="+2" className="ml-0" />
      </PillAvatarGroup>
    </Pill>
  ),
};
