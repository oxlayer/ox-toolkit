import type { Meta, StoryObj } from "@storybook/react";

import { Tabs, TabsList, TabsPanel, TabsTab } from "../tabs";

const meta: Meta<typeof Tabs> = {
  title: "UI/Tabs",
  component: Tabs,
  parameters: {
    layout: "centered",
  },
  decorators: [
    Story => (
      <div className="w-[400px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default tabs with default variant
 */
export const Default: Story = {
  args: {},
  render: () => (
    <Tabs defaultValue="account">
      <TabsList>
        <TabsTab value="account">Account</TabsTab>
        <TabsTab value="password">Password</TabsTab>
        <TabsTab value="settings">Settings</TabsTab>
      </TabsList>
      <TabsPanel value="account">
        <p className="p-4 text-sm text-muted-foreground">Make changes to your account here.</p>
      </TabsPanel>
      <TabsPanel value="password">
        <p className="p-4 text-sm text-muted-foreground">Change your password here.</p>
      </TabsPanel>
      <TabsPanel value="settings">
        <p className="p-4 text-sm text-muted-foreground">Adjust your settings here.</p>
      </TabsPanel>
    </Tabs>
  ),
};

/**
 * Tabs with underline variant
 */
export const Underline: Story = {
  args: {},
  render: () => (
    <Tabs defaultValue="overview">
      <TabsList variant="underline">
        <TabsTab value="overview">Overview</TabsTab>
        <TabsTab value="analytics">Analytics</TabsTab>
        <TabsTab value="reports">Reports</TabsTab>
      </TabsList>
      <TabsPanel value="overview">
        <p className="p-4 text-sm text-muted-foreground">Overview content goes here.</p>
      </TabsPanel>
      <TabsPanel value="analytics">
        <p className="p-4 text-sm text-muted-foreground">Analytics content goes here.</p>
      </TabsPanel>
      <TabsPanel value="reports">
        <p className="p-4 text-sm text-muted-foreground">Reports content goes here.</p>
      </TabsPanel>
    </Tabs>
  ),
};

/**
 * Vertical tabs orientation
 */
export const Vertical: Story = {
  args: {},
  render: () => (
    <Tabs defaultValue="general" orientation="vertical">
      <TabsList variant="underline">
        <TabsTab value="general">General</TabsTab>
        <TabsTab value="security">Security</TabsTab>
        <TabsTab value="notifications">Notifications</TabsTab>
      </TabsList>
      <TabsPanel value="general">
        <p className="p-4 text-sm text-muted-foreground">General settings.</p>
      </TabsPanel>
      <TabsPanel value="security">
        <p className="p-4 text-sm text-muted-foreground">Security settings.</p>
      </TabsPanel>
      <TabsPanel value="notifications">
        <p className="p-4 text-sm text-muted-foreground">Notification preferences.</p>
      </TabsPanel>
    </Tabs>
  ),
};
