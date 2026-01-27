import type { Meta, StoryObj } from "@storybook/react";
import { HomeIcon, InboxIcon, SearchIcon, SettingsIcon } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "../sidebar";

const meta: Meta<typeof Sidebar> = {
  title: "UI/Sidebar",
  component: Sidebar,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const menuItems = [
  { icon: HomeIcon, label: "Home" },
  { icon: InboxIcon, label: "Inbox" },
  { icon: SearchIcon, label: "Search" },
  { icon: SettingsIcon, label: "Settings" },
];

/**
 * Default sidebar with menu items
 */
export const Default: Story = {
  args: {},
  render: () => (
    <SidebarProvider>
      <div className="flex h-[400px] w-full">
        <Sidebar>
          <SidebarHeader>
            <span className="px-2 text-sm font-semibold text-foreground">App Name</span>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map(item => (
                    <SidebarMenuItem key={item.label}>
                      <SidebarMenuButton>
                        <item.icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <main className="flex-1 bg-background p-4">
          <SidebarTrigger />
          <p className="mt-4 text-sm text-muted-foreground">Main content area</p>
        </main>
      </div>
    </SidebarProvider>
  ),
};

/**
 * Sidebar with active item state
 */
export const WithActiveItem: Story = {
  args: {},
  render: () => (
    <SidebarProvider>
      <div className="flex h-[400px] w-full">
        <Sidebar>
          <SidebarHeader>
            <span className="px-2 text-sm font-semibold text-foreground">Dashboard</span>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Menu</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton isActive>
                      <HomeIcon />
                      <span>Home</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton>
                      <InboxIcon />
                      <span>Inbox</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton>
                      <SettingsIcon />
                      <span>Settings</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <main className="flex-1 bg-background p-4">
          <SidebarTrigger />
        </main>
      </div>
    </SidebarProvider>
  ),
};

/**
 * Floating variant sidebar
 */
export const FloatingVariant: Story = {
  args: {},
  render: () => (
    <SidebarProvider>
      <div className="flex h-[400px] w-full bg-muted/40">
        <Sidebar variant="floating">
          <SidebarHeader>
            <span className="px-2 text-sm font-semibold text-foreground">Floating Sidebar</span>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map(item => (
                    <SidebarMenuItem key={item.label}>
                      <SidebarMenuButton>
                        <item.icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <main className="flex-1 p-4">
          <SidebarTrigger />
        </main>
      </div>
    </SidebarProvider>
  ),
};
