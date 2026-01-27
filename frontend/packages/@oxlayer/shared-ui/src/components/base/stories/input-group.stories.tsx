import type { Meta, StoryObj } from "@storybook/react";
import { SearchIcon, MailIcon, EyeIcon } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupInput,
  InputGroupButton,
} from "../input-group";

const meta: Meta<typeof InputGroup> = {
  title: "UI/InputGroup",
  component: InputGroup,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default input group with an icon addon
 */
export const Default: Story = {
  args: {},
  render: () => (
    <InputGroup className="w-64">
      <InputGroupAddon align="inline-start">
        <InputGroupText>
          <SearchIcon />
        </InputGroupText>
      </InputGroupAddon>
      <InputGroupInput placeholder="Search..." />
    </InputGroup>
  ),
};

/**
 * Input group with text prefix and icon suffix
 */
export const WithAddons: Story = {
  args: {},
  render: () => (
    <div className="flex flex-col gap-4 w-80">
      <InputGroup>
        <InputGroupAddon align="inline-start">
          <InputGroupText>
            <MailIcon />
          </InputGroupText>
        </InputGroupAddon>
        <InputGroupInput placeholder="Email address" />
      </InputGroup>
      <InputGroup>
        <InputGroupInput placeholder="Password" type="password" />
        <InputGroupAddon align="inline-end">
          <InputGroupButton variant="ghost" size="icon-sm">
            <EyeIcon />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      <InputGroup>
        <InputGroupAddon align="inline-start">
          <InputGroupText>https://</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput placeholder="example.com" />
      </InputGroup>
    </div>
  ),
};

/**
 * Input group with button
 */
export const WithButton: Story = {
  args: {},
  render: () => (
    <InputGroup className="w-80">
      <InputGroupInput placeholder="Enter your email" />
      <InputGroupAddon align="inline-end">
        <InputGroupButton size="xs">Subscribe</InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  ),
};
