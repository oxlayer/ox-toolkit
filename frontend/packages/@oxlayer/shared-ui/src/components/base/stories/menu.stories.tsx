import type { Meta, StoryObj } from "@storybook/react";
import {
  CloudIcon,
  CreditCardIcon,
  LogOutIcon,
  SettingsIcon,
  UserIcon,
  UsersIcon,
} from "lucide-react";

import { Button } from "../button";
import {
  Menu,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuPopup,
  MenuSeparator,
  MenuShortcut,
  MenuTrigger,
} from "../menu";

const meta: Meta<typeof Menu> = {
  title: "UI/Menu",
  component: Menu,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default menu with common items and shortcuts
 */
export const Default: Story = {
  args: {},
  render: () => (
    <Menu>
      <MenuTrigger asChild>
        <Button variant="outline">Open Menu</Button>
      </MenuTrigger>
      <MenuPopup>
        <MenuGroup>
          <MenuGroupLabel>My Account</MenuGroupLabel>
          <MenuItem>
            <UserIcon />
            <span>Profile</span>
            <MenuShortcut>⇧⌘P</MenuShortcut>
          </MenuItem>
          <MenuItem>
            <CreditCardIcon />
            <span>Billing</span>
            <MenuShortcut>⌘B</MenuShortcut>
          </MenuItem>
          <MenuItem>
            <SettingsIcon />
            <span>Settings</span>
            <MenuShortcut>⌘S</MenuShortcut>
          </MenuItem>
        </MenuGroup>
        <MenuSeparator />
        <MenuItem>
          <LogOutIcon />
          <span>Log out</span>
          <MenuShortcut>⇧⌘Q</MenuShortcut>
        </MenuItem>
      </MenuPopup>
    </Menu>
  ),
};

/**
 * Menu with grouped items
 */
export const WithGroups: Story = {
  args: {},
  render: () => (
    <Menu>
      <MenuTrigger asChild>
        <Button variant="outline">Open Menu</Button>
      </MenuTrigger>
      <MenuPopup>
        <MenuGroup>
          <MenuGroupLabel>Team</MenuGroupLabel>
          <MenuItem>
            <UsersIcon />
            <span>Invite members</span>
          </MenuItem>
          <MenuItem>
            <CloudIcon />
            <span>Cloud settings</span>
          </MenuItem>
        </MenuGroup>
        <MenuSeparator />
        <MenuGroup>
          <MenuGroupLabel>Account</MenuGroupLabel>
          <MenuItem>
            <UserIcon />
            <span>Profile</span>
          </MenuItem>
          <MenuItem>
            <SettingsIcon />
            <span>Settings</span>
          </MenuItem>
        </MenuGroup>
      </MenuPopup>
    </Menu>
  ),
};

/**
 * Menu with destructive action
 */
export const WithDestructiveItem: Story = {
  args: {},
  render: () => (
    <Menu>
      <MenuTrigger asChild>
        <Button variant="outline">Actions</Button>
      </MenuTrigger>
      <MenuPopup>
        <MenuItem>
          <SettingsIcon />
          <span>Settings</span>
        </MenuItem>
        <MenuSeparator />
        <MenuItem variant="destructive">
          <LogOutIcon />
          <span>Delete account</span>
        </MenuItem>
      </MenuPopup>
    </Menu>
  ),
};
